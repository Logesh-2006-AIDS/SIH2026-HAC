"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Legal Text Preprocessor & Document Section Segmenter
"""
import re
from typing import Dict, List, Any

# Common legal section headers in Indian First Information Reports (FIRs)
SECTION_HEADERS = [
    ("header", r"(?:FIRST\s+INFORMATION\s+REPORT|FIR\s+DETAILS|DISTRICT\s+POLICE|POLICE\s+STATION)"),
    ("complainant", r"(?:COMPLAINANT\s*/\s*INFORMANT|NAME\s+OF\s+COMPLAINANT|INFORMANT\s+DETAILS)"),
    ("accused", r"(?:DETAILS\s+OF\s+SUSPECTS|ACCUSED\s+PERSONS|NAME\s+OF\s+ACCUSED|SUSPECTS\s+INVOLVED)"),
    ("incident", r"(?:OCCURRENCE\s+OF\s+OFFENCE|INCIDENT\s+DESCRIPTION|FACTS\s+OF\s+THE\s+CASE|BRIEF\s+FACTS)"),
    ("acts_sections", r"(?:ACTS\s+AND\s+SECTIONS|OFFENCE\s+PARTICULARS|PROVISIONS\s+OF\s+LAW)"),
    ("seizures", r"(?:PARTICULARS\s+OF\s+PROPERTIES\s+STOLEN|SEIZED\s+ITEMS|RECOVERY\s+MEMO|SEIZURE\s+LIST)"),
    ("action_taken", r"(?:ACTION\s+TAKEN|INVESTIGATION\s+DETAILS|INVESTIGATING\s+OFFICER)"),
]

class LegalTextPreprocessor:
    """Preprocesses raw FIR text, OCR scans, and police logs for downstream NLP extraction."""

    def normalize_text(self, text: str) -> str:
        if not text:
            return ""
        # Fix Unicode quotes and dashes
        text = text.replace('“', '"').replace('”', '"').replace('‘', "'").replace('’', "'")
        text = text.replace('—', '-').replace('–', '-')

        # Normalize multiple whitespaces and newlines
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)

        # Remove OCR noise like consecutive non-alphanumeric junk
        text = re.sub(r'[^\w\s.,;:!?@#\/\(\)\-\+₹"\']+', ' ', text)

        return text.strip()

    def segment_document(self, text: str) -> Dict[str, str]:
        """Segments FIR into structured sections: complainant, accused, incident, acts, seizures."""
        sections: Dict[str, str] = {
            "header": "",
            "complainant": "",
            "accused": "",
            "incident": "",
            "acts_sections": "",
            "seizures": "",
            "general_text": text
        }

        # Find header indices
        header_positions = []
        for sec_name, pattern in SECTION_HEADERS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                header_positions.append((match.start(), sec_name, match.end()))

        # Sort by occurrence
        header_positions.sort(key=lambda x: x[0])

        if not header_positions:
            # Fallback if unsegmented
            sections["incident"] = text
            return sections

        # Extract section slices
        for i in range(len(header_positions)):
            curr_start_idx, curr_name, content_start = header_positions[i]
            if i + 1 < len(header_positions):
                next_start_idx = header_positions[i+1][0]
                section_body = text[content_start:next_start_idx].strip()
            else:
                section_body = text[content_start:].strip()
            sections[curr_name] = section_body

        return sections

    def __init__(self):
        self.nlp = None
        try:
            import spacy
            # Try loading English model, or create blank with sentencizer
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except Exception:
                self.nlp = spacy.blank("en")
                self.nlp.add_pipe("sentencizer")
        except Exception:
            self.nlp = None

    def split_sentences(self, text: str) -> List[str]:
        """
        Splits narrative into clean sentences using SpaCy + Legal Abbreviation protection.
        Preserves legal terms like 'FIR No.', 'u/s 302', 'Sh. Ravi Kumar', etc.
        """
        # Protect abbreviations
        safe_text = re.sub(r'\b(u/s|sec|no|mr|mrs|dr|sh|smt|adv|fir|cr|ps|vs)\.', r'\1_DOT_', text, flags=re.IGNORECASE)

        if self.nlp:
            try:
                doc = self.nlp(safe_text)
                sentences = [s.text.replace('_DOT_', '.').strip() for s in doc.sents if len(s.text.strip()) > 5]
                if sentences:
                    return sentences
            except Exception:
                pass

        # Robust regex fallback
        raw_sentences = re.split(r'(?<=[.!?])\s+', safe_text)
        cleaned = [s.replace('_DOT_', '.').strip() for s in raw_sentences if len(s.strip()) > 5]
        return cleaned
