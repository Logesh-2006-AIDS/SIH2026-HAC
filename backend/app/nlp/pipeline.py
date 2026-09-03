"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Master End-to-End NLP Processing Pipeline
"""
from typing import Dict, Any, List
from app.nlp.preprocessor import LegalTextPreprocessor
from app.nlp.ner import NamedEntityRecognizer
from app.nlp.relations import RelationshipExtractor
from app.nlp.resolution import EntityResolver

from app.nlp.llm_enhancer import llm_engine

class NLPPipeline:
    """
    Production-grade Hybrid NLP pipeline that orchestrates deterministic legal text parsing,
    named entity recognition, semantic relationship extraction, entity resolution, and optional LLM enrichment.
    """

    def __init__(self):
        self.preprocessor = LegalTextPreprocessor()
        self.ner = NamedEntityRecognizer()
        self.relationship_extractor = RelationshipExtractor()
        self.entity_resolver = EntityResolver()
        self.llm = llm_engine

    def process_text(self, text: str, case_id: str = "CASE-AUTO") -> Dict[str, Any]:
        # 1. Normalize and segment text
        cleaned_text = self.preprocessor.normalize_text(text)
        sections = self.preprocessor.segment_document(cleaned_text)

        # 2. Extract Entities (Rule-Based High Precision)
        entities = self.ner.extract_entities(cleaned_text, section_info=sections)

        # 3. Extract Relationships with Legal Evidence Quotes
        relationships = self.relationship_extractor.extract_relationships(cleaned_text, entities, fir_id=case_id)

        # 4. Resolve & Deduplicate Entities / Aliases
        clusters = self.entity_resolver.resolve_entities(entities)

        # 5. Extract Key Metrics
        suspects = [c for c in clusters if c["label"] == "SUSPECT_PERSON"]
        vehicles = [e for e in entities if e["label"] == "VEHICLE_NUMBER"]
        phones = [e for e in entities if e["label"] == "PHONE_NUMBER"]
        ipc_sections = [e for e in entities if e["label"] == "LEGAL_SECTION"]
        locations = [e for e in entities if e["label"] == "LOCATION"]

        return {
            "case_id": case_id,
            "status": "SUCCESS",
            "summary": {
                "character_count": len(cleaned_text),
                "total_entities": len(entities),
                "total_relationships": len(relationships),
                "suspects_count": len(suspects),
                "vehicles_count": len(vehicles),
                "phones_count": len(phones),
                "ipc_sections_count": len(ipc_sections),
                "locations_count": len(locations),
            },
            "entities": entities,
            "relationships": relationships,
            "resolved_clusters": clusters,
            "sections": sections,
            "llm_engine_status": "AVAILABLE" if self.llm.is_available() else "LOCAL_FALLBACK"
        }

# Global singleton
nlp_engine = NLPPipeline()
