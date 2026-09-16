"""
Legal Text Preprocessor for Indian Police FIRs
================================================
Handles:
- Unicode normalization and cleanup
- Indian legal acronym expansion
- Sentence splitting that respects Indian abbreviations
- Section detection (Header, Accused, Narration, Seized Items, Witnesses)
- Sentence extraction with character offsets
"""

import re
from typing import Dict, List, Any, Tuple


# ── Indian Legal Acronym Normalization ────────────────────────────────────────
LEGAL_ACRONYMS = {
    r"\bf\.?i\.?r\.?\b": "FIR",
    r"\bb\.?n\.?s\.?\b": "BNS",
    r"\bi\.?p\.?c\.?\b": "IPC",
    r"\bc\.?d\.?r\.?\b": "CDR",
    r"\bi\.?m\.?e\.?i\.?\b": "IMEI",
    r"\bh\.?v\.?t\.?\b": "High Value Target",
    r"\bw/o\b": "wife of",
    r"\bs/o\b": "son of",
    r"\bd/o\b": "daughter of",
    r"\bh/o\b": "husband of",
    r"\bu/s\b": "under section",
    r"\br/o\b": "resident of",
    r"\bP\.?S\.?\b": "Police Station",
}

# Abbreviations that should NOT trigger sentence boundary when followed by dot
# These are common in Indian police FIR text
_NO_SPLIT_ABBREVS = {
    "S.O", "S/o", "D/o", "W/o", "H/o", "R/o",
    "Mr", "Mrs", "Ms", "Dr", "Prof", "Smt", "Shri", "Sh",
    "Insp", "SI", "PSI", "ASI", "DSP", "ACP", "DCP", "SSP",
    "DIG", "IG", "DGP", "Const", "HC",
    "Ltd", "Pvt", "Co", "Corp",
    "No", "vs", "etc", "approx", "viz", "i.e", "e.g",
    "St", "Rd", "Ave", "Blvd",
    "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    "IPC", "BNS", "CrPC", "BNSS",
}

# ── Section Header Patterns ───────────────────────────────────────────────────
_SECTION_HEADERS = {
    "ACCUSED_LIST": re.compile(
        r"(?:accused|suspect[s]?|persons?\s+involved|apprehended|arrested)[:\n\r]",
        re.IGNORECASE
    ),
    "SEIZED_ITEMS": re.compile(
        r"(?:seized|recovered|property\s+seized|articles?\s+recovered|mukadma\s+property)[:\n\r]",
        re.IGNORECASE
    ),
    "WITNESSES": re.compile(
        r"(?:witness(?:es)?|deponents?|statement\s+of)[:\n\r]",
        re.IGNORECASE
    ),
    "NARRATION": re.compile(
        r"(?:gist|narration|brief\s+facts?|facts?\s+of\s+the\s+case|incident\s+details?)[:\n\r]",
        re.IGNORECASE
    ),
    "COMPLAINANT": re.compile(
        r"(?:complainant|informant)[:\n\r]",
        re.IGNORECASE
    ),
}


def _build_sentence_splitter() -> re.Pattern:
    """
    Returns a simple sentence split pattern: a period/!/? followed by whitespace
    then an uppercase letter.  Abbreviation filtering is done post-split in the
    caller, because Python's `re` does not support variable-width lookbehinds.
    """
    # Simple boundary: punctuation → whitespace → uppercase start of next sentence
    pattern = re.compile(r"(?<=[.!?])\s{1,4}(?=[A-Z])")
    return pattern


_SENTENCE_SPLITTER = _build_sentence_splitter()


class LegalTextPreprocessor:
    """
    Text preprocessor tailored for Indian Police FIRs, Statements, and Crime Reports.
    """

    def normalize_text(self, text: str) -> str:
        """
        Clean and normalize raw police report text.
        Preserves Unicode for Indian names; strips control characters.
        """
        if not text:
            return ""

        # Remove null bytes and control characters (keep newlines, tabs)
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

        # Normalize line endings
        cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")

        # Collapse multiple spaces (preserve single newlines)
        cleaned = re.sub(r"[ \t]+", " ", cleaned)

        # Collapse multiple newlines to double (paragraph separator)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

        # Normalize legal acronyms
        for pattern_str, replacement in LEGAL_ACRONYMS.items():
            cleaned = re.sub(pattern_str, replacement, cleaned, flags=re.IGNORECASE)

        return cleaned.strip()

    def split_into_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences, respecting Indian legal abbreviations.
        Also splits on newlines (common in FIR paragraph structure).
        Post-filters splits caused by known abbreviations (e.g. "S/o. Ravi").
        """
        paragraphs = re.split(r"\n+", text)
        sentences: List[str] = []
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            # Split on sentence boundaries
            parts = _SENTENCE_SPLITTER.split(para)
            # Post-filter: merge back any part that starts with a known abbreviation-tail
            merged: List[str] = []
            for part in parts:
                part = part.strip()
                if not part:
                    continue
                # If the *previous* part ended with a known abbreviation, merge back
                if merged:
                    prev = merged[-1]
                    prev_last_word = prev.rstrip(". ").split()[-1] if prev.split() else ""
                    if prev_last_word in _NO_SPLIT_ABBREVS:
                        merged[-1] = prev + " " + part
                        continue
                merged.append(part)
            for part in merged:
                if len(part) > 8:
                    sentences.append(part)
        return sentences

    def extract_sentences_with_offsets(self, text: str) -> List[Dict[str, Any]]:
        """
        Split text into sentences and record character offsets for provenance.

        Returns:
            List of {text, char_start, char_end, sentence_index}
        """
        result: List[Dict[str, Any]] = []
        paragraphs = re.split(r"(\n+)", text)  # keep separators for offset tracking

        offset = 0
        sentence_index = 0
        for chunk in paragraphs:
            if re.match(r"\n+", chunk):
                offset += len(chunk)
                continue
            # Find sentence boundaries within this chunk
            parts: List[Tuple[str, int]] = []
            last_end = 0
            for m in _SENTENCE_SPLITTER.finditer(chunk):
                sentence_text = chunk[last_end:m.start()].strip()
                if len(sentence_text) > 8:
                    parts.append((sentence_text, last_end))
                last_end = m.end()
            # Last part
            remaining = chunk[last_end:].strip()
            if len(remaining) > 8:
                parts.append((remaining, last_end))

            if not parts and len(chunk.strip()) > 8:
                parts = [(chunk.strip(), 0)]

            for sent_text, rel_start in parts:
                abs_start = offset + rel_start
                abs_end = abs_start + len(sent_text)
                result.append({
                    "text": sent_text,
                    "char_start": abs_start,
                    "char_end": abs_end,
                    "sentence_index": sentence_index,
                })
                sentence_index += 1

            offset += len(chunk)

        return result

    def detect_document_sections(self, text: str) -> Dict[str, str]:
        """
        Segment FIR text into structured sections.

        Returns:
            {
                "HEADER": str,
                "COMPLAINANT": str,
                "NARRATION": str,
                "ACCUSED_LIST": str,
                "WITNESSES": str,
                "SEIZED_ITEMS": str,
                "REMAINDER": str
            }
        """
        sections: Dict[str, str] = {
            "HEADER": "",
            "COMPLAINANT": "",
            "NARRATION": text,   # Default: entire text
            "ACCUSED_LIST": "",
            "WITNESSES": "",
            "SEIZED_ITEMS": "",
            "REMAINDER": "",
        }

        # Find header (first 300 chars typically contain FIR number, station, date)
        if len(text) > 50:
            sections["HEADER"] = text[:min(300, len(text))]

        # Extract specific sections
        for section_name, pattern in _SECTION_HEADERS.items():
            m = pattern.search(text)
            if m:
                start_idx = m.start()
                # Extract up to 500 chars or next section header
                end_idx = start_idx + 500
                sections[section_name] = text[start_idx:end_idx].strip()

        return sections

    def segment_document(self, text: str) -> Dict[str, str]:
        """
        Alias for detect_document_sections — preserves backward compatibility.
        """
        return self.detect_document_sections(text)
