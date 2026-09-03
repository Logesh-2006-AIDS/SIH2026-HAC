"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
High-Precision Hybrid Named Entity Recognizer (NER)
"""
import re
from typing import List, Dict, Any, Set
from app.nlp.patterns import PatternMatcher, ALIAS_PATTERNS

KNOWN_LOCATIONS = {
    "Delhi", "New Delhi", "Rohini", "Karol Bagh", "Okhla", "Lajpat Nagar", "Dwarka",
    "Gurgaon", "Gurugram", "Noida", "Greater Noida", "Faridabad", "Ghaziabad",
    "Mumbai", "Bandra", "Andheri", "Thane", "Navi Mumbai", "Dharavi",
    "Bengaluru", "Bangalore", "Koramangala", "Indiranagar", "Whitefield",
    "Hyderabad", "Cyberabad", "Secunderabad", "Chennai", "Kolkata", "Salt Lake",
    "Lucknow", "Gomti Nagar", "Kanpur", "Varanasi", "Prayagraj", "Allahabad",
    "Ahmedabad", "Pune", "Jaipur", "Chandigarh", "Patna", "Bhopal", "Indore"
}

POLICE_TITLES_AND_PREFIXES = {
    "Inspector", "Sub-Inspector", "SI", "PSI", "ASI", "Constable", "Head Constable",
    "DSP", "ACP", "DCP", "SP", "SSP", "SHO", "IO", "Investigating Officer", "Judge",
    "Magistrate", "Advocate", "Court", "Police Station", "Crime Branch", "Special Cell",
    "Accused", "Suspect", "Complainant", "Informant", "Victim", "Shri", "Smt", "Mr", "Mrs"
}

NON_NAME_TERMS = {
    "Police Station", "First Information", "Brief Facts", "Occurrence Of", "Case No",
    "Rohini Sector", "Karol Bagh", "Acts And", "Sections And", "Particulars Of", "State Police"
}

class NamedEntityRecognizer:
    """
    High-precision NER combining:
    1. Deterministic Indian Regex matching (Phones, Vehicles, IPC sections, Money, FIRs)
    2. Contextual & Alias parsing for Suspects and Aliases
    3. Location Gazetteer + Indian Geographic Matching
    4. Syndicate / Shell Company Detection
    """

    def __init__(self):
        self.pattern_matcher = PatternMatcher()

    def clean_person_name(self, name: str) -> str:
        words = name.split()
        # Strip leading titles / prefixes like "Accused Ravi Kumar" -> "Ravi Kumar"
        while words and words[0] in POLICE_TITLES_AND_PREFIXES:
            words.pop(0)
        return " ".join(words).strip()

    def extract_entities(self, text: str, section_info: Dict[str, str] = None) -> List[Dict[str, Any]]:
        entities: List[Dict[str, Any]] = []

        # 1. Deterministic Pattern Matching (Phones, Vehicles, IPC Sections, Currency, FIRs)
        regex_entities = self.pattern_matcher.extract_pattern_entities(text)
        entities.extend(regex_entities)

        # 2. Extract Suspect Aliases (e.g., "Ravi Kumar @ Ravan", "Vikram Singh alias Vicky")
        for p_str in ALIAS_PATTERNS:
            for match in re.finditer(p_str, text, re.IGNORECASE):
                primary_raw = match.group(1).strip()
                alias_raw = match.group(2).strip()

                primary_name = self.clean_person_name(primary_raw)
                alias_name = self.clean_person_name(alias_raw)

                if len(primary_name) > 2 and primary_name not in KNOWN_LOCATIONS:
                    entities.append({
                        "text": primary_name,
                        "alias": alias_name,
                        "normalized": primary_name,
                        "label": "SUSPECT_PERSON",
                        "start": match.start(1),
                        "end": match.end(1),
                        "confidence": 0.98,
                        "extractor": "ALIAS_REGEX",
                        "metadata": {"has_alias": True, "alias": alias_name}
                    })
                if len(alias_name) >= 2 and alias_name not in KNOWN_LOCATIONS:
                    entities.append({
                        "text": alias_name,
                        "primary_identity": primary_name,
                        "normalized": alias_name,
                        "label": "ALIAS",
                        "start": match.start(2),
                        "end": match.end(2),
                        "confidence": 0.95,
                        "extractor": "ALIAS_REGEX"
                    })

        # 3. Extract Locations from Gazetteer & Context
        for loc in KNOWN_LOCATIONS:
            pattern = rf'\b{re.escape(loc)}\b'
            for match in re.finditer(pattern, text, re.IGNORECASE):
                entities.append({
                    "text": match.group(0),
                    "normalized": loc,
                    "label": "LOCATION",
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.95,
                    "extractor": "GAZETTEER"
                })

        # 4. Extract Organizations / Gangs / Shell Companies
        org_pattern = r'\b([A-Z][a-zA-Z0-9\s]{2,25})\s+(Gang|Syndicate|Cartel|Logistics|Traders|Enterprises|Network|Pvt\s+Ltd|Limited)\b'
        for match in re.finditer(org_pattern, text):
            org_full = match.group(0).strip()
            entities.append({
                "text": org_full,
                "normalized": org_full,
                "label": "CRIMINAL_ORGANIZATION" if any(w in org_full.lower() for w in ["gang", "syndicate", "cartel"]) else "ORGANIZATION",
                "start": match.start(),
                "end": match.end(),
                "confidence": 0.94,
                "extractor": "ORG_HEURISTIC"
            })

        # 5. Extract Capitalized Person Names (e.g. "Vikram Singh", "Suresh Yadav")
        name_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b'
        for match in re.finditer(name_pattern, text):
            raw_candidate = match.group(1).strip()
            clean_name = self.clean_person_name(raw_candidate)

            if not clean_name or len(clean_name) <= 3:
                continue
            if clean_name in KNOWN_LOCATIONS or clean_name in NON_NAME_TERMS:
                continue
            if any(w in clean_name.lower() for w in ["police", "station", "report", "first", "information", "district", "state", "court", "act", "section", "brief", "facts", "sector", "road"]):
                continue

            # Check if candidate is already part of an extracted entity
            already_captured = False
            for e in entities:
                if clean_name == e.get("normalized") or clean_name == e.get("alias"):
                    already_captured = True
                    break

            if not already_captured:
                entities.append({
                    "text": clean_name,
                    "normalized": clean_name,
                    "label": "SUSPECT_PERSON",
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.88,
                    "extractor": "NAME_NER"
                })

        # Deduplicate entities
        final_entities: List[Dict[str, Any]] = []
        seen_keys: Set[str] = set()

        for ent in entities:
            norm_val = ent.get("normalized", ent["text"])
            key = f"{ent['label']}:{norm_val.lower()}"
            if key not in seen_keys:
                seen_keys.add(key)
                final_entities.append(ent)

        return final_entities
