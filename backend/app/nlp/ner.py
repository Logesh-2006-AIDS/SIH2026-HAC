"""
Named Entity Recognizer — Hybrid Approach
==========================================
Combines:
  1. Deterministic regex/rule patterns (PatternMatcher) for structured entities
  2. spaCy NER (en_core_web_sm) for PERSON / ORG / GPE / LOC
  3. Contextual role classification for PERSON entities

CRITICAL RULES:
  - A person appearing in an FIR is NOT automatically a criminal.
  - Every PERSON entity gets a role: ACCUSED | VICTIM | WITNESS | COMPLAINANT |
    INFORMANT | OFFICER | INVESTIGATOR | UNKNOWN
  - Do NOT label witnesses/officers/complainants as suspects.
  - Handle Indian name patterns: initials, S/o, D/o, W/o, titles.

Entity Types produced:
  PERSON, PHONE, VEHICLE, ORGANIZATION, LOCATION, CASE, DATE, TIME,
  FINANCIAL_ACCOUNT, BANK, MONETARY_AMOUNT, CRIME_TYPE, DOCUMENT

All entities include: id, type, text, normalized_value, role, confidence,
                      provenance, verification_status
"""

import re
import uuid
import logging
from typing import Any, Dict, List, Optional, Tuple

from app.nlp.patterns import PatternMatcher

logger = logging.getLogger(__name__)

# ── spaCy lazy loader ─────────────────────────────────────────────────────────
_SPACY_NLP = None
_SPACY_AVAILABLE = False


def _load_spacy():
    global _SPACY_NLP, _SPACY_AVAILABLE
    if _SPACY_NLP is None:
        try:
            import spacy
            _SPACY_NLP = spacy.load("en_core_web_sm")
            _SPACY_AVAILABLE = True
            logger.info("spaCy en_core_web_sm loaded successfully.")
        except Exception as e:
            logger.warning("spaCy not available (%s); falling back to heuristic NER.", e)
            _SPACY_AVAILABLE = False
    return _SPACY_NLP, _SPACY_AVAILABLE


# ── Indian name patterns ──────────────────────────────────────────────────────

# Titles preceding names
_PERSON_TITLES = (
    r"(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?|Shri|Smt\.?|Sh\.?|Sri|"
    r"Inspector|Insp\.?|SI|PSI|ASI|Sub-Inspector|"
    r"S/o|D/o|W/o|H/o|"
    r"Late\.?\s*Shri|Late\.?\s*)"
)

# Indian name pattern: optional title + 1-4 capitalized words + optional initial
_INDIAN_NAME_PATTERN = re.compile(
    r"(?:" + _PERSON_TITLES + r"\s+)?"
    r"(?:[A-Z]\.?\s+){0,2}"                    # optional initials e.g. "R.K."
    r"[A-Z][a-z]{1,20}"                        # first name
    r"(?:\s+[A-Z][a-z]{1,20}){0,3}"           # up to 3 more name parts
    r"\b"
)

# Alias patterns: "Ravi @ Ravan", "Vikram alias Viper", "Suresh a.k.a. Chota"
_ALIAS_PATTERN = re.compile(
    r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})"
    r"\s+(?:@|alias|a\.?k\.?a\.?|nicknamed|called|known\s+as)\s+"
    r"[\"']?([A-Za-z0-9\s]{2,30})[\"']?",
    re.IGNORECASE,
)


# ── Role classification ───────────────────────────────────────────────────────

_ROLE_TRIGGERS: Dict[str, List[str]] = {
    "ACCUSED": [
        "accused in", "accused of", "accused person", "the accused", "accused",
        "arrested", "was arrested", "has been arrested",
        "charged", "charged with", "named accused", "named as accused",
        "booked under", "booked for", "apprehended", "nabbed", "detained",
        "main accused", "key accused", "prime accused", "suspect", "co-conspirator",
        "accomplice", "co-accused", "defrauded", "kidnapped", "looted", "stole",
    ],
    "COMPLAINANT": [
        "complainant", "the complainant", "informant", "the informant",
        "lodged the complaint", "filed the fir", "reported the incident",
        "filed a complaint", "made the complaint", "reported that",
        "reported to the police", "approached the police",
    ],
    "VICTIM": [
        "victim", "the victim", "deceased", "the deceased",
        "injured", "the injured", "aggrieved party", "aggrieved person",
        "was killed", "was murdered", "was assaulted", "was robbed",
        "was attacked", "was kidnapped", "was raped", "fatally hit",
        "succumbed", "passed away due to",
    ],
    "WITNESS": [
        "witness", "the witness", "witnesses", "eyewitness", "panch witness",
        "deposed", "testified", "stated that he saw", "stated that she saw",
        "witnessed the incident", "was present at the scene", "stated that",
        "bystander", "gave a statement", "saw the incident", "statement was recorded",
    ],
    "OFFICER": [
        "inspector", "sub-inspector", "psi", "asi", "si", "constable",
        "head constable", "dsp", "acp", "dcp", "ssp", "dig", "ig", "dgp",
        "investigating officer", "station house officer", "sho",
        "police officer", "police personnel", "officer in charge",
    ],
    "INVESTIGATOR": [
        "investigating officer", "i.o.", "io",
        "charged with investigation", "assigned to investigate",
        "probe officer", "inquiry officer",
    ],
    "INFORMANT": [
        "secret informant", "human intelligence",
        "provided information", "tipped off", "gave a tip",
        "according to the informant", "the informant stated",
    ],
}

# Non-person organization words (prevent misclassification)
_ORG_STOPWORDS = {
    "police station", "crime branch", "special cell", "cbi", "nia", "ed",
    "narcotic control bureau", "ncb", "ib", "raw", "central bureau",
    "state police", "municipal corporation", "bank", "court",
}

# Words that are definitely not person names
_NON_PERSON_WORDS = {
    "fir", "case", "crime", "police", "court", "section", "india",
    "government", "state", "district", "municipality", "ward",
    "rupees", "amount", "account", "vehicle", "registration",
    "note", "witness", "accused", "victim", "suspect",
    # Common words that are capitalized at sentence start
    "the", "a", "an", "this", "that", "these", "those",
    "he", "she", "they", "we", "it",
}

# Crime type keywords and statutory provisions
_CRIME_TYPE_PATTERNS = re.compile(
    r"\b(?:"
    r"(?:under\s+)?(?:u/s\s+|Section\s+)?\d{1,4}[A-Z]?(?:\s*(?:and|&)\s*(?:Section\s+)?\d{1,4}[A-Z]?)?\s*(?:IPC|BNS|CrPC|IT\s+Act|NDPS\s+Act|NDPS|Arms\s+Act|POCSO|PMLA)|"
    r"(?:Section\s+\d{1,4}[A-Z]?)|"
    r"(?:u/s\s+\d{1,4}[A-Z]?)|"
    r"robbery|theft|burglary|murder|homicide|assault|rape|kidnapping|extortion|"
    r"fraud|cheating|counterfeiting|forgery|trafficking|narcotics|drug|smuggling|"
    r"dacoity|rioting|arson|abduction|blackmail|cybercrime|money\s+laundering|"
    r"hawala|ransom|sexual\s+assault|eve-teasing|stalking|bribery|corruption|"
    r"NDPS\s+Act|Arms\s+Act|POCSO|PMLA"
    r")\b",
    re.IGNORECASE,
)

# Organization triggers
_ORG_TRIGGERS = [
    "gang", "syndicate", "cartel", "group", "network", "cell",
    "enterprises", "logistics", "traders", "association",
    "company", "firm", "pvt", "ltd", "corp", "bank",
]


def _classify_role(name: str, sentence: str, full_text: str, span_start: int = -1, span_end: int = -1) -> str:
    """
    Classify the role of a person based on immediate context, sentence context, and triggers.

    Returns one of: ACCUSED, VICTIM, WITNESS, COMPLAINANT, OFFICER,
                    INVESTIGATOR, INFORMANT, UNKNOWN
    """
    # 1. Immediate neighborhood check around the name occurrence
    name_lower = name.lower()
    pos = span_start if span_start >= 0 else full_text.lower().find(name_lower)
    if pos >= 0:
        left_ctx = full_text[max(0, pos - 40):pos].lower()
        right_ctx = full_text[pos + len(name):min(len(full_text), pos + len(name) + 40)].lower()

        # Check immediate prefix
        if re.search(r"\b(?:prime\s+|key\s+|main\s+)?(?:accused|suspect|co-accused|co-conspirator|accomplice)\b", left_ctx):
            return "ACCUSED"
        if re.search(r"\b(?:complainant|informant|lodged\s+by)\b", left_ctx):
            return "COMPLAINANT"
        if re.search(r"\b(?:injured\s+victim|deceased\s+victim|victim|deceased|injured)\b", left_ctx):
            return "VICTIM"
        if re.search(r"\b(?:eyewitness|panch\s+witness|witness)\b", left_ctx):
            return "WITNESS"
        if re.search(r"\b(?:inspector|sub-inspector|psi|asi|si|dsp|acp|dcp|sho|constable|officer)\b", left_ctx):
            return "OFFICER"

        # Check immediate following words
        if re.search(r"^\s+(?:is\s+the\s+accused|was\s+the\s+accused|assaulted|stole|defrauded|kidnapped|looted|demanded)", right_ctx):
            return "ACCUSED"
        if re.search(r"^\s+(?:reported|filed|lodged)", right_ctx):
            return "COMPLAINANT"
        if re.search(r"^\s+(?:stated|deposed|testified|saw)", right_ctx):
            return "WITNESS"
        if re.search(r"^\s+(?:was\s+killed|was\s+murdered|was\s+assaulted|succumbed|fatally)", right_ctx):
            return "VICTIM"

    # 2. Sentence-level trigger matching with word boundaries
    sent_lower = sentence.lower()
    priority = ["COMPLAINANT", "WITNESS", "VICTIM", "ACCUSED", "OFFICER", "INVESTIGATOR", "INFORMANT"]

    for role in priority:
        triggers = _ROLE_TRIGGERS.get(role, [])
        for trigger in triggers:
            # Word boundary regex prevents "io" matching inside "station" or "section"
            if re.search(r"\b" + re.escape(trigger.lower()) + r"\b", sent_lower):
                return role

    return "UNKNOWN"


def _make_person_entity(
    name: str,
    role: str,
    confidence: float,
    start: int,
    end: int,
    sentence: str,
    source_document: str,
    alias: Optional[str] = None,
) -> Dict[str, Any]:
    """Build a standardized PERSON entity dict."""
    entity = {
        "id": str(uuid.uuid4()),
        "type": "PERSON",
        "text": name.strip(),
        "normalized_value": name.strip().lower(),
        "role": role,
        "alias": alias,
        "confidence": confidence,
        "provenance": {
            "source_document": source_document,
            "sentence": sentence,
            "char_start": start,
            "char_end": end,
            "extraction_method": "HEURISTIC" if alias is None else "ALIAS_PATTERN",
        },
        "verification_status": "AI_SUGGESTED",
    }
    return entity


def _make_entity(
    entity_type: str,
    text: str,
    normalized: str,
    start: int,
    end: int,
    sentence: str,
    source_document: str,
    confidence: float,
    extraction_method: str,
    role: Optional[str] = None,
) -> Dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "type": entity_type,
        "text": text.strip(),
        "normalized_value": normalized,
        "role": role,
        "confidence": confidence,
        "provenance": {
            "source_document": source_document,
            "sentence": sentence,
            "char_start": start,
            "char_end": end,
            "extraction_method": extraction_method,
        },
        "verification_status": "AI_SUGGESTED",
    }


class NamedEntityRecognizer:
    """
    Hybrid Named Entity Recognizer.
    Combines spaCy NER with Indian-domain heuristics and role classification.
    """

    def __init__(self):
        self.pattern_matcher = PatternMatcher()

    def _get_sentence_context(self, text: str, start: int, end: int) -> str:
        """Get the sentence containing the span [start, end]."""
        left = text.rfind(".", 0, start)
        left = left + 1 if left >= 0 else 0
        right = text.find(".", end)
        right = right if right > 0 else len(text)
        return text[left:right].strip()

    def _extract_aliases(
        self, text: str, source_document: str
    ) -> Tuple[List[Dict], set]:
        """
        Extract explicitly aliased persons: "Ravi alias Ravan"
        Returns (entities, set of alias entity names already captured).
        """
        entities = []
        aliased_names: set = set()

        for match in _ALIAS_PATTERN.finditer(text):
            primary = match.group(1).strip()
            alias = match.group(2).strip()
            sentence = self._get_sentence_context(text, match.start(), match.end())
            role = _classify_role(primary, sentence, text)

            entity = _make_person_entity(
                name=primary,
                role=role,
                confidence=0.96,
                start=match.start(1),
                end=match.end(1),
                sentence=sentence,
                source_document=source_document,
                alias=alias,
            )
            entities.append(entity)
            aliased_names.add(primary.lower())
            aliased_names.add(alias.lower())

        return entities, aliased_names

    def _extract_persons_spacy(
        self, text: str, source_document: str, already_extracted: set
    ) -> List[Dict]:
        """Use spaCy to find PERSON entities, with robust span cleaning and prefix role extraction."""
        nlp, available = _load_spacy()
        if not available or nlp is None:
            return []

        entities = []
        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ not in ("PERSON", "PER"):
                continue
            name = ent.text.strip()
            name_lower = name.lower()

            # Skip organizations/stations/banks misclassified as persons
            if any(w in name_lower for w in ["police", "station", "branch", "court", "bank", "metro", "cell", "hospital"]):
                continue

            # Strip leading role keywords (e.g. "accused Amit Verma falsely" -> "Amit Verma")
            detected_role = None
            role_prefix_match = re.match(
                r"^(?:(?:the|prime|key|main)\s+)?(accused|complainant|witness|victim|eyewitness|panch\s+witness|inspector|sub-inspector|si|asi|dsp|acp|dcp|sho|deceased|injured|suspect|accomplice|co-conspirator)\s+",
                name,
                re.IGNORECASE,
            )
            if role_prefix_match:
                kw = role_prefix_match.group(1).lower()
                if kw in ("accused", "suspect", "accomplice", "co-conspirator"):
                    detected_role = "ACCUSED"
                elif kw in ("complainant",):
                    detected_role = "COMPLAINANT"
                elif kw in ("witness", "eyewitness", "panch witness"):
                    detected_role = "WITNESS"
                elif kw in ("victim", "deceased", "injured"):
                    detected_role = "VICTIM"
                elif kw in ("inspector", "sub-inspector", "si", "asi", "dsp", "acp", "dcp", "sho"):
                    detected_role = "OFFICER"
                name = name[role_prefix_match.end():].strip()

            # Strip trailing adverbs/words: "falsely", "allegedly"
            name = re.sub(r"\s+(?:falsely|allegedly|yesterday|night|today|unlawfully)$", "", name, flags=re.IGNORECASE).strip()

            name_lower = name.lower()
            if name_lower in already_extracted or name_lower in _NON_PERSON_WORDS:
                continue
            if len(name) < 3:
                continue
            if name_lower in {t for triggers in _ROLE_TRIGGERS.values() for t in triggers}:
                continue

            sentence = self._get_sentence_context(text, ent.start_char, ent.end_char)
            role = detected_role or _classify_role(name, sentence, text, ent.start_char, ent.end_char)

            entity = _make_person_entity(
                name=name,
                role=role,
                confidence=0.85 if detected_role else 0.82,
                start=ent.start_char,
                end=ent.end_char,
                sentence=sentence,
                source_document=source_document,
            )
            entity["provenance"]["extraction_method"] = "SPACY_NER"
            entities.append(entity)
            already_extracted.add(name_lower)

        return entities

    def _extract_persons_heuristic(
        self, text: str, source_document: str, already_extracted: set
    ) -> List[Dict]:
        """
        Heuristic extraction for Indian names not caught by spaCy.
        Looks for:
        - Title + Name patterns
        - S/o, D/o, W/o followed by name
        - Capitalized 2-4 word sequences not in stop lists
        """
        entities = []

        # Title-prefixed names: "Inspector Ramesh Kumar", "Shri Ajay Singh"
        title_pattern = re.compile(
            r"\b(" + _PERSON_TITLES + r")\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b"
        )
        for match in title_pattern.finditer(text):
            full_name = match.group(2).strip()
            title = match.group(1).strip()
            name_lower = full_name.lower()
            if name_lower in already_extracted or name_lower in _NON_PERSON_WORDS:
                continue
            if len(full_name) < 3:
                continue

            sentence = self._get_sentence_context(text, match.start(), match.end())
            # Title gives us a role hint
            role = "UNKNOWN"
            title_lower = title.lower()
            if any(t in title_lower for t in ["inspector", "si", "psi", "dsp", "const", "officer", "sho"]):
                role = "OFFICER"
            else:
                role = _classify_role(full_name, sentence, text, match.start(2), match.end(2))

            entity = _make_person_entity(
                name=full_name,
                role=role,
                confidence=0.88,
                start=match.start(2),
                end=match.end(2),
                sentence=sentence,
                source_document=source_document,
            )
            entity["provenance"]["extraction_method"] = "TITLE_HEURISTIC"
            entities.append(entity)
            already_extracted.add(name_lower)

        # S/o, D/o, W/o — "Ravi Kumar S/o Suresh Kumar"
        relation_pattern = re.compile(
            r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(?:S/o|D/o|W/o|H/o|son\s+of|daughter\s+of|wife\s+of)\s+"
            r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})",
            re.IGNORECASE,
        )
        for match in relation_pattern.finditer(text):
            for group_idx in (1, 2):
                name = match.group(group_idx).strip()
                name_lower = name.lower()
                if name_lower in already_extracted or name_lower in _NON_PERSON_WORDS:
                    continue
                sentence = self._get_sentence_context(text, match.start(), match.end())
                role = _classify_role(name, sentence, text, match.start(group_idx), match.end(group_idx))
                entity = _make_person_entity(
                    name=name,
                    role=role,
                    confidence=0.90,
                    start=match.start(group_idx),
                    end=match.end(group_idx),
                    sentence=sentence,
                    source_document=source_document,
                )
                entity["provenance"]["extraction_method"] = "RELATION_HEURISTIC"
                entities.append(entity)
                already_extracted.add(name_lower)

        # General capitalized 2-3 word names not caught above
        general_pattern = re.compile(r"\b([A-Z][a-z]{2,20}(?:\s+[A-Z][a-z]{2,20}){1,2})\b")
        for match in general_pattern.finditer(text):
            name = match.group(0).strip()
            name_lower = name.lower()

            if name_lower in already_extracted:
                continue
            if name_lower in _NON_PERSON_WORDS:
                continue
            # Skip if it's a known location/org indicator word
            if any(w in name_lower for w in ["police station", "crime branch", "court", "bank", "police", "hospital"]):
                continue
            # Must be at least 2 words
            if len(name.split()) < 2:
                continue

            sentence = self._get_sentence_context(text, match.start(), match.end())
            role = _classify_role(name, sentence, text, match.start(), match.end())

            entity = _make_person_entity(
                name=name,
                role=role,
                confidence=0.70,  # Lower confidence for generic heuristic
                start=match.start(),
                end=match.end(),
                sentence=sentence,
                source_document=source_document,
            )
            entity["provenance"]["extraction_method"] = "NAME_HEURISTIC"
            entities.append(entity)
            already_extracted.add(name_lower)

        return entities

    def _extract_organizations_spacy(
        self, text: str, source_document: str, already_extracted: set
    ) -> List[Dict]:
        """Use spaCy to find ORG entities, filtering out misclassified persons, locations, and vehicles."""
        nlp, available = _load_spacy()
        if not available or nlp is None:
            return []

        entities = []
        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ not in ("ORG",):
                continue
            org_name = ent.text.strip()
            org_lower = org_name.lower()
            if org_lower in already_extracted:
                continue
            if len(org_name) < 3:
                continue

            # If it looks like a vehicle plate (e.g. UP-16-BW-9999)
            if re.match(r"^[A-Z]{2}[-\s]?\d", org_name):
                continue

            # If it's preceded by role prefix or contains role words -> it's a person, not an org!
            prec = text[max(0, ent.start_char - 25):ent.start_char].lower()
            if any(r in prec for r in ["victim", "accused", "witness", "complainant", "inspector", "sub-inspector"]):
                continue

            # If it looks like an Indian location
            if any(l in org_lower for l in ["lines", "nagar", "market", "colony", "vihar", "chowk", "sector", "road", "street"]):
                continue

            # If it looks like an Indian person name without org indicators
            # e.g. "Harish Chopra", "Pradeep Agarwal", "Manpreet Dhillon"
            if len(org_name.split()) in (2, 3) and not any(ind in org_lower for ind in ["bank", "station", "branch", "ltd", "pvt", "corp", "solutions", "police", "agency", "board", "cell", "wing", "tech", "hospital"]):
                continue

            sentence = self._get_sentence_context(text, ent.start_char, ent.end_char)
            entities.append(_make_entity(
                entity_type="ORGANIZATION",
                text=org_name,
                normalized=org_name.lower(),
                start=ent.start_char,
                end=ent.end_char,
                sentence=sentence,
                source_document=source_document,
                confidence=0.80,
                extraction_method="SPACY_NER",
            ))
            already_extracted.add(org_lower)

        return entities

    def _extract_locations_spacy(
        self, text: str, source_document: str, already_extracted: set
    ) -> List[Dict]:
        """Use spaCy to find GPE / LOC entities."""
        nlp, available = _load_spacy()
        if not available or nlp is None:
            return []

        entities = []
        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ not in ("GPE", "LOC", "FAC"):
                continue
            loc_name = ent.text.strip()
            loc_lower = loc_name.lower()
            if loc_lower in already_extracted:
                continue

            sentence = self._get_sentence_context(text, ent.start_char, ent.end_char)
            entities.append(_make_entity(
                entity_type="LOCATION",
                text=loc_name,
                normalized=loc_name.lower(),
                start=ent.start_char,
                end=ent.end_char,
                sentence=sentence,
                source_document=source_document,
                confidence=0.80,
                extraction_method="SPACY_NER",
            ))
            already_extracted.add(loc_lower)

        return entities

    def _extract_crime_types(self, text: str, source_document: str) -> List[Dict]:
        """Extract crime type mentions."""
        entities = []
        seen: set = set()
        for match in _CRIME_TYPE_PATTERNS.finditer(text):
            crime = match.group(0).strip()
            crime_lower = crime.lower()
            if crime_lower in seen:
                continue
            seen.add(crime_lower)
            sentence = self._get_sentence_context(text, match.start(), match.end())
            entities.append(_make_entity(
                entity_type="CRIME_TYPE",
                text=crime,
                normalized=crime_lower,
                start=match.start(),
                end=match.end(),
                sentence=sentence,
                source_document=source_document,
                confidence=0.88,
                extraction_method="REGEX",
            ))
        return entities

    def _extract_gang_organizations_heuristic(
        self, text: str, source_document: str, already_extracted: set
    ) -> List[Dict]:
        """Heuristic extraction for gang/criminal organization names."""
        entities = []
        words = text.split()
        for i, word in enumerate(words):
            if word.lower() in _ORG_TRIGGERS:
                if i > 0:
                    prev = words[i - 1]
                    if prev and prev[0].isupper():
                        org_name = f"{prev} {word}"
                        org_lower = org_name.lower()
                        if org_lower in already_extracted:
                            continue
                        start = text.find(org_name)
                        if start >= 0:
                            sentence = self._get_sentence_context(text, start, start + len(org_name))
                            entities.append(_make_entity(
                                entity_type="ORGANIZATION",
                                text=org_name,
                                normalized=org_lower,
                                start=start,
                                end=start + len(org_name),
                                sentence=sentence,
                                source_document=source_document,
                                confidence=0.80,
                                extraction_method="HEURISTIC",
                            ))
                            already_extracted.add(org_lower)
        return entities

    def extract_entities(
        self,
        text: str,
        source_document: str = "",
    ) -> List[Dict[str, Any]]:
        """
        Full entity extraction pipeline.

        Step 1: Deterministic pattern extraction (phones, vehicles, dates, etc.)
        Step 2: Alias-based person extraction
        Step 3: spaCy NER for persons, orgs, locations
        Step 4: Heuristic fallback for Indian names not caught by spaCy
        Step 5: Crime type extraction
        Step 6: Organization heuristic fallback

        All entities include type, role (for persons), confidence, provenance.
        """
        all_entities: List[Dict] = []
        extracted_names: set = set()  # Track already-found entities to avoid duplicates

        # 1. Deterministic patterns
        pattern_entities = self.pattern_matcher.extract_pattern_entities(text, source_document)
        all_entities.extend(pattern_entities)

        # 2. Alias extraction (before spaCy so they don't get re-extracted)
        alias_entities, aliased_names = self._extract_aliases(text, source_document)
        all_entities.extend(alias_entities)
        extracted_names.update(aliased_names)

        # 3. spaCy NER — persons
        spacy_persons = self._extract_persons_spacy(text, source_document, extracted_names)
        all_entities.extend(spacy_persons)

        # 4. spaCy NER — organizations
        spacy_orgs = self._extract_organizations_spacy(text, source_document, extracted_names)
        all_entities.extend(spacy_orgs)

        # 5. spaCy NER — locations
        spacy_locs = self._extract_locations_spacy(text, source_document, extracted_names)
        all_entities.extend(spacy_locs)

        # 6. Heuristic person extraction (fallback for Indian names spaCy missed)
        heuristic_persons = self._extract_persons_heuristic(text, source_document, extracted_names)
        all_entities.extend(heuristic_persons)

        # 7. Crime types
        crime_entities = self._extract_crime_types(text, source_document)
        all_entities.extend(crime_entities)

        # 8. Gang/org heuristic
        gang_orgs = self._extract_gang_organizations_heuristic(text, source_document, extracted_names)
        all_entities.extend(gang_orgs)

        return all_entities
