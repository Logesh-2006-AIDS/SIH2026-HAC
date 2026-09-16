"""
NLP Processing Pipeline — End-to-End Orchestrator
===================================================

Pipeline:
  RAW DOCUMENT
    → normalize_text()
    → extract_sentences_with_offsets()
    → PatternMatcher (deterministic: phones, vehicles, dates, cases)
    → NamedEntityRecognizer (hybrid: spaCy + heuristic + role classification)
    → RelationshipExtractor (semantic only, with negation/uncertainty)
    → CoreferenceResolver (rule-based)
    → EntityResolver (multi-signal candidate matching, no auto-merge)
    → Validator (pre-graph validation)
    → StagingModel (AI_SUGGESTED tagging)
    → ExplainableAI (human-readable explanations)
    → Structured JSON Output

Output format:
  {
    "document_id": str,
    "entities": [...],             # unique, validated entities
    "relationships": [...],        # semantic-only, validated relationships
    "events": [...],               # temporal events extracted
    "candidate_matches": [...],    # entity resolution candidates
    "unresolved_entities": [...],  # coreference unresolved references
    "warnings": [...],             # validation warnings
    "rejected": [...],             # rejected entities/relationships
    "processing_metadata": {...}   # pipeline stats
  }
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.nlp.preprocessor import LegalTextPreprocessor
from app.nlp.ner import NamedEntityRecognizer
from app.nlp.relationship_extractor import RelationshipExtractor
from app.nlp.entity_resolution import EntityResolver
from app.nlp.explainability import ExplainableAIScorer
from app.nlp.coreference import resolve_coreferences
from app.nlp.staging import stage_extraction
from app.nlp.validator import validate_entities, validate_relationships

logger = logging.getLogger(__name__)


class NLPProcessingPipeline:
    """
    End-to-End Orchestrator for AI-Powered Criminal Network Intelligence.

    Converts raw police FIR text / CDR / intelligence documents into
    structured knowledge graph inputs with provenance, confidence,
    and verification status.

    Fundamental principle:
      AI EXTRACTS FACTS.
      GRAPH ANALYTICS FINDS PATTERNS.
      AI SUGGESTS LEADS.
      INVESTIGATOR VERIFIES THEM.
    """

    def __init__(self):
        self.preprocessor = LegalTextPreprocessor()
        self.ner = NamedEntityRecognizer()
        self.relationship_extractor = RelationshipExtractor()
        self.entity_resolver = EntityResolver()
        self.explainability_scorer = ExplainableAIScorer()

    def process_document(
        self,
        raw_text: str,
        document_id: str = "DOC-UNKNOWN",
    ) -> Dict[str, Any]:
        """
        Full End-to-End Processing:

        1. Preprocessing & cleaning
        2. Entity extraction (deterministic + NER + role classification)
        3. Relationship extraction (semantic triggers, negation/uncertainty aware)
        4. Coreference resolution
        5. Entity resolution (multi-signal, no auto-merge)
        6. Validation
        7. Staging (AI_SUGGESTED tagging)
        8. Explainability

        Returns structured JSON for graph ingestion.
        """
        processing_start = datetime.now(tz=timezone.utc)
        pipeline_run_id = str(uuid.uuid4())[:8]

        # ── 1. Preprocessing ─────────────────────────────────────────────────
        cleaned_text = self.preprocessor.normalize_text(raw_text)
        sentences = self.preprocessor.extract_sentences_with_offsets(cleaned_text)
        sections = self.preprocessor.detect_document_sections(cleaned_text)

        # Attach sentence-level negation and uncertainty analysis
        from app.nlp.negation import analyze_sentence
        for s in sentences:
            neg_info = analyze_sentence(s["text"])
            s["has_negation"] = bool(neg_info.get("negated") or neg_info.get("is_negated") or neg_info.get("status") in ("NEGATED", "DENIED"))
            s["negation_cues"] = neg_info.get("markers", [])
            s["status"] = neg_info.get("status", "UNVERIFIED")

        logger.info(
            "[%s] Document '%s': %d characters, %d sentences",
            pipeline_run_id, document_id, len(cleaned_text), len(sentences)
        )

        # ── 2. Entity Extraction ──────────────────────────────────────────────
        raw_entities = self.ner.extract_entities(cleaned_text, source_document=document_id)

        logger.info(
            "[%s] Extracted %d raw entities",
            pipeline_run_id, len(raw_entities)
        )

        # ── 3. Relationship Extraction ────────────────────────────────────────
        raw_relationships = self.relationship_extractor.extract_relationships(
            cleaned_text,
            raw_entities,
            sentences=sentences,
            source_document=document_id,
        )

        # Count negated relationships (they will be rejected by validator)
        negated_count = sum(
            1 for r in raw_relationships if r.get("status") == "NEGATED"
        )
        alleged_count = sum(
            1 for r in raw_relationships if r.get("status") == "ALLEGED"
        )

        logger.info(
            "[%s] Extracted %d relationships (%d negated, %d alleged)",
            pipeline_run_id, len(raw_relationships), negated_count, alleged_count
        )

        # ── 4. Coreference Resolution ─────────────────────────────────────────
        coref_result = resolve_coreferences(sentences, raw_entities)
        unresolved_references = coref_result.get("unresolved_references", [])

        # ── 5. Entity Resolution ──────────────────────────────────────────────
        unique_entities, candidate_matches = self.entity_resolver.resolve_entities(raw_entities)

        # Add explained candidate matches
        explained_candidates = [
            self.explainability_scorer.explain_entity_match(m) for m in candidate_matches
        ]

        logger.info(
            "[%s] Entity resolution: %d raw → %d unique, %d candidates",
            pipeline_run_id, len(raw_entities), len(unique_entities), len(candidate_matches)
        )

        # ── 6. Validation ─────────────────────────────────────────────────────
        entity_validation = validate_entities(unique_entities)
        valid_entities = entity_validation["valid"]
        rejected_entities = entity_validation["rejected"]
        entity_warnings = entity_validation["warnings"]

        rel_validation = validate_relationships(raw_relationships, valid_entities)
        valid_relationships = rel_validation["valid"]
        rejected_relationships = rel_validation["rejected"]
        rel_warnings = rel_validation["warnings"]

        # ── 7. Staging ────────────────────────────────────────────────────────
        # Tag all valid items as AI_SUGGESTED
        staged_entities = [{**e, "verification_status": "AI_SUGGESTED"} for e in valid_entities]
        staged_relationships = [{**r, "verification_status": "AI_SUGGESTED"} for r in valid_relationships]

        # ── 8. Explainability ─────────────────────────────────────────────────
        explained_relationships = [
            self.explainability_scorer.explain_relationship(r) for r in staged_relationships
        ]
        explained_entities = [
            self.explainability_scorer.explain_entity(e) for e in staged_entities
        ]

        # ── Build temporal events list ────────────────────────────────────────
        events = []
        seen_dates: set = set()
        for rel in explained_relationships:
            temporal = rel.get("temporal_information", {})
            if temporal and temporal.get("has_temporal"):
                event_date = temporal.get("event_date")
                if event_date and event_date not in seen_dates:
                    seen_dates.add(event_date)
                    events.append({
                        "event_date": event_date,
                        "time": temporal.get("time"),
                        "relative_time": temporal.get("relative_time"),
                        "source_text": temporal.get("source_text", ""),
                        "related_relationship": rel.get("id"),
                        "evidence_sentence": rel.get("evidence", {}).get("sentence", ""),
                    })

        # ── Processing metadata ───────────────────────────────────────────────
        processing_end = datetime.now(tz=timezone.utc)
        processing_ms = int(
            (processing_end - processing_start).total_seconds() * 1000
        )

        processing_metadata = {
            "pipeline_run_id": pipeline_run_id,
            "model": "spaCy:en_core_web_sm + rules (hybrid)",
            "timestamp": processing_start.isoformat(),
            "processing_ms": processing_ms,
            "document_id": document_id,
            "input_characters": len(raw_text),
            "sentence_count": len(sentences),
            "raw_entities_extracted": len(raw_entities),
            "unique_entities_after_resolution": len(unique_entities),
            "validated_entities": len(valid_entities),
            "rejected_entities": len(rejected_entities),
            "raw_relationships_extracted": len(raw_relationships),
            "negated_relationships_detected": negated_count,
            "alleged_relationships": alleged_count,
            "validated_relationships": len(valid_relationships),
            "rejected_relationships": len(rejected_relationships),
            "entity_resolution_candidates": len(candidate_matches),
            "coreference_unresolved": len(unresolved_references),
            "entity_warnings": len(entity_warnings),
            "relationship_warnings": len(rel_warnings),
            "verification_status": "AI_SUGGESTED",
            "note": (
                "All extractions are AI_SUGGESTED. "
                "An investigator must verify important relationships before treating them as facts."
            ),
        }

        return {
            "document_id": document_id,
            "status": "SUCCESS",
            "entities": explained_entities,
            "relationships": explained_relationships,
            "events": events,
            "candidate_matches": explained_candidates,
            "unresolved_entities": unresolved_references,
            "warnings": entity_warnings + rel_warnings,
            "rejected": rejected_entities + rejected_relationships,
            "sections": sections,
            "sentences": sentences,
            "coreference": coref_result,
            "processing_metadata": processing_metadata,
            # Legacy fields for backward compatibility
            "summary": {
                "raw_character_count": len(raw_text),
                "total_entities_extracted": len(raw_entities),
                "total_relationships_extracted": len(raw_relationships),
                "resolved_unique_entities": len(unique_entities),
                "staged_entities": len(staged_entities),
                "staged_relationships": len(staged_relationships),
                "negated_relationships_suppressed": negated_count,
            },
            # For graph_builder.py compatibility
            "resolved_clusters": explained_candidates,
        }


# Global singleton pipeline instance
nlp_pipeline = NLPProcessingPipeline()
