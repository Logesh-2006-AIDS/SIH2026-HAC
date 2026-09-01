"""
Phase 2 Ingestion Pipeline Service
====================================
Supports: Plain text FIR reports, CSV (CDR / Financial), JSON (Intelligence briefs).
Pipeline: Read file → Validate → Parse → Normalize → Store raw entities → Return summary.
"""
import csv
import io
import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.ingestion import DataSource, DataSourceType, IngestStatus, RawEntity

logger = logging.getLogger(__name__)

# ── Indian Legal / Criminal Pattern Registry ──────────────────────────────────
PATTERNS = {
    "PHONE": re.compile(
        r"(?:\+91[-\s]?)?[6-9]\d{4}[-\s]?\d{5}",
        re.IGNORECASE,
    ),
    "VEHICLE": re.compile(
        r"[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{3,4}",
        re.IGNORECASE,
    ),
    "ACCOUNT": re.compile(
        r"\b\d{9,18}\b"
    ),
    "IFSC": re.compile(
        r"\b[A-Z]{4}0[A-Z0-9]{6}\b",
        re.IGNORECASE,
    ),
    "FIR_NO": re.compile(
        r"FIR\s+No\.?\s*\d{1,5}/\d{4}",
        re.IGNORECASE,
    ),
    "CASE_NO": re.compile(
        r"Case\s+No\.?\s*\d{1,5}",
        re.IGNORECASE,
    ),
    "DATE": re.compile(
        r"\b(?:\d{2}/\d{2}/\d{4}|\d{4}-\d{2}-\d{2})\b"
    ),
    "IMEI": re.compile(
        r"\bIMEI:\s*(\d{15})\b",
        re.IGNORECASE,
    ),
}


# ─────────────────────────────────────────────────────────────────────────────
# TEXT NORMALIZATION UTILITIES
# ─────────────────────────────────────────────────────────────────────────────

def normalize_phone(raw: str) -> str:
    """Normalize Indian phone numbers to +91-XXXXX-XXXXX format."""
    digits = re.sub(r"[^\d]", "", raw)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) == 10:
        return f"+91-{digits[:5]}-{digits[5:]}"
    return raw


def normalize_vehicle(raw: str) -> str:
    """Normalize to DL-01-AB-1234 format."""
    parts = re.split(r"[-\s]+", raw.strip().upper())
    return "-".join(parts)


def normalize_text(text: str) -> str:
    """Basic Unicode normalization and whitespace cleanup."""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text


# ─────────────────────────────────────────────────────────────────────────────
# PATTERN-BASED ENTITY EXTRACTION
# ─────────────────────────────────────────────────────────────────────────────

def extract_entities_from_text(
    text: str,
    source_case_id: Optional[str] = None,
    data_source_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Apply regex patterns to extract structured entities from free text.
    Returns list of entity dicts ready to be stored as RawEntity rows.
    """
    entities: List[Dict[str, Any]] = []
    seen: set = set()

    for entity_type, pattern in PATTERNS.items():
        for match in pattern.finditer(text):
            raw_text = match.group(0).strip()
            if raw_text in seen:
                continue
            seen.add(raw_text)

            # Normalize per type
            normalized = raw_text
            if entity_type == "PHONE":
                normalized = normalize_phone(raw_text)
            elif entity_type == "VEHICLE":
                normalized = normalize_vehicle(raw_text)

            entities.append({
                "data_source_id": data_source_id,
                "entity_type": entity_type,
                "raw_text": raw_text,
                "normalized": normalized,
                "confidence": 1.0 if entity_type in ("PHONE", "VEHICLE", "IFSC") else 0.9,
                "source_case_id": source_case_id,
                "is_resolved": False,
                "meta": {"char_start": match.start(), "char_end": match.end()},
            })

    return entities


# ─────────────────────────────────────────────────────────────────────────────
# PARSERS PER SOURCE TYPE
# ─────────────────────────────────────────────────────────────────────────────

def parse_fir_text(content: str, case_id: Optional[str], ds_id: int) -> Tuple[List[Dict], int]:
    """Parse a plain-text FIR report and extract all pattern entities."""
    entities = extract_entities_from_text(content, source_case_id=case_id, data_source_id=ds_id)
    return entities, 1  # row_count = 1 document


def parse_cdr_csv(content: str, case_id: Optional[str], ds_id: int) -> Tuple[List[Dict], int]:
    """Parse CDR CSV and extract phone number entities from caller/receiver columns."""
    entities: List[Dict] = []
    seen_phones: set = set()
    row_count = 0

    reader = csv.DictReader(io.StringIO(content))
    for row in reader:
        row_count += 1
        for col in ("caller_number", "receiver_number"):
            raw = (row.get(col) or "").strip()
            if raw and raw not in seen_phones:
                seen_phones.add(raw)
                entities.append({
                    "data_source_id": ds_id,
                    "entity_type": "PHONE",
                    "raw_text": raw,
                    "normalized": normalize_phone(raw),
                    "confidence": 1.0,
                    "source_case_id": row.get("source_case_id") or case_id,
                    "is_resolved": False,
                    "meta": {
                        "call_id": row.get("call_id"),
                        "timestamp": row.get("timestamp"),
                        "flagged": row.get("flagged_suspicious"),
                    },
                })

    return entities, row_count


def parse_financial_csv(content: str, case_id: Optional[str], ds_id: int) -> Tuple[List[Dict], int]:
    """Parse financial transaction CSV and extract account, name, and IFSC entities."""
    entities: List[Dict] = []
    seen_accounts: set = set()
    row_count = 0

    reader = csv.DictReader(io.StringIO(content))
    for row in reader:
        row_count += 1
        for prefix in ("sender", "receiver"):
            acct = (row.get(f"{prefix}_account") or "").strip()
            name = (row.get(f"{prefix}_name") or "").strip()
            ifsc = (row.get(f"{prefix}_ifsc") or "").strip()
            bank = (row.get(f"{prefix}_bank") or "").strip()

            if acct and acct not in seen_accounts:
                seen_accounts.add(acct)
                entities.append({
                    "data_source_id": ds_id,
                    "entity_type": "FINANCIAL_ACCOUNT",
                    "raw_text": acct,
                    "normalized": acct,
                    "confidence": 1.0,
                    "source_case_id": row.get("source_case_id") or case_id,
                    "is_resolved": False,
                    "meta": {
                        "holder_name": name,
                        "ifsc": ifsc,
                        "bank": bank,
                        "flagged": row.get("flagged_suspicious"),
                    },
                })

    return entities, row_count


def parse_json_intelligence(content: str, case_id: Optional[str], ds_id: int) -> Tuple[List[Dict], int]:
    """Parse JSON intelligence briefs and extract text entities from content field."""
    entities: List[Dict] = []
    briefs = json.loads(content)

    for brief in briefs:
        brief_text = brief.get("content", "")
        ref_cases = brief.get("case_ids", [])
        sc = ref_cases[0] if ref_cases else case_id
        extracted = extract_entities_from_text(brief_text, source_case_id=sc, data_source_id=ds_id)
        for e in extracted:
            e["meta"] = {**(e.get("meta") or {}), "intel_ref": brief.get("ref"), "case_ids": ref_cases}
        entities.extend(extracted)

    return entities, len(briefs)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN INGESTION SERVICE
# ─────────────────────────────────────────────────────────────────────────────

PARSER_MAP = {
    DataSourceType.FIR_REPORT:   parse_fir_text,
    DataSourceType.CDR:          parse_cdr_csv,
    DataSourceType.FINANCIAL:    parse_financial_csv,
    DataSourceType.INTELLIGENCE: parse_json_intelligence,
}


def detect_source_type(filename: str) -> DataSourceType:
    """Auto-detect ingestion type from filename conventions."""
    name = filename.lower()
    if name.startswith("fir_") and name.endswith(".txt"):
        return DataSourceType.FIR_REPORT
    if "cdr" in name or "call_detail" in name:
        return DataSourceType.CDR
    if "financial" in name or "transaction" in name:
        return DataSourceType.FINANCIAL
    if "intel" in name or "informant" in name:
        return DataSourceType.INTELLIGENCE
    if name.endswith(".json"):
        return DataSourceType.JSON_IMPORT
    return DataSourceType.CSV_IMPORT


def ingest_document(
    db: Session,
    filename: str,
    content: str,
    source_type: Optional[DataSourceType] = None,
    case_id: Optional[str] = None,
    file_size: Optional[int] = None,
    user_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Main ingestion entry point.
    Creates DataSource record, runs parser, stores RawEntity rows.
    Returns ingestion summary dict.
    """
    if source_type is None:
        source_type = detect_source_type(filename)

    # Create DataSource tracking record
    ds = DataSource(
        filename=filename,
        source_type=source_type,
        file_size_bytes=file_size or len(content.encode("utf-8")),
        case_id_ref=case_id,
        status=IngestStatus.PROCESSING,
        ingested_by=user_id,
    )
    db.add(ds)
    db.flush()  # Get ds.id before entity inserts

    try:
        parser = PARSER_MAP.get(source_type)
        if parser is None:
            raise ValueError(f"No parser available for source type: {source_type}")

        entities, row_count = parser(content, case_id, ds.id)

        # Bulk insert RawEntity records
        for e in entities:
            raw_entity = RawEntity(
                data_source_id=ds.id,
                entity_type=e["entity_type"],
                raw_text=e["raw_text"],
                normalized=e.get("normalized"),
                confidence=e.get("confidence", 1.0),
                source_case_id=e.get("source_case_id"),
                is_resolved=False,
                meta=e.get("meta"),
            )
            db.add(raw_entity)

        ds.status = IngestStatus.COMPLETED
        ds.row_count = row_count
        db.commit()
        db.refresh(ds)

        logger.info(f"Ingested '{filename}': {len(entities)} entities extracted from {row_count} rows.")
        return {
            "data_source_id": ds.id,
            "filename": filename,
            "source_type": source_type.value,
            "status": "COMPLETED",
            "rows_processed": row_count,
            "entities_extracted": len(entities),
        }

    except Exception as exc:
        db.rollback()
        ds.status = IngestStatus.FAILED
        ds.error_log = str(exc)
        db.commit()
        logger.error(f"Ingestion failed for '{filename}': {exc}")
        raise


def bulk_ingest_from_directory(db: Session, directory: str, case_id: Optional[str] = None) -> List[Dict]:
    """
    Scan a directory and ingest all supported files (.txt, .csv, .json).
    Useful for batch-loading the generated synthetic dataset.
    """
    results = []
    supported = (".txt", ".csv", ".json")

    for root, _, files in os.walk(directory):
        for fname in sorted(files):
            if not fname.lower().endswith(supported):
                continue
            filepath = os.path.join(root, fname)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                result = ingest_document(
                    db=db,
                    filename=fname,
                    content=content,
                    case_id=case_id,
                    file_size=os.path.getsize(filepath),
                )
                results.append(result)
            except Exception as e:
                logger.warning(f"Skipping {fname}: {e}")
                results.append({"filename": fname, "status": "FAILED", "error": str(e)})

    return results
