"""
Deterministic Pattern Matcher for Indian Criminal Intelligence Documents
=========================================================================
Handles regex-based extraction for structured, high-precision attributes.

Responsibility: DETERMINISTIC extraction only.
- Phone numbers
- Vehicle registration numbers
- FIR / Case numbers
- Dates and times
- Monetary amounts
- IFSC codes / account references
- IMEI numbers

All extractors return:
  original_text     : str  — exactly as it appears in source
  normalized_value  : str  — canonical form
  char_start        : int
  char_end          : int
  extraction_method : "REGEX"
  confidence        : float  — based on pattern specificity
  type              : str
"""

import re
import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime


# ── Indian Phone Number Patterns ──────────────────────────────────────────────
# Canonical: +91XXXXXXXXXX (13 chars)
_PHONE_PATTERNS: List[re.Pattern] = [
    # +91-98765-43210 or +91 9876543210
    re.compile(r"\+91[-\s]?[6-9]\d{4}[-\s]?\d{5}\b"),
    # 091XXXXXXXXXX or 0XXXXXXXXXX
    re.compile(r"\b0(?:91)?[-\s]?[6-9]\d{4}[-\s]?\d{5}\b"),
    # Bare 10-digit starting 6-9
    re.compile(r"\b[6-9]\d{9}\b"),
    # With brackets: (9876) 543210
    re.compile(r"\([6-9]\d{3,4}\)\s?\d{5,6}\b"),
]

# ── Indian Vehicle Registration Patterns ─────────────────────────────────────
# Canonical: XX-00-XX-0000 or XX-0X-XX-0000 (state code - district - series - number)
_VEHICLE_PATTERNS: List[re.Pattern] = [
    # DL-01-AB-1234, DL-3C-AK-4589, MH 12 CD 5678, HR-55-AB-9876, UP-16-BW-9999
    re.compile(r"\b[A-Z]{2}[-\s]?\d{1,2}[A-Z]?[-\s]?[A-Z]{1,3}[-\s]?\d{1,4}\b"),
]

# ── Indian Bank Name Patterns ────────────────────────────────────────────────
_BANK_PATTERNS: List[re.Pattern] = [
    re.compile(
        r"\b(?:SBI|HDFC|ICICI|PNB|Axis|Canara|Bank\s+of\s+Baroda|Bank\s+of\s+India|"
        r"Kotak\s+Mahindra|Kotak|Yes\s+Bank|IndusInd|Union\s+Bank|IDFC|Central\s+Bank)(?:\s+Bank)?\b",
        re.IGNORECASE,
    ),
]

# ── FIR / Case Number Patterns ────────────────────────────────────────────────
_CASE_PATTERNS: List[re.Pattern] = [
    # FIR No. 101/2025, FIR No 22/24, FIR No. 89/2025
    re.compile(r"\bFIR\s*(?:No\.?|Number|#)?\s*\d{1,5}/\d{2,4}\b", re.IGNORECASE),
    # Case No. 9042, Case No 101, Case No. 512/2025
    re.compile(r"\bCase\s*(?:No\.?|Number|#)?\s*\d{1,6}(?:/\d{2,4})?\b", re.IGNORECASE),
    # CR No. 45/2024, CS 22/2025, RC 001/2025
    re.compile(r"\b(?:CR|CS|CC|RC)\s*(?:No\.?|#)?\s*\d{1,5}/\d{2,4}\b", re.IGNORECASE),
    # Crime No. 123
    re.compile(r"\bCrime\s*(?:No\.?|Number|#)\s*\d{1,6}\b", re.IGNORECASE),
]

# ── Date Patterns ─────────────────────────────────────────────────────────────
_DATE_PATTERNS: List[re.Pattern] = [
    # DD/MM/YYYY or DD-MM-YYYY
    re.compile(r"\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})\b"),
    # YYYY-MM-DD ISO
    re.compile(r"\b(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})\b"),
    # DD Month YYYY: "12 June 2025", "3rd March 2024"
    re.compile(
        r"\b(\d{1,2})(?:st|nd|rd|th)?\s+"
        r"(January|February|March|April|May|June|July|August|September|October|November|December"
        r"|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
        r"\s+(\d{4})\b",
        re.IGNORECASE,
    ),
    # Month DD, YYYY: "June 12, 2025"
    re.compile(
        r"\b(January|February|March|April|May|June|July|August|September|October|November|December"
        r"|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
        r"\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b",
        re.IGNORECASE,
    ),
    # DD.MM.YYYY
    re.compile(r"\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b"),
]

# ── Time Patterns ─────────────────────────────────────────────────────────────
_TIME_PATTERNS: List[re.Pattern] = [
    # HH:MM AM/PM
    re.compile(r"\b(\d{1,2}):(\d{2})\s*([AaPp][Mm])\b"),
    # HH:MM 24h
    re.compile(r"\b([01]?\d|2[0-3]):([0-5]\d)\b"),
    # "at 2230 hours" / "at 1430 hrs"
    re.compile(r"\bat\s+(\d{3,4})\s*(?:hrs?|hours?)\b", re.IGNORECASE),
    # "10 PM", "2 AM"
    re.compile(r"\b(\d{1,2})\s*([AaPp][Mm])\b"),
]

# ── Monetary Amount Patterns ──────────────────────────────────────────────────
_MONETARY_PATTERNS: List[re.Pattern] = [
    # ₹1,23,456 or Rs. 50,000
    re.compile(r"(?:₹|Rs\.?\s*)[\d,]+(?:\.\d{1,2})?\b", re.IGNORECASE),
    # 5 lakh, 2.5 crore
    re.compile(r"\b\d+(?:\.\d+)?\s*(?:lakh|crore|thousand|hundred)\b", re.IGNORECASE),
    # INR 5000
    re.compile(r"\bINR\s*[\d,]+\b", re.IGNORECASE),
]

# ── IFSC Code ─────────────────────────────────────────────────────────────────
_IFSC_PATTERN = re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b", re.IGNORECASE)

# ── IMEI ──────────────────────────────────────────────────────────────────────
_IMEI_PATTERN = re.compile(r"\bIMEI[:\s]*(\d{15})\b", re.IGNORECASE)

# ── Account Number (generic 9-18 digits) ─────────────────────────────────────
_ACCOUNT_PATTERN = re.compile(r"\b\d{9,18}\b")

# UPI ID
_UPI_PATTERN = re.compile(r"\b[\w.\-]+@[a-zA-Z]{2,10}\b")


# ── Normalization Functions ───────────────────────────────────────────────────

def normalize_phone(raw: str) -> str:
    """Normalize to +91XXXXXXXXXX canonical form."""
    # Strip all non-digits
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) == 10:
        return f"+91{digits}"
    # Return cleaned if non-standard
    return f"+{digits}" if not digits.startswith("+") else digits


def normalize_vehicle(raw: str) -> str:
    """Normalize to XX-00-XX-0000 canonical form."""
    # Remove spaces and hyphens, uppercase
    clean = re.sub(r"[\s\-]", "", raw.upper())
    # Try to segment: 2-char state + 2-digit district + 1-3 char series + 4-digit number
    m = re.match(r"^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$", clean)
    if m:
        return f"{m.group(1)}-{m.group(2).zfill(2)}-{m.group(3)}-{m.group(4).zfill(4)}"
    return raw.upper().strip()


def normalize_case_number(raw: str) -> str:
    """Normalize case/FIR number: uppercase, standardize spacing."""
    normalized = re.sub(r"\s+", " ", raw.strip().upper())
    normalized = re.sub(r"\s*NO\.?\s*", "/", normalized)
    return normalized


def normalize_date(raw: str) -> Optional[str]:
    """Try to normalize date string to YYYY-MM-DD ISO format. Returns None on failure."""
    # Check for ISO-format YYYY-MM-DD or YYYY/MM/DD first (don't dayfirst for these)
    iso_match = re.match(r"^(\d{4})[\-/](\d{1,2})[\-/](\d{1,2})$", raw.strip())
    if iso_match:
        y, m, d = iso_match.groups()
        try:
            return datetime(int(y), int(m), int(d)).strftime("%Y-%m-%d")
        except ValueError:
            pass
    try:
        from dateutil import parser as dp
        dt = dp.parse(raw, dayfirst=True, fuzzy=True)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None


def normalize_monetary(raw: str) -> str:
    """Normalize monetary amount — remove currency symbol, keep digits."""
    digits = re.sub(r"[₹Rs.,\s]", "", raw, flags=re.IGNORECASE)
    return digits


# ── Main PatternMatcher Class ─────────────────────────────────────────────────

class PatternMatcher:
    """
    Fast rule-based entity extractor for deterministic criminal attributes.
    Uses high-precision regex patterns for Indian legal documents.
    Returns entities with original_text + normalized_value for all types.
    """

    def _make_entity(
        self,
        entity_type: str,
        text: str,
        normalized: str,
        start: int,
        end: int,
        confidence: float,
        source_document: str = "",
        sentence: str = "",
    ) -> Dict[str, Any]:
        return {
            "id": str(uuid.uuid4()),
            "type": entity_type,
            "text": text,
            "normalized_value": normalized,
            "role": None,
            "confidence": confidence,
            "provenance": {
                "source_document": source_document,
                "sentence": sentence,
                "char_start": start,
                "char_end": end,
                "extraction_method": "REGEX",
            },
            "verification_status": "AI_SUGGESTED",
        }

    def extract_pattern_entities(
        self,
        text: str,
        source_document: str = "",
    ) -> List[Dict[str, Any]]:
        """Extract all deterministic entities from text. Returns deduplicated list."""
        extracted: List[Dict[str, Any]] = []
        seen_spans: set = set()

        def add(entity_type, raw, normalized, start, end, confidence):
            span_key = (start, end)
            if span_key in seen_spans:
                return
            seen_spans.add(span_key)
            # Extract surrounding sentence context
            left = max(0, text.rfind(".", 0, start) + 1)
            right = text.find(".", end)
            if right < 0:
                right = len(text)
            sentence_ctx = text[left:right].strip()
            extracted.append(
                self._make_entity(entity_type, raw, normalized, start, end, confidence,
                                   source_document, sentence_ctx)
            )

        # 1. Phone numbers
        for pattern in _PHONE_PATTERNS:
            for m in pattern.finditer(text):
                raw = m.group(0).strip()
                add("PHONE", raw, normalize_phone(raw), m.start(), m.end(), 0.97)

        # 2. Vehicle registrations
        for pattern in _VEHICLE_PATTERNS:
            for m in pattern.finditer(text):
                raw = m.group(0).strip()
                # Must be at least 8 chars (XX-00-X-0000 minimum)
                if len(raw.replace(" ", "").replace("-", "")) < 6:
                    continue
                # Avoid false positives: must start with a known state code pattern
                # (2 uppercase letters followed by digits)
                if not re.match(r"^[A-Z]{2}[\s\-]?\d", raw, re.IGNORECASE):
                    continue
                # Skip entries that look like case numbers or IFSC
                if re.match(r"^(FIR|CR|CS|CC|RC)\b", raw, re.IGNORECASE):
                    continue
                if _IFSC_PATTERN.match(raw.replace("-", "").replace(" ", "")):
                    continue
                # Must have a letter series (the 3rd group in plate format)
                # Strip hyphens before checking — plates have hyphens between segments
                raw_no_sep = raw.replace("-", "").replace(" ", "")
                if not re.search(r"[A-Za-z]{1,3}\d{1,4}$", raw_no_sep):
                    continue
                add("VEHICLE", raw, normalize_vehicle(raw), m.start(), m.end(), 0.93)

        # 3. FIR / Case numbers
        for pattern in _CASE_PATTERNS:
            for m in pattern.finditer(text):
                raw = m.group(0).strip()
                add("CASE", raw, normalize_case_number(raw), m.start(), m.end(), 0.99)

        # 4. Dates
        for pattern in _DATE_PATTERNS:
            for m in pattern.finditer(text):
                raw = m.group(0).strip()
                iso = normalize_date(raw)
                if iso:
                    add("DATE", raw, iso, m.start(), m.end(), 0.92)

        # 5. Times
        for pattern in _TIME_PATTERNS:
            for m in pattern.finditer(text):
                raw = m.group(0).strip()
                add("TIME", raw, raw, m.start(), m.end(), 0.90)

        # 6. Monetary amounts
        for pattern in _MONETARY_PATTERNS:
            for m in pattern.finditer(text):
                raw = m.group(0).strip()
                add("MONETARY_AMOUNT", raw, normalize_monetary(raw), m.start(), m.end(), 0.91)

        # 7. IFSC codes
        for m in _IFSC_PATTERN.finditer(text):
            raw = m.group(0).strip()
            add("BANK", raw, raw.upper(), m.start(), m.end(), 0.99)

        # 8. IMEI
        for m in _IMEI_PATTERN.finditer(text):
            raw = m.group(0).strip()
            imei_num = m.group(1)
            add("DOCUMENT", raw, imei_num, m.start(), m.end(), 0.99)

        # 9. UPI IDs (exclude email-like false positives)
        for m in _UPI_PATTERN.finditer(text):
            raw = m.group(0).strip()
            # Must not look like a standard email domain
            domain = raw.split("@")[1] if "@" in raw else ""
            if domain.lower() in ("gmail.com", "yahoo.com", "hotmail.com", "outlook.com"):
                continue
            add("FINANCIAL_ACCOUNT", raw, raw.lower(), m.start(), m.end(), 0.85)

        # 10. Banks
        for pattern in _BANK_PATTERNS:
            for m in pattern.finditer(text):
                raw = m.group(0).strip()
                add("BANK", raw, raw.title(), m.start(), m.end(), 0.95)

        return extracted
