"""
Entity Resolution — Multi-Signal Candidate Matching
=====================================================

CRITICAL RULE:
  Do NOT automatically merge entities based only on name similarity.
  Always use multiple corroborating signals before merging.

Resolution decisions:
  MATCH          — high confidence, multiple corroborating signals → merge safe
  POSSIBLE_MATCH — moderate confidence, some signals → flag for investigator
  NO_MATCH       — low similarity or contradicting signals → keep separate
  UNKNOWN        — insufficient information to determine → keep separate

Merge only when:
  - Name similarity ≥ 0.92 AND at least one corroborating attribute

Flag as POSSIBLE_MATCH when:
  - Name similarity 0.70–0.91 with some corroboration
  - Name similarity ≥ 0.92 but no corroboration

Keep separate (NO_MATCH) when:
  - Name similarity < 0.70
  - Incompatible entity types
"""

import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from rapidfuzz import fuzz, utils as rfuzz_utils

logger = logging.getLogger(__name__)

# Resolution thresholds
MERGE_THRESHOLD = 0.92          # Auto-merge: high sim + corroboration
POSSIBLE_MATCH_THRESHOLD = 0.70 # Flag for investigator

# Minimum corroboration signals for MERGE
MIN_CORROBORATION_FOR_MERGE = 1


def _normalize_name(name: str) -> str:
    """Normalize name for comparison: lowercase, strip titles/punctuation."""
    name = name.lower().strip()
    # Remove titles
    titles = r"\b(mr|mrs|ms|dr|prof|shri|smt|sh|inspector|insp|si|psi|dsp|acp)\b\.?"
    name = re.sub(titles, "", name, flags=re.IGNORECASE)
    # Remove punctuation except spaces
    name = re.sub(r"[^\w\s]", " ", name)
    # Collapse spaces
    name = re.sub(r"\s+", " ", name).strip()
    return name


def _name_similarity(name1: str, name2: str) -> float:
    """
    Calculate name similarity using multiple fuzzy metrics.
    Returns float 0.0–1.0.
    """
    n1 = _normalize_name(name1)
    n2 = _normalize_name(name2)

    if not n1 or not n2:
        return 0.0
    if n1 == n2:
        return 1.0

    # Use rapidfuzz for better accuracy
    ratio = fuzz.ratio(n1, n2, processor=rfuzz_utils.default_process) / 100.0
    token_sort = fuzz.token_sort_ratio(n1, n2, processor=rfuzz_utils.default_process) / 100.0
    token_set = fuzz.token_set_ratio(n1, n2, processor=rfuzz_utils.default_process) / 100.0

    # Weighted: favor token_set for Indian names with varying word order
    similarity = ratio * 0.3 + token_sort * 0.3 + token_set * 0.4

    # Bonus for matching last name (common Indian pattern)
    n1_tokens = n1.split()
    n2_tokens = n2.split()
    if n1_tokens and n2_tokens:
        if n1_tokens[-1] == n2_tokens[-1]:  # Same last name
            similarity = min(1.0, similarity + 0.05)

    return round(similarity, 4)


def _normalize_phone(phone: str) -> str:
    """Extract 10-digit Indian phone number for comparison."""
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) == 10:
        return digits
    return digits


def _normalize_vehicle(vehicle: str) -> str:
    """Normalize vehicle plate for comparison."""
    return re.sub(r"[\s\-]", "", vehicle.upper())


def _corroborate_entities(e1: Dict, e2: Dict) -> Tuple[int, List[str]]:
    """
    Check corroborating attributes between two entities.
    Returns (count_of_corroborating_signals, list_of_signal_descriptions).
    """
    signals: List[str] = []

    # Phone match
    p1 = (e1.get("normalized_value") if e1.get("type") == "PHONE" else None) or e1.get("phone", "")
    p2 = (e2.get("normalized_value") if e2.get("type") == "PHONE" else None) or e2.get("phone", "")
    if p1 and p2 and _normalize_phone(p1) == _normalize_phone(p2):
        signals.append(f"Shared phone: {p1}")

    # Vehicle match
    v1 = e1.get("vehicle", "") or ""
    v2 = e2.get("vehicle", "") or ""
    if v1 and v2 and _normalize_vehicle(v1) == _normalize_vehicle(v2):
        signals.append(f"Shared vehicle: {v1}")

    # Address/location overlap (simple substring check)
    addr1 = (e1.get("address", "") or "").lower()
    addr2 = (e2.get("address", "") or "").lower()
    if addr1 and addr2 and len(addr1) > 5:
        # Check if significant overlap
        addr1_words = set(addr1.split())
        addr2_words = set(addr2.split())
        common_words = addr1_words & addr2_words
        # Exclude common words
        stopwords = {"at", "of", "the", "near", "road", "street", "nagar"}
        meaningful_common = common_words - stopwords
        if len(meaningful_common) >= 2:
            signals.append(f"Address overlap: {', '.join(meaningful_common)}")

    # Organization match
    org1 = (e1.get("organization", "") or "").lower()
    org2 = (e2.get("organization", "") or "").lower()
    if org1 and org2 and org1 == org2:
        signals.append(f"Shared organization: {org1}")

    # Case context overlap
    cases1 = set(e1.get("cases", []) or [])
    cases2 = set(e2.get("cases", []) or [])
    shared_cases = cases1 & cases2
    if shared_cases:
        signals.append(f"Shared cases: {', '.join(str(c) for c in shared_cases)}")

    # Document source overlap
    doc1 = e1.get("provenance", {}).get("source_document", "")
    doc2 = e2.get("provenance", {}).get("source_document", "")
    if doc1 and doc2 and doc1 == doc2:
        signals.append(f"Same source document: {doc1}")

    return len(signals), signals


def _make_candidate_match(
    e1: Dict,
    e2: Dict,
    name_sim: float,
    corroboration_count: int,
    corroboration_signals: List[str],
) -> Dict[str, Any]:
    """Create a candidate match record."""
    # Determine resolution decision
    if name_sim >= MERGE_THRESHOLD and corroboration_count >= MIN_CORROBORATION_FOR_MERGE:
        decision = "MATCH"
        resolution_confidence = round(min(1.0, name_sim * 0.7 + 0.3 * min(1.0, corroboration_count / 3)), 3)
    elif name_sim >= POSSIBLE_MATCH_THRESHOLD and (corroboration_count > 0 or name_sim >= MERGE_THRESHOLD):
        decision = "POSSIBLE_MATCH"
        resolution_confidence = round(name_sim * 0.6, 3)
    else:
        decision = "NO_MATCH"
        resolution_confidence = round(name_sim * 0.4, 3)

    return {
        "entity_1": {
            "id": e1.get("id", e1.get("text", "")),
            "text": e1.get("text", ""),
            "type": e1.get("type", ""),
            "source": e1.get("provenance", {}).get("source_document", ""),
        },
        "entity_2": {
            "id": e2.get("id", e2.get("text", "")),
            "text": e2.get("text", ""),
            "type": e2.get("type", ""),
            "source": e2.get("provenance", {}).get("source_document", ""),
        },
        "name_similarity": name_sim,
        "corroboration_count": corroboration_count,
        "corroboration_signals": corroboration_signals,
        "resolution_decision": decision,
        "resolution_confidence": resolution_confidence,
        "rationale": (
            f"Name similarity {name_sim:.2%}. "
            f"{corroboration_count} corroborating signal(s). "
            f"{'Merged.' if decision == 'MATCH' else 'Flagged for investigator review.' if decision == 'POSSIBLE_MATCH' else 'Kept as separate entities.'}"
        ),
        "requires_investigator_review": decision in ("POSSIBLE_MATCH", "UNKNOWN"),
    }


class EntityResolver:
    """
    Multi-signal entity resolution engine.

    Does NOT auto-merge entities based solely on name similarity.
    Produces candidate matches for investigator review.
    """

    def __init__(self, threshold: float = POSSIBLE_MATCH_THRESHOLD):
        self.threshold = threshold

    def resolve_entities(
        self,
        entities: List[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Resolve entities: find duplicates and candidate matches.

        Returns:
            (unique_entities, candidate_matches)

            unique_entities: de-duplicated entity list (confirmed MATCH entities merged)
            candidate_matches: list of {entity_1, entity_2, decision, confidence, signals}
        """
        candidate_matches: List[Dict] = []
        merged_ids: Set[str] = set()
        unique_entities: List[Dict] = []

        # Process only PERSON entities for resolution (other types handled by pattern matching)
        person_entities = [e for e in entities if e.get("type") == "PERSON"]
        other_entities = [e for e in entities if e.get("type") != "PERSON"]

        for i, e1 in enumerate(person_entities):
            e1_id = e1.get("id", e1.get("text", ""))
            if e1_id in merged_ids:
                continue

            for j in range(i + 1, len(person_entities)):
                e2 = person_entities[j]
                e2_id = e2.get("id", e2.get("text", ""))
                if e2_id in merged_ids:
                    continue

                # Name similarity
                name_sim = _name_similarity(e1.get("text", ""), e2.get("text", ""))

                if name_sim < self.threshold:
                    continue  # Not similar enough to even consider

                # Corroboration check
                corr_count, corr_signals = _corroborate_entities(e1, e2)

                # Create candidate match record
                match = _make_candidate_match(e1, e2, name_sim, corr_count, corr_signals)
                candidate_matches.append(match)

                # Only actually merge if MATCH decision
                if match["resolution_decision"] == "MATCH":
                    merged_ids.add(e2_id)
                    # Merge aliases into e1
                    existing_aliases = e1.get("aliases", []) or []
                    e1["aliases"] = list(set(existing_aliases + [e2.get("text", "")]))
                    # Prefer higher confidence
                    if e2.get("confidence", 0) > e1.get("confidence", 0):
                        e1["confidence"] = e2["confidence"]
                    logger.debug("Merged '%s' into '%s'", e2.get("text"), e1.get("text"))

            unique_entities.append(e1)

        # Add non-person entities (no resolution needed for phones/vehicles — regex already canonical)
        unique_entities.extend(other_entities)

        return unique_entities, candidate_matches

    def find_cross_document_candidates(
        self,
        entity_sets: List[Tuple[str, List[Dict[str, Any]]]],
    ) -> List[Dict[str, Any]]:
        """
        Find entity candidates across multiple documents.

        Args:
            entity_sets: list of (document_id, entities) tuples

        Returns:
            List of cross-document candidate matches
        """
        # Flatten all entities, tagging document source
        all_entities: List[Dict] = []
        for doc_id, entities in entity_sets:
            for e in entities:
                e_copy = {**e, "_doc_id": doc_id}
                all_entities.append(e_copy)

        # Run cross-document resolution on persons only
        persons = [e for e in all_entities if e.get("type") == "PERSON"]
        candidates = []

        for i, e1 in enumerate(persons):
            for j in range(i + 1, len(persons)):
                e2 = persons[j]
                # Skip if from same document (intra-document handled separately)
                if e1.get("_doc_id") == e2.get("_doc_id"):
                    continue

                name_sim = _name_similarity(e1.get("text", ""), e2.get("text", ""))
                if name_sim < POSSIBLE_MATCH_THRESHOLD:
                    continue

                corr_count, corr_signals = _corroborate_entities(e1, e2)
                match = _make_candidate_match(e1, e2, name_sim, corr_count, corr_signals)
                match["cross_document"] = True
                match["doc_1"] = e1.get("_doc_id", "")
                match["doc_2"] = e2.get("_doc_id", "")
                candidates.append(match)

        return candidates
