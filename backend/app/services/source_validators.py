"""
Source Validators & Upload Safety Service
==========================================
Validates uploaded files against schemas per source type with clear error messages.
Enforces file extension whitelists, size limits, and filename sanitization.
"""
import csv
import io
import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

from app.models.ingestion import DataSourceType

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {
    DataSourceType.FIR_REPORT: {".txt", ".pdf"},
    DataSourceType.CDR: {".csv"},
    DataSourceType.FINANCIAL: {".csv", ".json"},
    DataSourceType.SOCIAL_MEDIA: {".json", ".txt"},
    DataSourceType.CRIMINAL_HISTORY: {".json", ".txt"},
    DataSourceType.SURVEILLANCE: {".json", ".txt"},
    DataSourceType.INTELLIGENCE: {".json", ".txt"},
    DataSourceType.JSON_IMPORT: {".json"},
    DataSourceType.CSV_IMPORT: {".csv"},
}


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and shell exploits across OSes."""
    clean_name = filename.replace("\\", "/").split("/")[-1]
    clean = re.sub(r"[^\w\.\-]", "_", clean_name)
    if not clean or clean.startswith("."):
        clean = f"upload_{clean.lstrip('.')}".strip("_")
    return clean


def validate_file_safety(filename: str, file_size: int, source_type: Optional[DataSourceType] = None) -> Tuple[bool, Optional[str]]:
    """Validate upload size and extension safety."""
    if file_size > MAX_FILE_SIZE_BYTES:
        return False, f"File size ({file_size} bytes) exceeds maximum allowable limit of {MAX_FILE_SIZE_BYTES} bytes (10MB)."

    ext = os.path.splitext(filename)[1].lower()
    if not ext:
        return False, "File lacks a valid file extension."

    if source_type:
        allowed = ALLOWED_EXTENSIONS.get(source_type, {".txt", ".csv", ".json", ".pdf"})
        if ext not in allowed:
            return False, f"File extension '{ext}' is not permitted for source type {source_type.value}. Allowed: {', '.join(sorted(allowed))}."
    else:
        all_allowed = {".txt", ".csv", ".json", ".pdf"}
        if ext not in all_allowed:
            return False, f"File extension '{ext}' is not supported. Supported extensions: {', '.join(sorted(all_allowed))}."

    return True, None


def validate_fir_content(content: str) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """Validate FIR text structure."""
    if not content or len(content.strip()) < 20:
        return False, "FIR document is too short or empty (minimum 20 characters required).", {}

    meta: Dict[str, Any] = {}
    fir_no_match = re.search(r"(?:FIR\s*(?:No\.?|Number)?\s*[:\-]?\s*|FIR\s+)(\d{1,6}(?:/\d{2,4})?)", content, re.IGNORECASE)
    if fir_no_match:
        meta["fir_number"] = fir_no_match.group(1)

    has_narrative = any(
        kw in content.lower()
        for kw in ("incident", "narrative", "complainant", "accused", "suspect", "section", "ipc", "crpc", "bns", "police")
    )
    if not has_narrative and not fir_no_match:
        return False, "Document does not match expected FIR structure (missing FIR number, legal sections, or narrative).", meta

    return True, None, meta


def validate_cdr_content(content: str) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """Validate CDR CSV content structure and required columns."""
    if not content or not content.strip():
        return False, "CDR file is empty.", {}

    try:
        reader = csv.DictReader(io.StringIO(content))
        headers = [h.strip().lower() for h in (reader.fieldnames or [])]
    except Exception as e:
        return False, f"Failed to parse CSV: {str(e)}", {}

    required = {"caller_number", "receiver_number"}
    alt_required = {"caller", "receiver"}
    if not (required.issubset(set(headers)) or alt_required.issubset(set(headers))):
        return False, f"CDR CSV must include 'caller_number' and 'receiver_number' columns. Found columns: {', '.join(headers)}", {}

    rows = list(reader)
    if not rows:
        return False, "CDR CSV contains header but no data rows.", {}

    return True, None, {"row_count": len(rows), "headers": headers}


def validate_financial_content(content: str, is_json: bool = False) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """Validate Financial transaction data (CSV or JSON)."""
    if not content or not content.strip():
        return False, "Financial data file is empty.", {}

    if is_json or content.strip().startswith(("{", "[")):
        try:
            data = json.loads(content)
            if isinstance(data, dict):
                data = [data]
            if not isinstance(data, list) or len(data) == 0:
                return False, "Financial JSON must contain a non-empty array of transaction records.", {}
            first = data[0]
            if not ("amount" in first or "sender_account" in first or "receiver_account" in first or "txn_id" in first):
                return False, "Financial JSON records must include amount and account/txn identifiers.", {}
            return True, None, {"record_count": len(data), "format": "JSON"}
        except Exception as e:
            return False, f"Invalid Financial JSON format: {str(e)}", {}

    try:
        reader = csv.DictReader(io.StringIO(content))
        headers = [h.strip().lower() for h in (reader.fieldnames or [])]
    except Exception as e:
        return False, f"Failed to parse Financial CSV: {str(e)}", {}

    has_acct = any("account" in h or "acc" in h or "sender" in h for h in headers)
    has_amount = any("amount" in h or "txn" in h or "value" in h for h in headers)
    if not (has_acct and has_amount):
        return False, f"Financial CSV must include account and amount columns. Found: {', '.join(headers)}", {}

    rows = list(reader)
    if not rows:
        return False, "Financial CSV contains header but no data rows.", {}

    return True, None, {"row_count": len(rows), "format": "CSV"}


def validate_social_media_content(content: str) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """Validate Social Media Intelligence JSON."""
    if not content or not content.strip():
        return False, "Social media intelligence file is empty.", {}

    try:
        data = json.loads(content)
        if isinstance(data, dict):
            data = [data]
        if not isinstance(data, list) or len(data) == 0:
            return False, "Social media intel must be a non-empty list of post objects.", {}
        first = data[0]
        if not ("platform" in first or "content" in first or "profile_handle" in first or "post_id" in first):
            return False, "Social media objects must include 'platform', 'content', or 'profile_handle'.", {}
        return True, None, {"post_count": len(data)}
    except Exception as e:
        return False, f"Invalid Social Media JSON: {str(e)}", {}


def validate_criminal_history_content(content: str) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """Validate Criminal History JSON or text."""
    if not content or not content.strip():
        return False, "Criminal history record is empty.", {}

    if content.strip().startswith(("{", "[")):
        try:
            data = json.loads(content)
            if isinstance(data, dict):
                data = [data]
            if not isinstance(data, list) or len(data) == 0:
                return False, "Criminal history JSON must contain a non-empty list of criminal dossiers.", {}
            first = data[0]
            if not ("full_name" in first or "record_id" in first or "aliases" in first):
                return False, "Criminal history objects must include 'full_name', 'record_id', or 'aliases'.", {}
            return True, None, {"record_count": len(data)}
        except Exception as e:
            return False, f"Invalid Criminal History JSON: {str(e)}", {}

    # Text format
    if len(content.strip()) < 20:
        return False, "Criminal history text is too short.", {}
    return True, None, {"format": "TEXT"}


def validate_surveillance_content(content: str) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """Validate Surveillance / Intelligence Report JSON or text."""
    if not content or not content.strip():
        return False, "Surveillance report is empty.", {}

    if content.strip().startswith(("{", "[")):
        try:
            data = json.loads(content)
            if isinstance(data, dict):
                data = [data]
            if not isinstance(data, list) or len(data) == 0:
                return False, "Surveillance JSON must contain a non-empty list of surveillance observations.", {}
            first = data[0]
            if not ("report_id" in first or "location_observed" in first or "activity_notes" in first or "entities_spotted" in first):
                return False, "Surveillance objects must contain location, observations, or entities spotted.", {}
            return True, None, {"observation_count": len(data)}
        except Exception as e:
            return False, f"Invalid Surveillance JSON: {str(e)}", {}

    if len(content.strip()) < 20:
        return False, "Surveillance text is too short.", {}
    return True, None, {"format": "TEXT"}


def validate_source_payload(
    filename: str,
    content: str,
    source_type: DataSourceType,
    file_size: int,
) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """
    Unified validation orchestrator for any source type.
    Returns (is_valid, error_message, metadata).
    """
    safe, err = validate_file_safety(filename, file_size, source_type)
    if not safe:
        return False, err, {}

    if source_type == DataSourceType.FIR_REPORT:
        return validate_fir_content(content)
    elif source_type == DataSourceType.CDR:
        return validate_cdr_content(content)
    elif source_type == DataSourceType.FINANCIAL:
        return validate_financial_content(content)
    elif source_type == DataSourceType.SOCIAL_MEDIA:
        return validate_social_media_content(content)
    elif source_type == DataSourceType.CRIMINAL_HISTORY:
        return validate_criminal_history_content(content)
    elif source_type in (DataSourceType.SURVEILLANCE, DataSourceType.INTELLIGENCE):
        return validate_surveillance_content(content)
    elif source_type == DataSourceType.JSON_IMPORT:
        try:
            json.loads(content)
            return True, None, {"format": "JSON"}
        except Exception as e:
            return False, f"Invalid JSON document: {str(e)}", {}
    elif source_type == DataSourceType.CSV_IMPORT:
        try:
            reader = csv.reader(io.StringIO(content))
            rows = list(reader)
            if not rows:
                return False, "CSV file is empty.", {}
            return True, None, {"row_count": len(rows)}
        except Exception as e:
            return False, f"Invalid CSV file: {str(e)}", {}

    return True, None, {}
