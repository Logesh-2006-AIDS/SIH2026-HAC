"""
Pre-Graph-Insertion Validator
================================
Validates extracted entities and relationships before they are staged
for graph insertion.

Validation pipeline:
  RAW EXTRACTION → VALIDATOR → STAGED / REJECTED

CRITICAL RULES:
  1. NEGATED relationships must NEVER be inserted as graph edges.
  2. Entities with impossible/invalid attributes must be flagged.
  3. Duplicate entities/relationships must not create duplicate graph nodes/edges.
  4. Contradictory relationships must be flagged for investigator review.
  5. Missing provenance is a warning, not a hard rejection.
  6. Low confidence < 0.40 is a warning; < 0.25 is a rejection.
"""

import re
import logging
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# ── Validation thresholds ─────────────────────────────────────────────────────
CONFIDENCE_REJECTION_THRESHOLD = 0.25
CONFIDENCE_WARNING_THRESHOLD = 0.40

# Indian phone number: exactly 10 digits after normalization, starting 6-9
_PHONE_NORMALIZED_RE = re.compile(r"^\+91[6-9]\d{9}$")
_PHONE_BARE_RE = re.compile(r"^[6-9]\d{9}$")

# Indian vehicle plate (normalized): e.g. DL-01-AB-1234 or DL01AB1234
_VEHICLE_RE = re.compile(
    r"^[A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,3}[-\s]?\d{4}$", re.IGNORECASE
)

# IFSC code
_IFSC_RE = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$", re.IGNORECASE)

# FIR/Case number
_CASE_RE = re.compile(r"^(FIR|CS|CC|RC|CR)[\s\-/]?\d+(/\d{2,4})?$", re.IGNORECASE)

# Date boundaries (reasonable for Indian police FIRs)
_MIN_DATE = datetime(1900, 1, 1)
_MAX_DATE = datetime(2100, 1, 1)

# Contradictory relationship pairs (same case/context) — flag for investigator
_CONTRADICTORY_PAIRS = [
    {"ACCUSED_IN", "VICTIM_IN"},
    {"ACCUSED_IN", "COMPLAINANT_IN"},
    {"WITNESS_IN", "ACCUSED_IN"},
]


# ── Entity Validators ─────────────────────────────────────────────────────────

def _validate_phone(entity: Dict) -> List[str]:
    warnings = []
    normalized = entity.get("normalized_value", entity.get("text", ""))
    # Strip spaces/hyphens for check
    clean = re.sub(r"[\s\-\(\)]", "", normalized)
    if clean.startswith("+91"):
        clean_bare = clean[3:]
    elif clean.startswith("91") and len(clean) == 12:
        clean_bare = clean[2:]
    else:
        clean_bare = clean

    if not (len(clean_bare) == 10 and clean_bare[0] in "6789"):
        warnings.append(
            f"PHONE '{normalized}' does not appear to be a valid Indian 10-digit mobile number"
        )
    return warnings


def _validate_vehicle(entity: Dict) -> List[str]:
    warnings = []
    normalized = entity.get("normalized_value", entity.get("text", ""))
    if not _VEHICLE_RE.match(normalized.replace(" ", "")):
        warnings.append(
            f"VEHICLE '{normalized}' does not match Indian RTO registration format (e.g. DL-01-AB-1234)"
        )
    return warnings


def _validate_date(entity: Dict) -> List[str]:
    warnings = []
    iso_date = entity.get("normalized_value") or entity.get("text", "")
    if not iso_date:
        return warnings
    try:
        dt = datetime.fromisoformat(iso_date)
        if dt < _MIN_DATE:
            warnings.append(f"DATE '{iso_date}' is before 1900 — likely incorrect")
        if dt > _MAX_DATE:
            warnings.append(f"DATE '{iso_date}' is after 2100 — likely incorrect")
        # Warn if date is in the future (for event dates, not document dates)
        if dt > datetime.now():
            warnings.append(f"DATE '{iso_date}' is in the future — verify this is intentional")
    except (ValueError, TypeError):
        warnings.append(f"DATE '{iso_date}' could not be parsed as ISO date")
    return warnings


def _validate_confidence(entity: Dict) -> Tuple[List[str], bool]:
    """Returns (warnings, hard_reject)."""
    conf = entity.get("confidence", 1.0)
    if conf < CONFIDENCE_REJECTION_THRESHOLD:
        return [f"Confidence {conf:.2f} below rejection threshold {CONFIDENCE_REJECTION_THRESHOLD}"], True
    if conf < CONFIDENCE_WARNING_THRESHOLD:
        return [f"Confidence {conf:.2f} below warning threshold {CONFIDENCE_WARNING_THRESHOLD} — review recommended"], False
    return [], False


def _validate_provenance(entity: Dict) -> List[str]:
    warnings = []
    prov = entity.get("provenance", {})
    if not prov:
        warnings.append("Missing provenance — source document/sentence unknown")
    elif not prov.get("sentence"):
        warnings.append("Provenance missing source sentence")
    return warnings


# ── Main entity validator ─────────────────────────────────────────────────────

def validate_entities(
    entities: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Validates extracted entities. Returns:
        {
            "valid":    [entities that pass],
            "warnings": [{entity, issues}],
            "rejected": [{entity, reasons}]
        }
    """
    valid = []
    warned = []
    rejected = []
    seen_normalized: Dict[str, str] = {}  # normalized_value → entity_id

    for entity in entities:
        issues: List[str] = []
        hard_reject = False
        entity_id = entity.get("id", entity.get("text", ""))
        entity_type = entity.get("type", entity.get("label", "UNKNOWN"))
        normalized = entity.get("normalized_value", entity.get("text", "")).strip()

        # 1. Confidence check
        conf_warnings, conf_reject = _validate_confidence(entity)
        issues.extend(conf_warnings)
        if conf_reject:
            hard_reject = True

        # 2. Type-specific validation
        if entity_type in ("PHONE", "PHONE_NUMBER"):
            issues.extend(_validate_phone(entity))
        elif entity_type in ("VEHICLE", "VEHICLE_NO"):
            issues.extend(_validate_vehicle(entity))
        elif entity_type in ("DATE", "TIMESTAMP_DATE"):
            issues.extend(_validate_date(entity))

        # 3. Provenance check
        issues.extend(_validate_provenance(entity))

        # 4. Duplicate detection
        dedup_key = f"{entity_type}::{normalized.lower()}"
        if dedup_key in seen_normalized:
            issues.append(
                f"Potential duplicate of entity '{seen_normalized[dedup_key]}' "
                f"(same type + normalized value)"
            )
        else:
            seen_normalized[dedup_key] = entity_id

        # 5. Empty text
        if not normalized:
            issues.append("Entity text is empty or whitespace only")
            hard_reject = True

        if hard_reject:
            rejected.append({"entity": entity, "reasons": issues})
        elif issues:
            warned.append({"entity": entity, "issues": issues})
            valid.append(entity)  # Still include but flagged
        else:
            valid.append(entity)

    return {"valid": valid, "warnings": warned, "rejected": rejected}


# ── Relationship validators ───────────────────────────────────────────────────

def _get_entity_map(entities: List[Dict]) -> Dict[str, Dict]:
    """Build id → entity lookup."""
    return {e.get("id", e.get("text", "")): e for e in entities}


def validate_relationships(
    relationships: List[Dict[str, Any]],
    entities: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Validates extracted relationships. Returns:
        {
            "valid":    [relationships that pass],
            "warnings": [{relationship, issues}],
            "rejected": [{relationship, reasons}]
        }

    CRITICAL: NEGATED relationships are always rejected (not inserted into graph).
    """
    valid = []
    warned = []
    rejected = []
    entity_map = _get_entity_map(entities)

    # Track relationship types per (source, target) pair to detect contradictions
    pair_rels: Dict[Tuple, List[str]] = {}

    seen_rels: set = set()

    for rel in relationships:
        issues: List[str] = []
        hard_reject = False

        src_id = rel.get("source_entity_id") or rel.get("subject", "")
        tgt_id = rel.get("target_entity_id") or rel.get("object", "")
        rel_type = rel.get("relationship_type") or rel.get("predicate", "UNKNOWN")
        status = rel.get("status", "UNVERIFIED")
        conf = rel.get("confidence", 1.0)

        # 1. NEGATED relationships — hard reject, never insert
        if status == "NEGATED":
            hard_reject = True
            issues.append(
                "NEGATED relationship — this negative statement must NOT be inserted as a graph fact. "
                "Evidence preserved for investigator reference only."
            )

        # 2. Confidence check
        conf_warnings, conf_reject = _validate_confidence(rel)
        issues.extend(conf_warnings)
        if conf_reject:
            hard_reject = True

        # 3. Source/target entity must exist
        if src_id not in entity_map and not any(
            e.get("text", "") == src_id for e in entities
        ):
            issues.append(f"Source entity '{src_id}' not found in extracted entities")

        if tgt_id not in entity_map and not any(
            e.get("text", "") == tgt_id for e in entities
        ):
            issues.append(f"Target entity '{tgt_id}' not found in extracted entities")

        # 4. Missing provenance / evidence
        evidence = rel.get("evidence", {})
        if not evidence or not evidence.get("sentence"):
            issues.append("Relationship missing evidence sentence — source context unknown")

        # 5. Duplicate relationship detection
        rel_key = (src_id, rel_type, tgt_id)
        if rel_key in seen_rels:
            hard_reject = True
            issues.append(f"Duplicate relationship: {src_id} → {rel_type} → {tgt_id}")
        else:
            seen_rels.add(rel_key)

        # 6. Self-referential relationship
        if src_id == tgt_id:
            hard_reject = True
            issues.append(f"Self-referential relationship: {src_id} → {rel_type} → {src_id}")

        # 7. Contradictory relationship detection
        pair_key = (src_id, tgt_id)
        existing_types = pair_rels.get(pair_key, [])
        for existing_type in existing_types:
            for contradiction_set in _CONTRADICTORY_PAIRS:
                if rel_type in contradiction_set and existing_type in contradiction_set:
                    issues.append(
                        f"Contradictory relationships: '{existing_type}' and '{rel_type}' "
                        f"for the same entity pair — requires investigator review"
                    )
        pair_rels.setdefault(pair_key, []).append(rel_type)

        if hard_reject:
            rejected.append({"relationship": rel, "reasons": issues})
        elif issues:
            warned.append({"relationship": rel, "issues": issues})
            valid.append(rel)
        else:
            valid.append(rel)

    return {"valid": valid, "warnings": warned, "rejected": rejected}
