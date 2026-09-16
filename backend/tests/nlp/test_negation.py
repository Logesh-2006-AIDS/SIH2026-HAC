"""
Tests: Negation and Uncertainty Detection
==========================================

CRITICAL TESTS:
  "Ravi did not contact Arun" → NO CONTACTED relationship created
  "No evidence linking Ravi to the vehicle" → NO OWNS relationship
  "Allegedly involved" → status=ALLEGED, NOT CONFIRMED
  "Denied knowing" → status=DENIED

These tests verify that the system does not create false graph facts
from negative or uncertain statements.
"""

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.nlp.negation import detect_negation, detect_uncertainty, analyze_sentence


class TestNegationDetection:

    def test_did_not_contact_is_negated(self):
        """Classic negation: 'did not contact' must be detected."""
        sentence = "Ravi did not contact Arun during the period in question."
        result = detect_negation(sentence)
        assert result is True, "Must detect negation in 'did not contact'"

    def test_was_not_present_is_negated(self):
        sentence = "Suresh was not present at the crime scene."
        result = detect_negation(sentence)
        assert result is True

    def test_no_evidence_is_negated(self):
        sentence = "No evidence was found linking Ravi to the vehicle."
        result = detect_negation(sentence)
        assert result is True

    def test_denied_knowing_is_negated(self):
        sentence = "Arun denied knowing Ravi Kumar or having any contact with him."
        result = detect_negation(sentence)
        assert result is True

    def test_could_not_establish_is_negated(self):
        sentence = "Investigation could not establish any link between the two suspects."
        result = detect_negation(sentence)
        assert result is True

    def test_positive_sentence_is_not_negated(self):
        sentence = "Ravi Kumar called Arun on 12 June 2025."
        result = detect_negation(sentence)
        assert result is False, "Positive sentence must NOT be detected as negated"

    def test_arrested_sentence_is_not_negated(self):
        sentence = "Ramesh Gupta was arrested from Lajpat Nagar."
        result = detect_negation(sentence)
        assert result is False

    def test_not_accused_is_negated(self):
        sentence = "Suresh Kumar is not accused in this case."
        result = detect_negation(sentence)
        assert result is True


class TestUncertaintyDetection:

    def test_alleged_gives_alleged_status(self):
        sentence = "Ravi Kumar was allegedly involved in the robbery."
        result = detect_uncertainty(sentence)
        assert result["status"] == "ALLEGED", f"Expected ALLEGED, got {result['status']}"
        assert result["is_uncertain"] is True

    def test_suspected_gives_suspected_status(self):
        sentence = "Ramesh Gupta is suspected of involvement in the case."
        result = detect_uncertainty(sentence)
        assert result["status"] in ("SUSPECTED", "ALLEGED")
        assert result["is_uncertain"] is True

    def test_reportedly_gives_alleged_status(self):
        sentence = "The accused reportedly called the victim on the night of the incident."
        result = detect_uncertainty(sentence)
        assert result["status"] in ("ALLEGED", "SUSPECTED")
        assert result["is_uncertain"] is True

    def test_denied_gives_denied_status(self):
        sentence = "Ravi denied knowing Arun or having any connection."
        result = detect_uncertainty(sentence)
        assert result["status"] == "DENIED"

    def test_direct_statement_is_confirmed(self):
        sentence = "Ramesh Gupta was arrested on 12 June 2025."
        result = detect_uncertainty(sentence)
        assert result["status"] == "CONFIRMED"
        assert result["is_uncertain"] is False

    def test_according_to_gives_alleged(self):
        sentence = "According to the informant, Ravi Kumar is the mastermind."
        result = detect_uncertainty(sentence)
        assert result["status"] in ("ALLEGED", "SUSPECTED")

    def test_may_have_gives_uncertain(self):
        sentence = "Arun may have transferred the money to the accused."
        result = detect_uncertainty(sentence)
        assert result["is_uncertain"] is True


class TestAnalyzeSentence:
    """Combined negation + uncertainty analysis."""

    def test_negated_overrides_uncertainty(self):
        """If negated, status must be NEGATED regardless of other markers."""
        sentence = "Ravi did not allegedly contact Arun."
        result = analyze_sentence(sentence)
        assert result["status"] == "NEGATED", f"Expected NEGATED, got {result['status']}"
        assert result["negated"] is True

    def test_alleged_without_negation(self):
        sentence = "Ravi was allegedly seen near the crime scene."
        result = analyze_sentence(sentence)
        assert result["negated"] is False
        assert result["status"] in ("ALLEGED", "SUSPECTED")

    def test_confirmed_positive(self):
        sentence = "Ravi Kumar was arrested from Karol Bagh on 15 July 2025."
        result = analyze_sentence(sentence)
        assert result["negated"] is False
        assert result["status"] == "CONFIRMED"


class TestNegationInRelationshipExtractor:
    """
    Critical integration test: negated statements must NOT produce
    relationships that enter the graph.
    """

    def setup_method(self):
        from app.nlp.relationship_extractor import RelationshipExtractor
        self.extractor = RelationshipExtractor()

    def test_did_not_contact_no_relationship(self):
        """
        'Ravi did not contact Arun' must NOT create CONTACTED relationship.
        If a relationship is created, it must be status=NEGATED.
        """
        text = "Ravi did not contact Arun during the investigation period."
        entities = [
            {"id": "e1", "type": "PERSON", "text": "Ravi", "confidence": 0.9,
             "role": "ACCUSED", "normalized_value": "ravi"},
            {"id": "e2", "type": "PERSON", "text": "Arun", "confidence": 0.9,
             "role": "UNKNOWN", "normalized_value": "arun"},
        ]
        relationships = self.extractor.extract_relationships(text, entities)

        # Any CONTACTED relationships must be NEGATED
        contacted = [r for r in relationships if r.get("relationship_type") == "CONTACTED"]
        for rel in contacted:
            assert rel["status"] == "NEGATED", \
                f"'did not contact' must produce NEGATED, got {rel['status']}"

    def test_denied_relationship_is_denied(self):
        text = "Arun denied knowing Ravi Kumar or having any association."
        entities = [
            {"id": "e1", "type": "PERSON", "text": "Arun", "confidence": 0.9,
             "role": "UNKNOWN", "normalized_value": "arun"},
            {"id": "e2", "type": "PERSON", "text": "Ravi Kumar", "confidence": 0.9,
             "role": "UNKNOWN", "normalized_value": "ravi kumar"},
        ]
        relationships = self.extractor.extract_relationships(text, entities)

        knows_rels = [r for r in relationships if r.get("relationship_type") == "KNOWS"]
        for rel in knows_rels:
            assert rel["status"] in ("NEGATED", "DENIED"), \
                f"Denied relationship must be NEGATED/DENIED, got {rel['status']}"
