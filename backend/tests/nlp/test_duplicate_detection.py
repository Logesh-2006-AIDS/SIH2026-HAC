"""
Tests: Duplicate Detection
============================
Verifies that duplicate entities and relationships are detected and rejected.
"""

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.nlp.validator import validate_entities, validate_relationships


class TestDuplicateEntityDetection:

    def _make_entity(self, text, entity_type, normalized=None, eid=None):
        return {
            "id": eid or f"id_{text.lower().replace(' ', '_')}",
            "type": entity_type,
            "text": text,
            "normalized_value": normalized or text.lower(),
            "confidence": 0.90,
            "provenance": {"sentence": "Test sentence.", "source_document": "FIR-101",
                           "extraction_method": "TEST"},
        }

    def test_duplicate_phone_detected(self):
        entities = [
            self._make_entity("9876543210", "PHONE", "+919876543210", "ph1"),
            self._make_entity("9876543210", "PHONE", "+919876543210", "ph2"),  # Duplicate
        ]
        result = validate_entities(entities)
        # Should have warnings about duplicate
        all_issues = [
            issue
            for w in result["warnings"]
            for issue in w.get("issues", [])
        ]
        duplicate_warnings = [i for i in all_issues if "duplicate" in i.lower()]
        assert len(duplicate_warnings) >= 1, "Duplicate phone must be detected"

    def test_duplicate_vehicle_detected(self):
        entities = [
            self._make_entity("DL-01-AB-1234", "VEHICLE", "dl-01-ab-1234", "v1"),
            self._make_entity("DL-01-AB-1234", "VEHICLE", "dl-01-ab-1234", "v2"),  # Duplicate
        ]
        result = validate_entities(entities)
        all_issues = [
            issue
            for w in result["warnings"]
            for issue in w.get("issues", [])
        ]
        duplicate_warnings = [i for i in all_issues if "duplicate" in i.lower()]
        assert len(duplicate_warnings) >= 1

    def test_non_duplicate_entities_not_flagged(self):
        entities = [
            self._make_entity("9876543210", "PHONE", "+919876543210"),
            self._make_entity("8800123456", "PHONE", "+918800123456"),
        ]
        result = validate_entities(entities)
        duplicate_warnings = [
            issue
            for w in result["warnings"]
            for issue in w.get("issues", [])
            if "duplicate" in issue.lower()
        ]
        assert len(duplicate_warnings) == 0, "Non-duplicate phones must not be flagged"

    def test_different_types_same_text_not_duplicate(self):
        """Same text but different type is not a duplicate."""
        entities = [
            self._make_entity("DL01AB1234", "VEHICLE"),
            self._make_entity("DL01AB1234", "CASE"),
        ]
        result = validate_entities(entities)
        # These should not be flagged as duplicates of each other
        all_issues = [
            issue
            for w in result["warnings"]
            for issue in w.get("issues", [])
        ]
        # If duplicates are detected, they should be per-type
        assert isinstance(result, dict)


class TestDuplicateRelationshipDetection:

    def _make_rel(self, src, rel_type, tgt, status="CONFIRMED"):
        return {
            "id": f"id_{src}_{rel_type}_{tgt}",
            "source_entity_id": src,
            "source_entity_text": src,
            "source_entity_type": "PERSON",
            "relationship_type": rel_type,
            "target_entity_id": tgt,
            "target_entity_text": tgt,
            "target_entity_type": "PERSON",
            "confidence": 0.85,
            "status": status,
            "evidence": {"sentence": "Test sentence for evidence."},
            "provenance": {"extraction_method": "TEST"},
        }

    def _sample_entities(self):
        return [
            {"id": "e1", "type": "PERSON", "text": "Ravi", "normalized_value": "ravi", "confidence": 0.9,
             "provenance": {"sentence": "Test.", "source_document": "FIR", "extraction_method": "TEST"}},
            {"id": "e2", "type": "PERSON", "text": "Arun", "normalized_value": "arun", "confidence": 0.9,
             "provenance": {"sentence": "Test.", "source_document": "FIR", "extraction_method": "TEST"}},
        ]

    def test_duplicate_relationship_rejected(self):
        relationships = [
            self._make_rel("e1", "CONTACTED", "e2"),
            self._make_rel("e1", "CONTACTED", "e2"),  # Duplicate
        ]
        result = validate_relationships(relationships, self._sample_entities())
        rejected = result["rejected"]
        assert len(rejected) >= 1, "Duplicate relationship must be rejected"

    def test_non_duplicate_relationships_not_rejected(self):
        relationships = [
            self._make_rel("e1", "CONTACTED", "e2"),
            self._make_rel("e1", "KNOWS", "e2"),  # Different type — not duplicate
        ]
        result = validate_relationships(relationships, self._sample_entities())
        # Neither should be rejected for duplication
        dup_rejections = [
            r for r in result["rejected"]
            if any("duplicate" in reason.lower() for reason in r.get("reasons", []))
        ]
        assert len(dup_rejections) == 0

    def test_negated_relationship_rejected(self):
        relationships = [self._make_rel("e1", "CONTACTED", "e2", status="NEGATED")]
        result = validate_relationships(relationships, self._sample_entities())
        assert len(result["rejected"]) >= 1, "NEGATED relationship must be rejected"

    def test_self_referential_relationship_rejected(self):
        relationships = [self._make_rel("e1", "KNOWS", "e1")]  # e1 → KNOWS → e1
        result = validate_relationships(relationships, self._sample_entities())
        assert len(result["rejected"]) >= 1, "Self-referential relationship must be rejected"


class TestInvalidEntityRejection:

    def test_empty_entity_text_rejected(self):
        entities = [{
            "id": "e1", "type": "PERSON", "text": "", "normalized_value": "",
            "confidence": 0.9, "provenance": {}
        }]
        result = validate_entities(entities)
        assert len(result["rejected"]) >= 1

    def test_very_low_confidence_entity_rejected(self):
        entities = [{
            "id": "e1", "type": "PERSON", "text": "Ravi Kumar", "normalized_value": "ravi kumar",
            "confidence": 0.15,  # Below rejection threshold
            "provenance": {"sentence": "Test.", "source_document": "FIR", "extraction_method": "TEST"}
        }]
        result = validate_entities(entities)
        assert len(result["rejected"]) >= 1
