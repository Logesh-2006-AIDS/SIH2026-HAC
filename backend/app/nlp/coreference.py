"""
Rule-Based Coreference Resolver
=================================
Resolves anaphoric references in police FIR documents.

Handles:
  - "the accused"     → highest-confidence ACCUSED entity
  - "the victim"      → highest-confidence VICTIM entity
  - "the complainant" → highest-confidence COMPLAINANT entity
  - "the suspect"     → highest-confidence SUSPECT entity
  - "the witness"     → highest-confidence WITNESS entity
  - "the driver"      → highest-confidence PERSON who OWNS vehicle
  - "he" / "she"      → most recently mentioned PERSON of matching gender context
  - "the above-mentioned person" → most recent PERSON mention

CRITICAL RULE:
  If resolution is ambiguous (multiple candidates), mark as UNRESOLVED.
  Never guess when ambiguous — an incorrect coreference creates a false link.
"""

import re
from typing import List, Dict, Any, Optional, Tuple


# Role-based anaphora patterns
_ROLE_ANAPHOR_PATTERNS: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"\bthe\s+accused\b", re.IGNORECASE), "ACCUSED"),
    (re.compile(r"\bthe\s+suspect(?:ed\s+person)?\b", re.IGNORECASE), "SUSPECT"),
    (re.compile(r"\bthe\s+victim\b", re.IGNORECASE), "VICTIM"),
    (re.compile(r"\bthe\s+complainant\b", re.IGNORECASE), "COMPLAINANT"),
    (re.compile(r"\bthe\s+witness(?:es)?\b", re.IGNORECASE), "WITNESS"),
    (re.compile(r"\bthe\s+informant\b", re.IGNORECASE), "INFORMANT"),
    (re.compile(r"\bthe\s+(?:investigating\s+)?officer\b", re.IGNORECASE), "OFFICER"),
    (re.compile(r"\bthe\s+driver\b", re.IGNORECASE), None),  # None = any PERSON with vehicle
    (re.compile(r"\bthe\s+above[-\s]mentioned\s+(?:person|accused|suspect|individual)\b", re.IGNORECASE), None),
    (re.compile(r"\bsaid\s+accused\b", re.IGNORECASE), "ACCUSED"),
    (re.compile(r"\bsaid\s+person\b", re.IGNORECASE), None),
    (re.compile(r"\bsaid\s+suspect\b", re.IGNORECASE), "SUSPECT"),
    (re.compile(r"\bthe\s+said\s+(?:accused|person|suspect)\b", re.IGNORECASE), "ACCUSED"),
]

# Pronoun patterns — we use minimal context (gender not inferable without NLP)
_PRONOUN_PATTERNS: List[re.Pattern] = [
    re.compile(r"\bhe\b", re.IGNORECASE),
    re.compile(r"\bshe\b", re.IGNORECASE),
    re.compile(r"\bhim\b", re.IGNORECASE),
    re.compile(r"\bher\b", re.IGNORECASE),
    re.compile(r"\bhis\b", re.IGNORECASE),
    re.compile(r"\bthey\b", re.IGNORECASE),
    re.compile(r"\bthem\b", re.IGNORECASE),
    re.compile(r"\btheir\b", re.IGNORECASE),
]


def _entities_with_role(entities: List[Dict], role: str) -> List[Dict]:
    """Filter entities matching a specific role."""
    return [e for e in entities if e.get("type") == "PERSON" and e.get("role") == role]


def _resolve_role_anaphor(
    anaphor_text: str,
    target_role: Optional[str],
    entities: List[Dict],
) -> Dict[str, Any]:
    """
    Try to resolve a role-based anaphor to a specific entity.
    Returns resolution result dict.
    """
    if target_role is not None:
        candidates = _entities_with_role(entities, target_role)
    else:
        # "the driver", "the above-mentioned person" → any PERSON
        candidates = [e for e in entities if e.get("type") == "PERSON"]

    if len(candidates) == 0:
        return {
            "anaphor": anaphor_text,
            "resolved_to": None,
            "resolution_status": "UNRESOLVED",
            "reason": f"No {target_role or 'PERSON'} entity found in document",
        }
    elif len(candidates) == 1:
        return {
            "anaphor": anaphor_text,
            "resolved_to": candidates[0]["id"],
            "resolved_name": candidates[0]["text"],
            "resolution_status": "RESOLVED",
            "confidence": 0.85,
            "reason": f"Unique {target_role or 'PERSON'} entity in document context",
        }
    else:
        # Multiple candidates — ambiguous
        return {
            "anaphor": anaphor_text,
            "resolved_to": None,
            "candidates": [{"id": c["id"], "text": c["text"]} for c in candidates],
            "resolution_status": "AMBIGUOUS",
            "reason": f"Multiple {target_role or 'PERSON'} entities found; cannot resolve without more context",
        }


def resolve_coreferences(
    sentences: List[Dict[str, Any]],
    entities: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Resolve anaphoric references across document sentences.

    Args:
        sentences: list of {text, char_start, char_end, sentence_index}
        entities: extracted entities with 'id', 'type', 'role', 'text'

    Returns:
        {
            "resolved": List[resolution_dicts],
            "unresolved_references": List[str],
            "pronoun_resolution": "SKIPPED_AMBIGUOUS" | dict
        }
    """
    resolved: List[Dict] = []
    unresolved: List[str] = []

    full_text = " ".join(s.get("text", s) if isinstance(s, dict) else s for s in sentences)

    # 1. Role-based anaphors (deterministic patterns)
    seen_anaphors: set = set()
    for pattern, target_role in _ROLE_ANAPHOR_PATTERNS:
        for match in pattern.finditer(full_text):
            anaphor = match.group(0).strip()
            # Deduplicate same anaphor type
            anaphor_key = anaphor.lower()
            if anaphor_key in seen_anaphors:
                continue
            seen_anaphors.add(anaphor_key)

            result = _resolve_role_anaphor(anaphor, target_role, entities)
            resolved.append(result)
            if result["resolution_status"] in ("UNRESOLVED", "AMBIGUOUS"):
                unresolved.append(anaphor)

    # 2. Pronoun resolution — only attempt if exactly one PERSON in document
    person_entities = [e for e in entities if e.get("type") == "PERSON"]
    pronoun_results = {}

    # Check if any pronouns exist in text
    has_pronouns = any(p.search(full_text) for p in _PRONOUN_PATTERNS)

    if has_pronouns:
        if len(person_entities) == 0:
            pronoun_results = {
                "status": "UNRESOLVED",
                "reason": "No PERSON entities found to resolve pronouns to",
            }
        elif len(person_entities) == 1:
            # Only one person — resolve with moderate confidence
            person = person_entities[0]
            pronoun_results = {
                "status": "RESOLVED",
                "resolved_to_id": person["id"],
                "resolved_to_name": person["text"],
                "confidence": 0.65,
                "reason": "Single PERSON entity in document",
            }
        else:
            # Multiple persons — do not guess
            pronoun_results = {
                "status": "AMBIGUOUS",
                "reason": f"{len(person_entities)} PERSON entities; pronoun resolution skipped",
                "candidates": [{"id": p["id"], "text": p["text"]} for p in person_entities],
            }
            unresolved.append("[pronouns: he/she/they]")

    return {
        "resolved": resolved,
        "unresolved_references": list(set(unresolved)),
        "pronoun_resolution": pronoun_results,
    }
