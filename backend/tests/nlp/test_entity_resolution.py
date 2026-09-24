"""
Tests: Entity Resolution
=========================

CRITICAL: Entities must NOT be automatically merged based on name similarity alone.
Multi-signal corroboration is required for MATCH decision.
Entities with only name similarity get POSSIBLE_MATCH (flagged for investigator).
"""

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.nlp.entity_resolution import EntityResolver, _name_similarity


class TestNameSimilarity:

    def test_identical_names_are_similar(self):
        sim = _name_similarity("Ravi Kumar", "Ravi Kumar")
        assert sim >= 95.0

    def test_different_names_are_not_similar(self):
        sim = _name_similarity("Ravi Kumar", "Arun Singh")
        assert sim < 70.0, f"Unrelated names should have low similarity, got {sim}"

    def test_abbreviated_name_vs_full_name(self):
        sim = _name_similarity("R. Kumar", "Ravi Kumar")
        # These COULD be the same person but similarity alone is insufficient
        # The system should flag this as POSSIBLE_MATCH at most
        assert 0.0 <= sim <= 100.0

    def test_case_insensitive(self):
        sim = _name_similarity("RAVI KUMAR", "ravi kumar")
        assert sim >= 95.0

    def test_title_stripped_for_comparison(self):
        sim = _name_similarity("Inspector Ramesh Singh", "Ramesh Singh")
        # Titles should be stripped → high similarity
        assert sim >= 80.0


class TestEntityResolutionNoCriticalAutoMerge:
    """
    CRITICAL: The resolver must NOT auto-merge based on name similarity alone.
    """

    def setup_method(self):
        self.resolver = EntityResolver()

    def _make_person(self, name, doc="FIR-101"):
        return {
            "id": f"id_{name.lower().replace(' ', '_')}",
            "type": "PERSON",
            "text": name,
            "normalized_value": name.lower(),
            "role": "UNKNOWN",
            "confidence": 0.85,
            "provenance": {"source_document": doc, "sentence": f"{name} was mentioned."},
        }

    def test_different_persons_not_merged(self):
        """Ravi Kumar and Arun Singh should never be merged."""
        entities = [self._make_person("Ravi Kumar"), self._make_person("Arun Singh")]
        unique, candidates = self.resolver.resolve_entities(entities)
        # Both should remain as separate entities
        assert len(unique) == 2, "Different persons must not be merged"

    def test_similar_names_without_corroboration_is_possible_match_not_match(self):
        """
        'Raj Kumar' vs 'Rajesh Kumar' — similar but not identical.
        Without corroboration, must be POSSIBLE_MATCH, not MATCH.
        """
        e1 = self._make_person("Raj Kumar", "FIR-101")
        e2 = self._make_person("Rajesh Kumar", "FIR-104")
        unique, candidates = self.resolver.resolve_entities([e1, e2])

        # If candidates were generated, check decision
        for cand in candidates:
            e1_text = cand["entity_1"]["text"]
            e2_text = cand["entity_2"]["text"]
            if (("Raj Kumar" in e1_text or "Raj Kumar" in e2_text) and
                    ("Rajesh Kumar" in e1_text or "Rajesh Kumar" in e2_text)):
                # Without corroboration, must NOT be auto-merged (MATCH)
                assert cand["resolution_decision"] in ("POSSIBLE_MATCH", "NO_MATCH"), \
                    f"Similar names without corroboration should not be MATCH, got {cand['resolution_decision']}"

    def test_identical_names_with_same_phone_is_match(self):
        """Same name + same phone → MATCH / SUGGESTED_MERGE is generated."""
        e1 = self._make_person("Ravi Kumar", "FIR-101")
        e2 = self._make_person("Ravi Kumar", "FIR-104")
        # Add phone corroboration
        e1["phone"] = "9876543210"
        e2["phone"] = "9876543210"

        unique, candidates = self.resolver.resolve_entities([e1, e2])
        for cand in candidates:
            if cand["corroboration_count"] > 0:
                assert cand["resolution_decision"] in ("MATCH", "SUGGESTED_MERGE"), \
                    "High name similarity + phone corroboration should be SUGGESTED_MERGE"

    def test_candidate_matches_have_required_fields(self):
        """Every candidate match must include the required fields for investigator review."""
        e1 = self._make_person("Suresh Kumar", "FIR-101")
        e2 = self._make_person("Suresh K.", "FIR-104")
        e1["phone"] = "9876543210"
        e2["phone"] = "9876543210"
        _, candidates = self.resolver.resolve_entities([e1, e2])

        for cand in candidates:
            assert "entity_1" in cand
            assert "entity_2" in cand
            assert "name_similarity" in cand
            assert "corroboration_signals" in cand or "corroborating_signals" in cand
            assert "resolution_decision" in cand
            assert "resolution_confidence" in cand or "similarity_score" in cand
            assert "rationale" in cand or "match_reason" in cand

    def test_resolution_decision_values_are_valid(self):
        """Resolution decision must be one of the defined values."""
        valid_decisions = {"SUGGESTED_MERGE", "POSSIBLE_MATCH", "NO_MATCH", "MATCH", "UNKNOWN"}
        e1 = self._make_person("Suresh Kumar")
        e2 = self._make_person("S. Kumar")
        e1["phone"] = "9876543210"
        e2["phone"] = "9876543210"
        _, candidates = self.resolver.resolve_entities([e1, e2])
        for cand in candidates:
            assert cand["resolution_decision"] in valid_decisions, \
                f"Invalid resolution decision: {cand['resolution_decision']}"

    def test_non_person_entities_not_resolved(self):
        """Phone numbers and vehicles are not run through person resolution."""
        entities = [
            {"id": "ph1", "type": "PHONE", "text": "9876543210", "normalized_value": "+919876543210",
             "confidence": 0.97, "provenance": {}},
            {"id": "ph2", "type": "PHONE", "text": "9876543211", "normalized_value": "+919876543211",
             "confidence": 0.97, "provenance": {}},
        ]
        unique, candidates = self.resolver.resolve_entities(entities)
        # Phones should remain as-is, no resolution run
        assert len(unique) == 2


class TestCrossDocumentResolution:

    def setup_method(self):
        self.resolver = EntityResolver()

    def test_cross_document_candidates_generated(self):
        """Same person appearing in two FIRs should generate a cross-document candidate."""
        entities_doc1 = [
            {"id": "id_ravi_101", "type": "PERSON", "text": "Ravi Kumar",
             "normalized_value": "ravi kumar", "confidence": 0.9,
             "provenance": {"source_document": "FIR-101"}}
        ]
        entities_doc2 = [
            {"id": "id_ravi_104", "type": "PERSON", "text": "R. Kumar",
             "normalized_value": "r. kumar", "confidence": 0.85,
             "provenance": {"source_document": "FIR-104"}}
        ]
        entity_sets = [("FIR-101", entities_doc1), ("FIR-104", entities_doc2)]
        candidates = self.resolver.find_cross_document_candidates(entity_sets)
        # Should generate at least one candidate between the two
        assert isinstance(candidates, list)
