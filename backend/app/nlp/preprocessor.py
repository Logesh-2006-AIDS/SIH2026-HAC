import re
from typing import Dict, List, Any

# Indian Legal Acronym Mapping for Normalization
LEGAL_ACRONYMS = {
    r"\bf\.?i\.?r\.?\b": "FIR",
    r"\bb\.?n\.?s\.?\b": "BNS",
    r"\bi\.?p\.?c\.?\b": "IPC",
    r"\bc\.?d\.?r\.?\b": "CDR",
    r"\bp\.?s\.?\b": "Police Station",
    r"\bi\.?m\.?e\.?i\.?\b": "IMEI",
    r"\bh\.?v\.?t\.?\b": "High Value Target",
}

class LegalTextPreprocessor:
    """
    Text preprocessor tailored for Indian Police FIRs, Statements, and Crime Reports.
    Designed for fast execution in tomorrow's hackathon demo.
    """

    def __init__(self):
        pass

    def normalize_text(self, text: str) -> str:
        """Cleans and normalizes raw police report text."""
        if not text:
            return ""

        # Basic unicode cleaning
        cleaned = text.encode("ascii", "ignore").decode("utf-8")
        
        # Replace multiple spaces/newlines
        cleaned = re.sub(r"\s+", " ", cleaned)

        # Normalize legal acronyms
        for pattern, replacement in LEGAL_ACRONYMS.items():
            cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

        return cleaned.strip()

    def segment_document(self, text: str) -> Dict[str, str]:
        """
        Segments FIR text into structured sections:
        - FIR_HEADER
        - ACCUSED_STATEMENT
        - SEIZED_ITEMS
        - INCIDENT_DETAILS
        """
        sections = {
            "HEADER": "",
            "INCIDENT_DETAILS": text,
            "ACCUSED_LIST": "",
            "SEIZED_ITEMS": ""
        }

        # Simple section header splitters
        accused_match = re.search(r"(accused|suspects?|persons? involved)[:\n]", text, re.IGNORECASE)
        seized_match = re.search(r"(seized|recovered|property seized)[:\n]", text, re.IGNORECASE)

        if accused_match:
            start_idx = accused_match.start()
            sections["ACCUSED_LIST"] = text[start_idx:start_idx+300]

        if seized_match:
            start_idx = seized_match.start()
            sections["SEIZED_ITEMS"] = text[start_idx:start_idx+300]

        return sections

    def split_into_sentences(self, text: str) -> List[str]:
        """Splits report into sentence clauses for evidence anchoring."""
        raw_sentences = re.split(r"(?<=[.!?])\s+|\n+", text)
        return [s.strip() for s in raw_sentences if len(s.strip()) > 5]
