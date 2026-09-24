"""
Entity Resolution — Multi-Signal Candidate Matching
=====================================================

CRITICAL RULE:
  Do NOT automatically merge entities.
  A name-only match must NOT create a suggestion unless:
  - There is a second corroborating signal (shared phone, account, vehicle), OR
  - The name similarity score is strictly above 95/100.
  - Entities being compared must share the same canonical entity type.

Resolution decisions:
  SUGGESTED_MERGE — high confidence with multi-signal corroboration or exact name match (>95)
  POSSIBLE_MATCH  — moderate confidence (score >= 85 with corroborating signal)
  NO_MATCH        — low similarity (<85) or incompatible entity types
"""

import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from rapidfuzz import fuzz, utils as rfuzz_utils

logger = logging.getLogger(__name__)

# Rapidfuzz thresholds (0-100 scale)
NAME_THRESHOLD = 85.0
NAME_ONLY_HIGH_CONFIDENCE = 95.0


def _normalize_name(name: str) -> str:
    """Normalize name for comparison: lowercase, strip titles/punctuation."""
    name = (name or "").lower().strip()
    titles = r"\b(mr|mrs|ms|dr|prof|shri|smt|sh|inspector|insp|si|psi|dsp|acp)\b\.?"
    name = re.sub(titles, "", name, flags=re.IGNORECASE)
    name = re.sub(r"[^\w\s]", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def _name_similarity(name1: str, name2: str) -> float:
    """
    Calculate name similarity using rapidfuzz metrics (0.0 to 100.0).
    """
    n1 = _normalize_name(name1)
    n2 = _normalize_name(name2)

    if not n1 or not n2:
        return 0.0
    if n1 == n2:
        return 100.0

    ratio = fuzz.ratio(n1, n2, processor=rfuzz_utils.default_process)
    token_sort = fuzz.token_sort_ratio(n1, n2, processor=rfuzz_utils.default_process)
    token_set = fuzz.token_set_ratio(n1, n2, processor=rfuzz_utils.default_process)

    similarity = ratio * 0.3 + token_sort * 0.3 + token_set * 0.4

    # Bonus for matching last name in multi-token Indian names
    n1_tokens = n1.split()
    n2_tokens = n2.split()
    if len(n1_tokens) > 1 and len(n2_tokens) > 1:
        if n1_tokens[-1] == n2_tokens[-1]:
            similarity = min(100.0, similarity + 5.0)

    return round(float(similarity), 2)


def _normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    return digits if len(digits) == 10 else digits


def _normalize_vehicle(vehicle: str) -> str:
    return re.sub(r"[\s\-]", "", (vehicle or "").upper())


def _corroborate_entities(e1: Dict[str, Any], e2: Dict[str, Any]) -> Tuple[int, List[str]]:
    """
    Extract corroborating signals between two entities.
    Strong corroboration signals (phone, bank account, vehicle) contribute to match confidence.
    Shared cases are informational only (co-accused in the same FIR are distinct individuals).
    """
    strong_signals: List[str] = []
    info_signals: List[str] = []

    # 1. Phone match (Strong signal)
    p1 = e1.get("phone") or (e1.get("normalized_value") if e1.get("type") in ("PHONE", "Phone") else "")
    p2 = e2.get("phone") or (e2.get("normalized_value") if e2.get("type") in ("PHONE", "Phone") else "")
    if p1 and p2 and _normalize_phone(p1) and _normalize_phone(p1) == _normalize_phone(p2):
        strong_signals.append(f"Shared Phone: {p1}")

    # 2. Account match (Strong signal)
    a1 = e1.get("account") or e1.get("account_number") or ""
    a2 = e2.get("account") or e2.get("account_number") or ""
    if a1 and a2 and str(a1).strip() == str(a2).strip():
        strong_signals.append(f"Shared Bank Account: {a1}")

    # 3. Vehicle match (Strong signal)
    v1 = e1.get("vehicle") or (e1.get("normalized_value") if e1.get("type") in ("VEHICLE", "Vehicle") else "")
    v2 = e2.get("vehicle") or (e2.get("normalized_value") if e2.get("type") in ("VEHICLE", "Vehicle") else "")
    if v1 and v2 and _normalize_vehicle(v1) and _normalize_vehicle(v1) == _normalize_vehicle(v2):
        strong_signals.append(f"Shared Vehicle: {v1}")

    # 4. Shared case reference (Informational only, NOT counted towards corroboration)
    c1 = set(e1.get("cases") or [])
    c2 = set(e2.get("cases") or [])
    common_cases = c1 & c2
    if common_cases:
        info_signals.append(f"Shared Case(s) (Info only): {', '.join(sorted(str(c) for c in common_cases))}")

    all_chips = strong_signals + info_signals
    return len(strong_signals), all_chips


def evaluate_resolution_pair(e1: Dict[str, Any], e2: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Evaluate if two entities qualify as a suggested merge.
    Enforces rules:
    - Same entity type only.
    - Name score >= 85 WITH a 2nd signal OR Name score > 95.
    - Never auto-merges.
    """
    t1 = (e1.get("type") or e1.get("entity_type") or "").upper()
    t2 = (e2.get("type") or e2.get("entity_type") or "").upper()
    if not t1 or not t2 or t1 != t2:
        return None

    name1 = e1.get("name") or e1.get("text") or e1.get("raw_text") or ""
    name2 = e2.get("name") or e2.get("text") or e2.get("raw_text") or ""

    name_sim = _name_similarity(name1, name2)
    corr_count, corr_signals = _corroborate_entities(e1, e2)

    # Condition 1: High name score > 95
    # Condition 2: Score >= 85 AND at least one strong corroborating signal
    is_valid_suggestion = (name_sim > NAME_ONLY_HIGH_CONFIDENCE) or (name_sim >= NAME_THRESHOLD and corr_count > 0)

    if not is_valid_suggestion:
        return None

    reasons = [f"Name similarity {name_sim:.1f}%"] + corr_signals
    match_reason = " + ".join(reasons)

    decision = "SUGGESTED_MERGE" if (name_sim > NAME_ONLY_HIGH_CONFIDENCE or corr_count >= 2) else "POSSIBLE_MATCH"

    return {
        "entity_1": e1,
        "entity_2": e2,
        "name_similarity": name_sim,
        "corroboration_count": corr_count,
        "corroborating_signals": corr_signals,
        "corroboration_signals": corr_signals,
        "resolution_decision": decision,
        "resolution_confidence": round(name_sim / 100.0, 3),
        "similarity_score": round(name_sim / 100.0, 3),
        "match_reason": match_reason,
        "rationale": match_reason,
    }


class EntityResolver:
    """
    Multi-signal entity resolution candidate generator.
    Generates merge suggestions for analyst review without auto-merging.
    """

    def resolve_entities(
        self,
        entities: List[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Scan entity list and find candidate merge pairs without destructive auto-merging.
        """
        candidate_matches: List[Dict[str, Any]] = []

        for i in range(len(entities)):
            for j in range(i + 1, len(entities)):
                e1 = entities[i]
                e2 = entities[j]
                match = evaluate_resolution_pair(e1, e2)
                if match:
                    candidate_matches.append(match)

        # Do NOT auto-merge entities: keep all entities intact
        return entities, candidate_matches

    def find_cross_document_candidates(
        self,
        existing_nodes: Any,
        new_entities: Optional[List[Dict[str, Any]]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Compare new incoming entities against existing graph nodes, or evaluate cross-document sets.
        Supports both:
          1. find_cross_document_candidates(existing_nodes, new_entities)
          2. find_cross_document_candidates([ (doc1, [e1, e2]), (doc2, [e3, e4]) ])
        """
        candidates: List[Dict[str, Any]] = []
        if new_entities is None and isinstance(existing_nodes, list) and len(existing_nodes) > 0 and isinstance(existing_nodes[0], tuple):
            entity_sets = existing_nodes
            for i in range(len(entity_sets)):
                for j in range(i + 1, len(entity_sets)):
                    _, list1 = entity_sets[i]
                    _, list2 = entity_sets[j]
                    for e1 in list1:
                        for e2 in list2:
                            match = evaluate_resolution_pair(e1, e2)
                            if match:
                                candidates.append(match)
            return candidates

        for new_e in (new_entities or []):
            for node in (existing_nodes or []):
                match = evaluate_resolution_pair(node, new_e)
                if match:
                    candidates.append(match)
        return candidates


# Singleton instance
entity_resolver = EntityResolver()
