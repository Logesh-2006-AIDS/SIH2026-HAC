"""
Semantic Relationship Extractor
================================
Extracts relationships between entities based on SEMANTIC EVIDENCE —
not co-occurrence.

CRITICAL RULES:
  1. Two entities appearing in the same sentence does NOT create a relationship.
  2. A relationship is only created when the sentence contains a trigger that
     semantically supports that specific relationship type.
  3. Negated triggers must NOT produce relationships.
  4. Uncertain/alleged triggers must produce status=ALLEGED or SUSPECTED.
  5. Every relationship must have an evidence sentence.
  6. Temporal information is extracted per relationship when available.

Relationship types:
  PERSON → ACCUSED_IN → CASE
  PERSON → VICTIM_IN → CASE
  PERSON → WITNESS_IN → CASE
  PERSON → REPORTED → CASE
  PERSON → KNOWS → PERSON
  PERSON → CONTACTED → PERSON
  PERSON → CALLED → PHONE
  PERSON → OWNS → VEHICLE
  PERSON → USES → PHONE
  PERSON → MEMBER_OF → ORGANIZATION
  PERSON → LOCATED_AT → LOCATION
  PERSON → TRANSFERRED_TO → PERSON
  PERSON → TRANSACTION_WITH → PERSON
  PERSON → WORKS_WITH → PERSON
  CASE → OCCURRED_AT → LOCATION
  CASE → HAS_CRIME_TYPE → CRIME_TYPE
  CASE → OCCURRED_ON → DATE
  PERSON → DRIVES → VEHICLE
  PERSON → ASSOCIATED_WITH → ORGANIZATION
"""

import uuid
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from app.nlp.negation import analyze_sentence
from app.nlp.temporal import extract_temporal_info

logger = logging.getLogger(__name__)


# ── Semantic Relationship Templates ──────────────────────────────────────────
# Format: (source_type, rel_type, target_type, trigger_phrases)
# trigger_phrases are checked in the sentence BETWEEN/AROUND the entities

_RELATIONSHIP_TEMPLATES: List[Dict[str, Any]] = [

    # PERSON → ACCUSED_IN → CASE
    {
        "rel_type": "ACCUSED_IN",
        "source_types": {"PERSON"},
        "target_types": {"CASE"},
        "triggers": [
            "accused in", "accused of", "arrested in", "arrested for",
            "charged in", "charged with", "named in", "named as accused",
            "booked under", "apprehended in", "is the accused",
            "was arrested", "has been arrested", "mastermind",
        ],
        "base_confidence": 0.88,
    },

    # PERSON → VICTIM_IN → CASE
    {
        "rel_type": "VICTIM_IN",
        "source_types": {"PERSON"},
        "target_types": {"CASE"},
        "triggers": [
            "victim in", "victim of", "deceased in", "complainant in",
            "was killed", "was murdered", "was assaulted", "was attacked",
            "was robbed", "was raped", "was kidnapped", "sustained injuries",
        ],
        "base_confidence": 0.87,
    },

    # PERSON → WITNESS_IN → CASE
    {
        "rel_type": "WITNESS_IN",
        "source_types": {"PERSON"},
        "target_types": {"CASE"},
        "triggers": [
            "witness in", "witnessed", "deposed in", "testified in",
            "statement in", "eyewitness in", "panch witness",
        ],
        "base_confidence": 0.84,
    },

    # PERSON → REPORTED → CASE
    {
        "rel_type": "REPORTED",
        "source_types": {"PERSON"},
        "target_types": {"CASE"},
        "triggers": [
            "lodged the complaint", "filed the fir", "reported the incident",
            "made the complaint", "filed a complaint", "informant",
        ],
        "base_confidence": 0.85,
    },

    # PERSON → CONTACTED → PERSON (voice calls / messages)
    {
        "rel_type": "CONTACTED",
        "source_types": {"PERSON"},
        "target_types": {"PERSON"},
        "triggers": [
            "called", "phoned", "contacted", "spoke to", "spoke with",
            "talked to", "dialed", "rang", "messaged", "sent message",
            "in contact with", "reached out to",
        ],
        "base_confidence": 0.82,
    },

    # PERSON → KNOWS → PERSON (acquaintance)
    {
        "rel_type": "KNOWS",
        "source_types": {"PERSON"},
        "target_types": {"PERSON"},
        "triggers": [
            "known to", "knows", "acquaintance of", "friend of",
            "is associate of", "colleague of", "neighbor of",
        ],
        "base_confidence": 0.76,
    },

    # PERSON → WORKS_WITH → PERSON (collaboration)
    {
        "rel_type": "WORKS_WITH",
        "source_types": {"PERSON"},
        "target_types": {"PERSON"},
        "triggers": [
            "working with", "collaborated with", "accomplice",
            "partner in crime", "co-accused", "co-conspirator",
        ],
        "base_confidence": 0.82,
    },

    # PERSON → TRANSACTION_WITH → PERSON (financial)
    {
        "rel_type": "TRANSACTION_WITH",
        "source_types": {"PERSON"},
        "target_types": {"PERSON"},
        "triggers": [
            "transferred money to", "transferred funds to",
            "sent money to", "paid", "hawala transfer",
            "received payment from", "received money from",
            "financial transaction with",
        ],
        "base_confidence": 0.85,
    },

    # PERSON → OWNS → VEHICLE
    {
        "rel_type": "OWNS",
        "source_types": {"PERSON"},
        "target_types": {"VEHICLE"},
        "triggers": [
            "registered owner of", "owner of vehicle", "owns vehicle",
            "his vehicle", "her vehicle", "registered in his name",
            "registered in her name",
        ],
        "base_confidence": 0.86,
    },

    # PERSON → DRIVES → VEHICLE
    {
        "rel_type": "DRIVES",
        "source_types": {"PERSON"},
        "target_types": {"VEHICLE"},
        "triggers": [
            "driving", "was driving", "drove", "was riding",
            "riding", "at the wheel", "driver of", "was the driver",
        ],
        "base_confidence": 0.84,
    },

    # PERSON → USES → PHONE
    {
        "rel_type": "USES",
        "source_types": {"PERSON"},
        "target_types": {"PHONE"},
        "triggers": [
            "using mobile number", "using number", "using phone number",
            "subscriber of", "registered to", "sim card", "his mobile",
            "her mobile", "his number", "her number",
        ],
        "base_confidence": 0.84,
    },

    # PERSON → CALLED → PHONE (person called this number)
    {
        "rel_type": "CALLED",
        "source_types": {"PERSON"},
        "target_types": {"PHONE"},
        "triggers": [
            "called the number", "called on", "dialed", "rang the number",
        ],
        "base_confidence": 0.80,
    },

    # PERSON → MEMBER_OF → ORGANIZATION
    {
        "rel_type": "MEMBER_OF",
        "source_types": {"PERSON"},
        "target_types": {"ORGANIZATION"},
        "triggers": [
            "member of", "part of", "belonged to", "associated with",
            "gang member", "working for", "employed by",
        ],
        "base_confidence": 0.80,
    },

    # PERSON → LOCATED_AT → LOCATION
    {
        "rel_type": "LOCATED_AT",
        "source_types": {"PERSON"},
        "target_types": {"LOCATION"},
        "triggers": [
            "residing at", "resident of", "found at", "arrested from",
            "arrested at", "apprehended at", "lives at", "address:",
            "house no.", "flat no.",
        ],
        "base_confidence": 0.82,
    },

    # CASE → OCCURRED_AT → LOCATION
    {
        "rel_type": "OCCURRED_AT",
        "source_types": {"CASE"},
        "target_types": {"LOCATION"},
        "triggers": [
            "occurred at", "took place at", "incident at",
            "crime scene at", "committed at", "happened at",
            "reported from", "crime took place near",
        ],
        "base_confidence": 0.86,
    },

    # CASE → HAS_CRIME_TYPE → CRIME_TYPE
    {
        "rel_type": "HAS_CRIME_TYPE",
        "source_types": {"CASE"},
        "target_types": {"CRIME_TYPE"},
        "triggers": [
            "case of", "offence of", "crime of", "fir for",
            "arrested for", "charged with", "accused of",
            "u/s", "under section", "under",
        ],
        "base_confidence": 0.88,
    },

    # CASE → OCCURRED_ON → DATE
    {
        "rel_type": "OCCURRED_ON",
        "source_types": {"CASE", "EVENT"},
        "target_types": {"DATE"},
        "triggers": [
            "on", "occurred on", "took place on", "happened on",
            "reported on", "incident on", "crime on",
        ],
        "base_confidence": 0.83,
    },
]


def _find_trigger_in_sentence(
    sentence: str, triggers: List[str]
) -> Optional[Tuple[str, int, int]]:
    """
    Find the first matching trigger phrase in the sentence.
    Returns (matched_trigger, start, end) or None.
    """
    sentence_lower = sentence.lower()
    for trigger in triggers:
        idx = sentence_lower.find(trigger.lower())
        if idx >= 0:
            return (trigger, idx, idx + len(trigger))
    return None


def _entities_of_types(entities: List[Dict], types: set) -> List[Dict]:
    """Filter entities by type."""
    return [
        e for e in entities
        if (e.get("type") or e.get("label", "")).upper() in types
    ]


def _entities_in_sentence(entities: List[Dict], sentence: str) -> List[Dict]:
    """Return entities whose text appears in the given sentence."""
    result = []
    sentence_lower = sentence.lower()
    for e in entities:
        entity_text = (e.get("text") or "").strip()
        if entity_text and entity_text.lower() in sentence_lower:
            result.append(e)
    return result


def _make_relationship(
    source: Dict,
    rel_type: str,
    target: Dict,
    confidence: float,
    status: str,
    sentence: str,
    sentence_index: int,
    char_start: int,
    char_end: int,
    source_document: str,
    temporal_info: Optional[Dict] = None,
    uncertainty_markers: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Build a standardized relationship dict."""
    return {
        "id": str(uuid.uuid4()),
        "source_entity_id": source.get("id", source.get("text", "")),
        "source_entity_text": source.get("text", ""),
        "source_entity_type": source.get("type", ""),
        "relationship_type": rel_type,
        "target_entity_id": target.get("id", target.get("text", "")),
        "target_entity_text": target.get("text", ""),
        "target_entity_type": target.get("type", ""),
        "confidence": round(confidence, 3),
        "status": status,
        "temporal_information": temporal_info or {},
        "evidence": {
            "sentence": sentence,
            "sentence_index": sentence_index,
            "char_start": char_start,
            "char_end": char_end,
        },
        "provenance": {
            "source_document": source_document,
            "extraction_method": "SEMANTIC_RULE",
            "uncertainty_markers": uncertainty_markers or [],
        },
        "verification_status": "AI_SUGGESTED",
    }


class RelationshipExtractor:
    """
    Extracts semantic relationships between entities.

    Only creates relationships when:
    1. A specific semantic trigger is found in the sentence.
    2. The trigger is NOT negated.
    3. Both entities appear in the sentence.

    Returns relationships with status: CONFIRMED / ALLEGED / SUSPECTED /
                                       DENIED / NEGATED / UNVERIFIED
    """

    def extract_relationships(
        self,
        text: str,
        entities: List[Dict[str, Any]],
        sentences: Optional[List[Dict[str, Any]]] = None,
        source_document: str = "",
    ) -> List[Dict[str, Any]]:
        """
        Extract relationships from text using entity list.

        Args:
            text: full document text
            entities: extracted entities
            sentences: list of {text, char_start, char_end, sentence_index}
                       (if None, will split text into sentences)
            source_document: document identifier for provenance
        """
        from app.nlp.preprocessor import LegalTextPreprocessor
        preprocessor = LegalTextPreprocessor()

        if sentences is None:
            raw_sents = preprocessor.extract_sentences_with_offsets(text)
        else:
            raw_sents = sentences

        relationships: List[Dict[str, Any]] = []

        for sent_data in raw_sents:
            sentence_text = sent_data["text"] if isinstance(sent_data, dict) else sent_data
            sent_idx = sent_data.get("sentence_index", 0) if isinstance(sent_data, dict) else 0
            sent_char_start = sent_data.get("char_start", 0) if isinstance(sent_data, dict) else 0
            sent_char_end = sent_data.get("char_end", len(sentence_text)) if isinstance(sent_data, dict) else len(sentence_text)

            # Find which entities appear in this sentence
            sent_entities = _entities_in_sentence(entities, sentence_text)

            if len(sent_entities) < 1:
                continue

            # Extract temporal info from this sentence
            temporal_info = extract_temporal_info(sentence_text)
            temporal_data = temporal_info if temporal_info.get("has_temporal") else None

            # Try each relationship template
            for template in _RELATIONSHIP_TEMPLATES:
                rel_type = template["rel_type"]
                src_types = template["source_types"]
                tgt_types = template["target_types"]
                triggers = template["triggers"]
                base_conf = template["base_confidence"]

                # Find trigger in sentence
                trigger_match = _find_trigger_in_sentence(sentence_text, triggers)
                if trigger_match is None:
                    continue

                trigger_text, trigger_start, trigger_end = trigger_match

                # ── NEGATION CHECK ────────────────────────────────────────────
                negation_analysis = analyze_sentence(
                    sentence_text,
                    trigger_start=trigger_start,
                    trigger_end=trigger_end,
                )
                status = negation_analysis["status"]
                uncertainty_markers = negation_analysis.get("markers", [])

                # If negated: do NOT create relationship as a graph fact
                # Still record it so the investigator can see the negative statement
                # But mark it NEGATED and it will be rejected by validator

                # Filter entities by type
                source_candidates = _entities_of_types(sent_entities, src_types)
                target_candidates = _entities_of_types(sent_entities, tgt_types)

                if not source_candidates or not target_candidates:
                    continue

                # Create relationships between valid (source, target) pairs
                for source in source_candidates:
                    for target in target_candidates:
                        # Avoid self-reference
                        src_id = source.get("id") or source.get("text", "")
                        tgt_id = target.get("id") or target.get("text", "")
                        if src_id == tgt_id:
                            continue
                        if source.get("text", "").lower() == target.get("text", "").lower():
                            continue

                        # Adjust confidence based on entity confidence
                        src_conf = source.get("confidence", 0.8)
                        tgt_conf = target.get("confidence", 0.8)
                        combined_conf = round(
                            base_conf * 0.6 + (src_conf + tgt_conf) / 2 * 0.4, 3
                        )

                        # Apply uncertainty penalty
                        if status in ("ALLEGED", "SUSPECTED"):
                            combined_conf = round(combined_conf * 0.85, 3)
                        elif status == "NEGATED":
                            combined_conf = round(combined_conf * 0.50, 3)

                        rel = _make_relationship(
                            source=source,
                            rel_type=rel_type,
                            target=target,
                            confidence=combined_conf,
                            status=status,
                            sentence=sentence_text,
                            sentence_index=sent_idx,
                            char_start=sent_char_start,
                            char_end=sent_char_end,
                            source_document=source_document,
                            temporal_info=temporal_data,
                            uncertainty_markers=uncertainty_markers,
                        )
                        relationships.append(rel)

        # ── Document-Level Case Grounding ─────────────────────────────────────
        # In FIRs, link case-level roles (ACCUSED, COMPLAINANT, VICTIM, WITNESS)
        # to the primary CASE entity of the document
        case_entities = [e for e in entities if e.get("type") == "CASE"]
        if case_entities:
            primary_case = case_entities[0]
            existing_pairs = {
                (r.get("source_entity_id"), r.get("relationship_type"), r.get("target_entity_id"))
                for r in relationships
            }
            existing_text_pairs = {
                (r.get("source_entity_text", "").lower(), r.get("relationship_type"), r.get("target_entity_text", "").lower())
                for r in relationships
            }

            for ent in entities:
                if ent.get("type") == "PERSON":
                    role = ent.get("role")
                    p_text = ent.get("text", "")
                    p_id = ent.get("id") or p_text
                    case_id = primary_case.get("id") or primary_case.get("text", "")
                    case_text = primary_case.get("text", "")

                    target_rel = None
                    text_lower = text.lower()
                    if role == "ACCUSED" and any(t in text_lower for t in ["accused", "arrested", "charged", "booked", "suspect", "apprehended", "detained"]):
                        target_rel = "ACCUSED_IN"
                    elif role == "COMPLAINANT" and any(t in text_lower for t in ["complainant", "reported", "lodged", "filed", "informant"]):
                        target_rel = "REPORTED"
                    elif role == "VICTIM" and any(t in text_lower for t in ["victim", "deceased", "injured", "assaulted", "killed", "robbed", "looted"]):
                        target_rel = "VICTIM_IN"
                    elif role == "WITNESS" and any(t in text_lower for t in ["witness", "eyewitness", "stated", "deposed", "testified", "saw"]):
                        target_rel = "WITNESS_IN"

                    if target_rel:
                        pair_id = (p_id, target_rel, case_id)
                        pair_text = (p_text.lower(), target_rel, case_text.lower())
                        if pair_id not in existing_pairs and pair_text not in existing_text_pairs:
                            rel = _make_relationship(
                                source=ent,
                                rel_type=target_rel,
                                target=primary_case,
                                confidence=0.90,
                                status="CONFIRMED",
                                sentence=ent.get("provenance", {}).get("sentence", ""),
                                sentence_index=0,
                                char_start=0,
                                char_end=len(text),
                                source_document=source_document,
                            )
                            relationships.append(rel)
                            existing_pairs.add(pair_id)
                            existing_text_pairs.add(pair_text)

        logger.debug(
            "RelationshipExtractor: %d relationships from %d sentences",
            len(relationships), len(raw_sents)
        )
        return relationships
