import re
from typing import List, Dict, Any
from app.nlp.patterns import PatternMatcher

# Alias patterns e.g. "Ravi @ Ravan", "Vikram alias Viper", "Suresh (a.k.a Chota)"
ALIAS_PATTERNS = [
    r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:@|alias|a\.?k\.?a\.?|nicknamed)\s+[\"']?([A-Za-z0-9\s]+)[\"']?",
]

# Common Crime & Law Enforcement Stopwords/Titles/Organizations
CRIME_TITLES = {"Inspector", "Sub-Inspector", "PSI", "Constable", "Officer", "DSP", "ACP", "Victim", "Accused", "Complainant"}
NON_PERSON_ORG_WORDS = {"Police Station", "Crime Branch", "Delhi Police", "Special Cell", "State Police"}

class NamedEntityRecognizer:
    """
    Combined Entity Recognizer using:
    1. Fast Regex Pattern Extractor (Phones, Vehicles, FIRs)
    2. Heuristic NLP & Alias Extractor for Suspects, Gangs & Locations
    Designed for fast performance in hackathon demos without heavy GPU dependencies.
    """

    def __init__(self):
        self.pattern_matcher = PatternMatcher()

    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        entities = []

        # Step 1: Run deterministic regex pattern extractor
        regex_entities = self.pattern_matcher.extract_pattern_entities(text)
        entities.extend(regex_entities)

        # Step 2: Extract Aliases & Suspect Names (e.g. "Vikram @ Viper")
        for pattern in ALIAS_PATTERNS:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                primary_name = match.group(1).strip()
                alias_name = match.group(2).strip()

                entities.append({
                    "text": primary_name,
                    "alias": alias_name,
                    "label": "SUSPECT_PERSON",
                    "start": match.start(1),
                    "end": match.end(1),
                    "confidence": 0.96,
                    "extractor": "ALIAS_HEURISTIC"
                })

        # Step 3: Extract General Persons & Gang / Organizations
        words = text.split()
        for i, word in enumerate(words):
            # Check for Gang/Syndicate keywords
            if word.lower() in ["gang", "syndicate", "cartel", "group", "traders", "enterprises", "logistics"]:
                if i > 0 and words[i-1][0].isupper():
                    org_name = f"{words[i-1]} {word}"
                    entities.append({
                        "text": org_name,
                        "label": "CRIMINAL_ORGANIZATION",
                        "start": text.find(org_name),
                        "end": text.find(org_name) + len(org_name),
                        "confidence": 0.88,
                        "extractor": "HEURISTIC"
                    })

        # Step 4: Extract Key Suspect Names (Capitalized double words not matching titles/orgs)
        person_matches = re.finditer(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+))\b", text)
        for match in person_matches:
            name = match.group(0)
            if name in NON_PERSON_ORG_WORDS:
                continue
            if not any(title in name for title in CRIME_TITLES) and len(name) > 4:
                # Ensure it wasn't already captured as alias
                if not any(e["text"] == name for e in entities):
                    entities.append({
                        "text": name,
                        "label": "SUSPECT_PERSON",
                        "start": match.start(),
                        "end": match.end(),
                        "confidence": 0.85,
                        "extractor": "NAME_HEURISTIC"
                    })

        return entities
