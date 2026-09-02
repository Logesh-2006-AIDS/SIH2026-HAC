import re
from typing import List, Dict, Any

# High-precision Indian Domain Regex Patterns
REGEX_PATTERNS = {
    "PHONE": [
        # Indian phone numbers: +91-98765-43210, +91 9876543210, 09876543210, 9876543210
        r"(?:\+?91[\-\s]?)?[6-9]\d{9}\b",
    ],
    "VEHICLE": [
        # Indian RTO vehicle plates: DL-01-AB-1234, MH 12 CD 5678, HR26CT1234
        r"\b[A-Z]{2}[\-\s]?\d{2}[\-\s]?[A-Z]{1,2}[\-\s]?\d{4}\b",
    ],
    "FINANCIAL_ACCOUNT": [
        # Indian Bank Account / UPI / IFSC Code patterns
        r"\b[A-Z]{4}0[A-Z0-9]{6}\b",  # IFSC Code
        r"\b\d{9,18}\b",             # Generic 9-18 digit account number
        r"\b[\w\.\-]+@[a-zA-Z]{2,}\b"  # UPI ID e.g. suspect@upi
    ],
    "FIR_CASE_NO": [
        # Case / FIR Number patterns: FIR No. 101/2025, Case 9042-CR
        r"\b(?:FIR|Case|CR)[\s\.\#\-]+(?:No\.?|Num\.?)?[\s]?\d{1,5}(?:/\d{2,4})?\b",
    ],
    "TIMESTAMP_DATE": [
        # Dates: DD/MM/YYYY, YYYY-MM-DD
        r"\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b",
        r"\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b"
    ]
}

class PatternMatcher:
    """
    Fast rule-based entity extractor for deterministic criminal attributes 
    (Phones, Vehicles, Bank Accounts, FIR Numbers).
    """

    def __init__(self):
        pass

    def extract_pattern_entities(self, text: str) -> List[Dict[str, Any]]:
        extracted = []

        # 1. Phone Numbers
        for pattern in REGEX_PATTERNS["PHONE"]:
            for match in re.finditer(pattern, text):
                val = match.group(0).strip()
                extracted.append({
                    "text": val,
                    "label": "PHONE_NUMBER",
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.98,
                    "extractor": "REGEX"
                })

        # 2. Vehicle Registration Numbers
        for pattern in REGEX_PATTERNS["VEHICLE"]:
            for match in re.finditer(pattern, text):
                val = match.group(0).strip()
                # Ignore false positives like FIR numbers matching pattern
                if "FIR" not in val and "CASE" not in val:
                    extracted.append({
                        "text": val,
                        "label": "VEHICLE_NO",
                        "start": match.start(),
                        "end": match.end(),
                        "confidence": 0.95,
                        "extractor": "REGEX"
                    })

        # 3. FIR / Case Numbers
        for pattern in REGEX_PATTERNS["FIR_CASE_NO"]:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                val = match.group(0).strip()
                extracted.append({
                    "text": val,
                    "label": "CASE_NUMBER",
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.99,
                    "extractor": "REGEX"
                })

        # Deduplicate matches by span
        seen_spans = set()
        deduped = []
        for item in extracted:
            span_key = (item["start"], item["end"], item["label"])
            if span_key not in seen_spans:
                seen_spans.add(span_key)
                deduped.append(item)

        return deduped
