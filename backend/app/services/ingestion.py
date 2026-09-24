"""
Ingestion Pipeline Service (Phase 1)
=====================================
Multi-source ingestion entry point delegating to the 8-step IngestionPipelineOrchestrator.
Supports FIR (PDF/Text), CDR (CSV), Financial (CSV/JSON), Social Media (JSON), Criminal History (JSON/Text), and Surveillance (JSON/Text).
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

from app.models.ingestion import DataSource, DataSourceType, IngestStatus, RawEntity, PipelineStep
from app.services.ingestion_pipeline import IngestionPipelineOrchestrator
from app.services.source_validators import sanitize_filename

logger = logging.getLogger(__name__)

# ── Pattern Registry ──────────────────────────────────────────────────────────
PATTERNS = {
    "PHONE": re.compile(r"(?:\+91[-\s]?)?[6-9]\d{4}[-\s]?\d{5}", re.IGNORECASE),
    "VEHICLE": re.compile(r"[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{3,4}", re.IGNORECASE),
    "ACCOUNT": re.compile(r"\b\d{9,18}\b"),
    "IFSC": re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b", re.IGNORECASE),
    "FIR_NO": re.compile(r"FIR\s+No\.?\s*\d{1,5}/\d{4}", re.IGNORECASE),
    "CASE_NO": re.compile(r"Case\s+No\.?\s*\d{1,5}", re.IGNORECASE),
    "DATE": re.compile(r"\b(?:\d{2}/\d{2}/\d{4}|\d{4}-\d{2}-\d{2})\b"),
    "IMEI": re.compile(r"\bIMEI:\s*(\d{15})\b", re.IGNORECASE),
}


def normalize_phone(raw: str) -> str:
    """Normalize Indian phone numbers to +91-XXXXX-XXXXX format."""
    digits = re.sub(r"[^\d]", "", raw or "")
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) == 10:
        return f"+91-{digits[:5]}-{digits[5:]}"
    return raw


def normalize_vehicle(raw: str) -> str:
    """Normalize to DL-01-AB-1234 format."""
    parts = re.split(r"[-\s]+", (raw or "").strip().upper())
    return "-".join(parts)


def normalize_text(text: str) -> str:
    """Basic text cleanup."""
    text = (text or "").strip()
    return re.sub(r"\s+", " ", text)


def detect_source_type(filename: str) -> DataSourceType:
    """Auto-detect ingestion type from filename conventions."""
    name = filename.lower()
    if (name.startswith("fir") or "fir_" in name) and (name.endswith(".txt") or name.endswith(".pdf")):
        return DataSourceType.FIR_REPORT
    if "cdr" in name or "call_detail" in name or "call_log" in name:
        return DataSourceType.CDR
    if "financial" in name or "transaction" in name or "bank" in name:
        return DataSourceType.FINANCIAL
    if "social" in name or "telegram" in name or "twitter" in name:
        return DataSourceType.SOCIAL_MEDIA
    if "criminal" in name or "convict" in name or "history" in name:
        return DataSourceType.CRIMINAL_HISTORY
    if "surveillance" in name or "surv" in name or "observation" in name:
        return DataSourceType.SURVEILLANCE
    if "intel" in name or "informant" in name:
        return DataSourceType.INTELLIGENCE
    if name.endswith(".json"):
        return DataSourceType.JSON_IMPORT
    if name.endswith(".csv"):
        return DataSourceType.CSV_IMPORT
    return DataSourceType.FIR_REPORT


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
    Delegates to IngestionPipelineOrchestrator for 8-step pipeline execution.
    """
    if source_type is None:
        source_type = detect_source_type(filename)

    return IngestionPipelineOrchestrator.execute(
        db=db,
        filename=filename,
        content=content,
        source_type=source_type,
        case_id=case_id,
        file_size=file_size,
        user_id=user_id,
    )


def extract_entities_from_text(
    text: str,
    source_case_id: Optional[str] = None,
    data_source_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Legacy helper for pattern-based entity extraction."""
    entities: List[Dict[str, Any]] = []
    seen: set = set()

    for entity_type, pattern in PATTERNS.items():
        for match in pattern.finditer(text):
            raw_text = match.group(0).strip()
            if raw_text in seen:
                continue
            seen.add(raw_text)

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


def bulk_ingest_from_directory(db: Session, directory: str, case_id: Optional[str] = None) -> List[Dict]:
    """Scan a directory and ingest all supported files."""
    results = []
    supported = (".txt", ".csv", ".json", ".pdf")

    for root, _, files in os.walk(directory):
        for fname in sorted(files):
            if not fname.lower().endswith(supported):
                continue
            filepath = os.path.join(root, fname)
            try:
                if fname.lower().endswith(".pdf"):
                    from app.nlp.pdf_parser import extract_text_from_pdf_bytes
                    with open(filepath, "rb") as f:
                        content = extract_text_from_pdf_bytes(f.read())
                else:
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
