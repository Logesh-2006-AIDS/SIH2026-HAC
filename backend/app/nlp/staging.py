"""
Staging Model — Between NLP Extraction and Graph Insertion
============================================================

Pipeline flow:
  RAW DOCUMENT
    → EXTRACTION (NLP pipeline)
    → VALIDATION (validator.py)
    → ENTITY RESOLUTION (entity_resolution.py)
    → RELATIONSHIP VALIDATION
    → AI_SUGGESTED (staged for graph)
    → GRAPH (Memgraph, tagged verification_status=AI_SUGGESTED)
    → INVESTIGATOR VERIFICATION

Verification status lifecycle:
  AI_SUGGESTED → VERIFIED (investigator confirms)
  AI_SUGGESTED → REJECTED (investigator rejects)

CRITICAL RULE:
  All NLP-extracted items enter graph as verification_status=AI_SUGGESTED.
  Only the investigator can promote to VERIFIED.
  NEGATED relationships are REJECTED before staging — never enter graph.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.nlp.validator import validate_entities, validate_relationships

logger = logging.getLogger(__name__)

_TIMESTAMP_NOW = lambda: datetime.now(tz=timezone.utc).isoformat()


def _tag_entity_for_graph(entity: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare entity for graph insertion.
    Adds/enforces verification_status = AI_SUGGESTED.
    """
    return {
        **entity,
        "verification_status": "AI_SUGGESTED",
        "staged_at": _TIMESTAMP_NOW(),
    }


def _tag_relationship_for_graph(rel: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare relationship for graph insertion.
    Adds/enforces verification_status = AI_SUGGESTED.
    """
    return {
        **rel,
        "verification_status": "AI_SUGGESTED",
        "staged_at": _TIMESTAMP_NOW(),
    }


def stage_extraction(nlp_output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Runs the staging pipeline on raw NLP output.

    Input: raw NLP pipeline output dict
    Output: staged dict ready for graph insertion

    Returns:
        {
            "staged_entities": List[entity],       # AI_SUGGESTED, valid
            "staged_relationships": List[rel],     # AI_SUGGESTED, valid (non-negated)
            "candidate_matches": List[...],        # entity resolution candidates
            "rejected_entities": List[...],        # failed validation
            "rejected_relationships": List[...],   # failed / NEGATED
            "entity_warnings": List[...],
            "relationship_warnings": List[...],
            "staging_summary": {
                "total_entities_extracted": int,
                "staged_entities": int,
                "rejected_entities": int,
                "total_relationships_extracted": int,
                "staged_relationships": int,
                "rejected_relationships": int,
                "negated_relationships": int,
            }
        }
    """
    raw_entities = nlp_output.get("entities", [])
    raw_relationships = nlp_output.get("relationships", [])
    candidate_matches = nlp_output.get("candidate_matches", [])

    # ── Entity Validation ─────────────────────────────────────────────────────
    entity_validation = validate_entities(raw_entities)
    valid_entities = entity_validation["valid"]
    rejected_entities = entity_validation["rejected"]
    entity_warnings = entity_validation["warnings"]

    # ── Relationship Validation ───────────────────────────────────────────────
    rel_validation = validate_relationships(raw_relationships, valid_entities)
    valid_rels = rel_validation["valid"]
    rejected_rels = rel_validation["rejected"]
    rel_warnings = rel_validation["warnings"]

    # Count negated relationships
    negated_count = sum(
        1 for r in rel_validation["rejected"]
        if any("NEGATED" in reason for reason in r.get("reasons", []))
    )

    # ── Tag for graph insertion ───────────────────────────────────────────────
    staged_entities = [_tag_entity_for_graph(e) for e in valid_entities]
    staged_relationships = [_tag_relationship_for_graph(r) for r in valid_rels]

    logger.info(
        "Staging complete: %d/%d entities staged, %d/%d relationships staged, "
        "%d negated relationships suppressed.",
        len(staged_entities), len(raw_entities),
        len(staged_relationships), len(raw_relationships),
        negated_count,
    )

    return {
        "staged_entities": staged_entities,
        "staged_relationships": staged_relationships,
        "candidate_matches": candidate_matches,
        "rejected_entities": rejected_entities,
        "rejected_relationships": rejected_rels,
        "entity_warnings": entity_warnings,
        "relationship_warnings": rel_warnings,
        "staging_summary": {
            "total_entities_extracted": len(raw_entities),
            "staged_entities": len(staged_entities),
            "rejected_entities": len(rejected_entities),
            "total_relationships_extracted": len(raw_relationships),
            "staged_relationships": len(staged_relationships),
            "rejected_relationships": len(rejected_rels),
            "negated_relationships": negated_count,
        },
    }


def build_graph_payload(staged: Dict[str, Any], document_id: str) -> Dict[str, Any]:
    """
    Convert staged extraction to Memgraph-ready payload.
    All items tagged verification_status=AI_SUGGESTED.

    This payload is consumed by graph_builder.py / ingestion.py.
    """
    return {
        "document_id": document_id,
        "entities": staged["staged_entities"],
        "relationships": staged["staged_relationships"],
        "candidate_matches": staged["candidate_matches"],
        "metadata": {
            "staging_summary": staged["staging_summary"],
            "warnings": staged["entity_warnings"] + staged["relationship_warnings"],
            "rejected": staged["rejected_entities"] + staged["rejected_relationships"],
        },
    }
