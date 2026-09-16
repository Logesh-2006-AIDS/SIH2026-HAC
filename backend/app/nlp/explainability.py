"""
Explainability Layer
=====================
Generates transparent, investigator-readable explanations for every
extracted entity and relationship.

PRINCIPLE:
  Every relationship must be able to answer:
    WHO? → WHAT? → WITH WHOM? → WHEN? → WHERE?
    WHY extracted? → WHAT supports it? → HOW confident? → IS IT VERIFIED?

NO arbitrary confidence numbers. Explanations are grounded in actual evidence.
"""

from typing import Any, Dict, List


def explain_relationship(rel: Dict[str, Any]) -> Dict[str, Any]:
    """
    Add a human-readable explanation to an extracted relationship.

    The explanation includes:
    - What the relationship is
    - The status (CONFIRMED / ALLEGED / SUSPECTED / NEGATED etc.)
    - The exact supporting sentence
    - Confidence basis
    - Verification status
    """
    rel_type = rel.get("relationship_type") or rel.get("predicate", "UNKNOWN")
    source = rel.get("source_entity_text") or rel.get("subject", "?")
    target = rel.get("target_entity_text") or rel.get("object", "?")
    status = rel.get("status", "UNVERIFIED")
    confidence = rel.get("confidence", 0.0)
    evidence = rel.get("evidence", {})
    evidence_sentence = evidence.get("sentence", "") if isinstance(evidence, dict) else str(evidence)
    temporal = rel.get("temporal_information", {})
    markers = rel.get("provenance", {}).get("uncertainty_markers", [])
    verification = rel.get("verification_status", "AI_SUGGESTED")

    # Build the explanation
    parts = [
        f"Relationship: [{rel_type}]",
        f"  From:   {source}",
        f"  To:     {target}",
        f"  Status: {status}",
    ]

    if markers:
        parts.append(f"  Hedging markers: {', '.join(markers)}")

    if status == "NEGATED":
        parts.append("  ⚠ NEGATED — This relationship was detected as a NEGATIVE statement.")
        parts.append("    It must NOT be treated as a positive fact in the investigation.")
    elif status == "ALLEGED":
        parts.append("  ⚠ ALLEGED — Language in the source document indicates this is an allegation,")
        parts.append("    not a confirmed fact. Requires investigator verification.")
    elif status == "SUSPECTED":
        parts.append("  ⚠ SUSPECTED — Language indicates investigative suspicion, not confirmed evidence.")
    elif status == "DENIED":
        parts.append("  ⚠ DENIED — The subject denied this. This is a denial record, not a fact.")

    parts.append(f"  Confidence: {confidence:.0%} (based on trigger specificity + entity confidence)")
    parts.append(f"  Verification: {verification}")

    if evidence_sentence:
        parts.append(f"  Evidence: \"{evidence_sentence}\"")

    if temporal and temporal.get("has_temporal"):
        if temporal.get("event_date"):
            parts.append(f"  When: {temporal['event_date']}")
        if temporal.get("time"):
            parts.append(f"  Time: {temporal['time']}")
        if temporal.get("relative_time"):
            parts.append(f"  Temporal context: {temporal['relative_time']}")

    parts.append(
        f"  Extraction method: {rel.get('provenance', {}).get('extraction_method', 'UNKNOWN')}"
    )

    rel["explanation"] = "\n".join(parts)
    rel["explanation_summary"] = (
        f"[{status}] {source} → {rel_type} → {target} "
        f"(confidence: {confidence:.0%}, verification: {verification})"
    )
    return rel


def explain_entity_match(
    match: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Add human-readable explanation for an entity resolution candidate match.

    Explains WHY two entities were flagged as potential matches and
    WHAT evidence supports or contradicts the match.
    """
    e1 = match.get("entity_1", {})
    e2 = match.get("entity_2", {})
    decision = match.get("resolution_decision", "UNKNOWN")
    confidence = match.get("resolution_confidence", 0.0)
    name_sim = match.get("name_similarity", 0.0)
    signals = match.get("corroboration_signals", [])
    requires_review = match.get("requires_investigator_review", True)

    parts = [
        f"Entity Resolution: {decision}",
        f"  Entity 1: '{e1.get('text', '?')}' [{e1.get('type', '?')}] from {e1.get('source', '?')}",
        f"  Entity 2: '{e2.get('text', '?')}' [{e2.get('type', '?')}] from {e2.get('source', '?')}",
        f"  Name similarity: {name_sim:.0%}",
        f"  Corroborating signals: {len(signals)}",
    ]

    if signals:
        for sig in signals:
            parts.append(f"    • {sig}")
    else:
        parts.append("    • No corroborating signals found")

    if decision == "MATCH":
        parts.append("  → MERGED: High confidence match with corroborating evidence.")
        parts.append("    These entities are treated as the same individual.")
    elif decision == "POSSIBLE_MATCH":
        parts.append("  → FLAGGED FOR INVESTIGATOR REVIEW:")
        parts.append("    Moderate similarity detected. Cannot auto-merge without corroboration.")
        parts.append("    An investigator must confirm or reject this potential match.")
    elif decision == "NO_MATCH":
        parts.append("  → KEPT SEPARATE: Insufficient similarity or contradicting signals.")
    elif decision == "UNKNOWN":
        parts.append("  → UNKNOWN: Insufficient data to make a determination.")

    parts.append(f"  Resolution confidence: {confidence:.0%}")

    if requires_review:
        parts.append(
            "  ⚠ This match requires investigator verification before acting on it."
        )

    match["explanation"] = "\n".join(parts)
    match["explanation_summary"] = (
        f"[{decision}] '{e1.get('text', '?')}' ↔ '{e2.get('text', '?')}' "
        f"(name sim: {name_sim:.0%}, signals: {len(signals)}, conf: {confidence:.0%})"
    )
    return match


def explain_entity(entity: Dict[str, Any]) -> Dict[str, Any]:
    """Add explanation to a single extracted entity."""
    entity_type = entity.get("type", "UNKNOWN")
    text = entity.get("text", "?")
    role = entity.get("role")
    confidence = entity.get("confidence", 0.0)
    prov = entity.get("provenance", {})
    verification = entity.get("verification_status", "AI_SUGGESTED")

    parts = [
        f"Entity: [{entity_type}] '{text}'",
    ]
    if role:
        parts.append(f"  Role: {role}")
    parts.append(f"  Confidence: {confidence:.0%}")
    parts.append(f"  Extraction method: {prov.get('extraction_method', 'UNKNOWN')}")
    parts.append(f"  Verification: {verification}")

    if prov.get("sentence"):
        parts.append(f"  Source sentence: \"{prov['sentence'][:120]}...\"" if len(prov.get("sentence", "")) > 120 else f"  Source sentence: \"{prov.get('sentence', '')}\"")

    if verification == "AI_SUGGESTED":
        parts.append("  ⚠ AI-extracted — not yet verified by an investigator.")

    entity["explanation"] = "\n".join(parts)
    return entity


# ── Legacy compatibility wrappers ─────────────────────────────────────────────

class ExplainableAIScorer:
    """
    Wrapper class for backward compatibility with pipeline.py.
    Delegates to module-level functions.
    """

    def explain_relationship(self, rel: Dict[str, Any]) -> Dict[str, Any]:
        return explain_relationship(rel)

    def explain_entity_match(self, cluster: Dict[str, Any]) -> Dict[str, Any]:
        return explain_entity_match(cluster)

    def explain_entity(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        return explain_entity(entity)
