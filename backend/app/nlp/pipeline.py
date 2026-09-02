from typing import Dict, Any, List
from app.nlp.preprocessor import LegalTextPreprocessor
from app.nlp.ner import NamedEntityRecognizer
from app.nlp.relationship_extractor import RelationshipExtractor
from app.nlp.entity_resolution import EntityResolver
from app.nlp.explainability import ExplainableAIScorer

class NLPProcessingPipeline:
    """
    End-to-End Orchestrator for Phase 3 NLP Processing Engine.
    Converts raw police FIR reports / CDR text into structured Knowledge Graph inputs.
    Designed for tomorrow's hackathon demo.
    """

    def __init__(self):
        self.preprocessor = LegalTextPreprocessor()
        self.ner = NamedEntityRecognizer()
        self.relationship_extractor = RelationshipExtractor()
        self.entity_resolver = EntityResolver(threshold=0.70)
        self.explainability_scorer = ExplainableAIScorer()

    def process_document(self, raw_text: str, document_id: str = "DOC-9042") -> Dict[str, Any]:
        """
        Full End-to-End Processing Workflow:
        1. Preprocess & Clean Text
        2. Named Entity Recognition (Extract Persons, Aliases, Phones, Vehicles, FIRs)
        3. Relationship Extraction (Extract Triples + Evidence Sentence)
        4. Entity Resolution (Group duplicates & aliases)
        5. Add Explainability Rationales
        """
        # 1. Cleaning
        cleaned_text = self.preprocessor.normalize_text(raw_text)
        sections = self.preprocessor.segment_document(cleaned_text)

        # 2. Entity Extraction
        entities = self.ner.extract_entities(cleaned_text)

        # 3. Relationship Extraction
        relationships = self.relationship_extractor.extract_relationships(cleaned_text, entities)

        # 4. Explainable Scoring for Relationships
        explained_relationships = [
            self.explainability_scorer.explain_relationship(rel) for rel in relationships
        ]

        # 5. Entity Resolution
        resolved_clusters = self.entity_resolver.resolve_entities(entities)
        explained_clusters = [
            self.explainability_scorer.explain_entity_match(cluster) for cluster in resolved_clusters
        ]

        return {
            "document_id": document_id,
            "status": "SUCCESS",
            "summary": {
                "raw_character_count": len(raw_text),
                "total_entities_extracted": len(entities),
                "total_relationships_extracted": len(relationships),
                "resolved_unique_entities": len(resolved_clusters)
            },
            "entities": entities,
            "resolved_clusters": explained_clusters,
            "relationships": explained_relationships,
            "sections": sections
        }

# Global singleton pipeline instance
nlp_pipeline = NLPProcessingPipeline()
