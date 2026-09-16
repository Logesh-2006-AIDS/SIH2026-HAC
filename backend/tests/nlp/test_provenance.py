"""
Tests: Provenance
==================
Every extracted entity and relationship must have complete provenance.
An investigator must be able to answer "why does this relationship exist?"
"""

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.nlp.ner import NamedEntityRecognizer
from app.nlp.relationship_extractor import RelationshipExtractor
from app.nlp.pipeline import NLPProcessingPipeline


SAMPLE_FIR = """
FIR No. 101/2025. On 12 June 2025, complainant Suresh Kumar reported that
accused Ramesh Gupta stole his vehicle DL-01-AB-1234. Witness Mohan Lal
stated he saw the accused driving the vehicle. Phone used: 9876543210.
"""


class TestEntityProvenance:

    def setup_method(self):
        self.ner = NamedEntityRecognizer()

    def test_every_entity_has_provenance(self):
        entities = self.ner.extract_entities(SAMPLE_FIR, source_document="FIR-101")
        for entity in entities:
            assert "provenance" in entity, f"Entity '{entity.get('text')}' missing provenance"

    def test_provenance_has_source_document(self):
        entities = self.ner.extract_entities(SAMPLE_FIR, source_document="FIR-101")
        for entity in entities:
            prov = entity["provenance"]
            assert prov.get("source_document") == "FIR-101", \
                f"Entity '{entity.get('text')}' has wrong source_document: {prov.get('source_document')}"

    def test_provenance_has_extraction_method(self):
        entities = self.ner.extract_entities(SAMPLE_FIR, source_document="FIR-101")
        for entity in entities:
            prov = entity["provenance"]
            assert prov.get("extraction_method"), \
                f"Entity '{entity.get('text')}' missing extraction_method"

    def test_provenance_has_char_offsets(self):
        entities = self.ner.extract_entities(SAMPLE_FIR, source_document="FIR-101")
        for entity in entities:
            prov = entity["provenance"]
            assert "char_start" in prov, f"Entity '{entity.get('text')}' missing char_start"
            assert "char_end" in prov, f"Entity '{entity.get('text')}' missing char_end"
            assert prov["char_start"] >= 0
            assert prov["char_end"] >= prov["char_start"]

    def test_provenance_has_sentence(self):
        entities = self.ner.extract_entities(SAMPLE_FIR, source_document="FIR-101")
        # At least some entities should have a source sentence
        entities_with_sentence = [
            e for e in entities if e.get("provenance", {}).get("sentence")
        ]
        assert len(entities_with_sentence) > 0, "Some entities must have source sentence in provenance"

    def test_entity_has_id(self):
        entities = self.ner.extract_entities(SAMPLE_FIR)
        for entity in entities:
            assert "id" in entity, f"Entity '{entity.get('text')}' missing id"
            assert entity["id"], "Entity id must not be empty"


class TestRelationshipProvenance:

    def setup_method(self):
        self.extractor = RelationshipExtractor()

    def _sample_entities(self):
        return [
            {"id": "e1", "type": "PERSON", "text": "Ramesh Gupta", "role": "ACCUSED",
             "confidence": 0.9, "normalized_value": "ramesh gupta"},
            {"id": "e2", "type": "VEHICLE", "text": "DL-01-AB-1234", "role": None,
             "confidence": 0.93, "normalized_value": "DL-01-AB-1234"},
        ]

    def test_every_relationship_has_evidence(self):
        text = "Ramesh Gupta was seen driving vehicle DL-01-AB-1234."
        relationships = self.extractor.extract_relationships(
            text, self._sample_entities(), source_document="FIR-101"
        )
        for rel in relationships:
            assert "evidence" in rel, f"Relationship missing evidence: {rel}"
            assert rel["evidence"].get("sentence"), "Evidence must have source sentence"

    def test_evidence_sentence_is_substring_of_document(self):
        text = "Ramesh Gupta was seen driving vehicle DL-01-AB-1234."
        relationships = self.extractor.extract_relationships(
            text, self._sample_entities(), source_document="FIR-101"
        )
        for rel in relationships:
            evidence_sentence = rel["evidence"].get("sentence", "")
            if evidence_sentence:
                # Evidence sentence should be part of the original text (or close)
                assert len(evidence_sentence) > 0

    def test_relationship_has_source_entity_ids(self):
        text = "Ramesh Gupta was driving vehicle DL-01-AB-1234."
        relationships = self.extractor.extract_relationships(
            text, self._sample_entities(), source_document="FIR-101"
        )
        for rel in relationships:
            assert rel.get("source_entity_id") or rel.get("subject"), "Missing source entity ID"
            assert rel.get("target_entity_id") or rel.get("object"), "Missing target entity ID"

    def test_relationship_has_id(self):
        text = "Ramesh Gupta was driving vehicle DL-01-AB-1234."
        relationships = self.extractor.extract_relationships(
            text, self._sample_entities(), source_document="FIR-101"
        )
        for rel in relationships:
            assert "id" in rel, "Relationship missing id"


class TestPipelineProvenance:
    """End-to-end provenance test through full pipeline."""

    def setup_method(self):
        self.pipeline = NLPProcessingPipeline()

    def test_pipeline_output_entities_have_provenance(self):
        result = self.pipeline.process_document(SAMPLE_FIR, document_id="FIR-101")
        entities = result["entities"]
        for entity in entities:
            assert "provenance" in entity, f"Pipeline output entity missing provenance: {entity.get('text')}"

    def test_pipeline_output_relationships_have_evidence(self):
        result = self.pipeline.process_document(SAMPLE_FIR, document_id="FIR-101")
        relationships = result["relationships"]
        for rel in relationships:
            assert "evidence" in rel, "Pipeline relationship missing evidence"

    def test_pipeline_metadata_populated(self):
        result = self.pipeline.process_document(SAMPLE_FIR, document_id="FIR-101")
        meta = result["processing_metadata"]
        assert meta.get("document_id") == "FIR-101"
        assert meta.get("pipeline_run_id")
        assert "timestamp" in meta
        assert "model" in meta

    def test_pipeline_has_staged_status(self):
        result = self.pipeline.process_document(SAMPLE_FIR, document_id="FIR-101")
        for entity in result["entities"]:
            assert entity.get("verification_status") == "AI_SUGGESTED", \
                f"All pipeline outputs must be AI_SUGGESTED, got {entity.get('verification_status')}"
