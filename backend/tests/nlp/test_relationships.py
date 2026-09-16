"""
Tests: Relationship Extraction
================================
Verifies that relationships are created based on SEMANTIC EVIDENCE only,
not co-occurrence.

CRITICAL: Two entities appearing in the same sentence must NOT
automatically produce a relationship.
"""

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.nlp.relationship_extractor import RelationshipExtractor


RAVI = {"id": "e_ravi", "type": "PERSON", "text": "Ravi Kumar", "role": "ACCUSED",
        "confidence": 0.9, "normalized_value": "ravi kumar"}
ARUN = {"id": "e_arun", "type": "PERSON", "text": "Arun Singh", "role": "UNKNOWN",
        "confidence": 0.85, "normalized_value": "arun singh"}
CASE_101 = {"id": "e_case", "type": "CASE", "text": "FIR No. 101/2025", "role": None,
            "confidence": 0.99, "normalized_value": "FIR/101/2025"}
PHONE_1 = {"id": "e_ph", "type": "PHONE", "text": "9876543210", "role": None,
           "confidence": 0.97, "normalized_value": "+919876543210"}
VEH_1 = {"id": "e_veh", "type": "VEHICLE", "text": "DL-01-AB-1234", "role": None,
         "confidence": 0.93, "normalized_value": "DL-01-AB-1234"}
LOC_1 = {"id": "e_loc", "type": "LOCATION", "text": "Connaught Place", "role": None,
         "confidence": 0.80, "normalized_value": "connaught place"}


class TestCoOccurrenceNotRelationship:
    """
    CRITICAL: Co-occurrence alone must NOT create relationships.
    """

    def setup_method(self):
        self.extractor = RelationshipExtractor()

    def test_two_persons_in_same_sentence_no_trigger_no_relationship(self):
        """
        'Ravi Kumar and Arun Singh were both seen at the market.'
        → No trigger for any relationship type → NO relationship
        """
        text = "Ravi Kumar and Arun Singh were both seen at the market."
        entities = [RAVI, ARUN]
        relationships = self.extractor.extract_relationships(text, entities)
        assert len(relationships) == 0, \
            f"Co-occurrence alone must NOT create relationships. Got: {[r['relationship_type'] for r in relationships]}"

    def test_person_and_case_without_trigger_no_relationship(self):
        """
        Just mentioning a person and a case number together is not enough.
        """
        text = "Ravi Kumar. FIR No. 101/2025."
        entities = [RAVI, CASE_101]
        relationships = self.extractor.extract_relationships(text, entities)
        assert len(relationships) == 0, \
            "Person and case in same text without trigger must NOT create relationship"


class TestSemanticRelationships:
    """Relationships created only when semantic trigger is present."""

    def setup_method(self):
        self.extractor = RelationshipExtractor()

    def test_called_creates_contacted(self):
        text = "Ravi Kumar called Arun Singh on the night of the incident."
        entities = [RAVI, ARUN]
        relationships = self.extractor.extract_relationships(text, entities)
        contacted = [r for r in relationships if r["relationship_type"] == "CONTACTED"]
        assert len(contacted) >= 1, "CONTACTED relationship must be created when 'called' trigger present"

    def test_accused_in_creates_accused_in(self):
        text = "Ravi Kumar was arrested in FIR No. 101/2025."
        entities = [RAVI, CASE_101]
        relationships = self.extractor.extract_relationships(text, entities)
        accused = [r for r in relationships if r["relationship_type"] == "ACCUSED_IN"]
        assert len(accused) >= 1, "ACCUSED_IN must be created when 'was arrested in' trigger present"

    def test_driving_creates_drives(self):
        text = "Ravi Kumar was driving vehicle DL-01-AB-1234 at the time."
        entities = [RAVI, VEH_1]
        relationships = self.extractor.extract_relationships(text, entities)
        drives = [r for r in relationships if r["relationship_type"] == "DRIVES"]
        assert len(drives) >= 1, "DRIVES must be created when 'was driving' trigger present"

    def test_residing_at_creates_located_at(self):
        text = "Ravi Kumar is residing at Connaught Place, Delhi."
        entities = [RAVI, LOC_1]
        relationships = self.extractor.extract_relationships(text, entities)
        located = [r for r in relationships if r["relationship_type"] == "LOCATED_AT"]
        assert len(located) >= 1, "LOCATED_AT must be created when 'residing at' trigger present"

    def test_using_phone_creates_uses(self):
        text = "Ravi Kumar is using mobile number 9876543210 for communication."
        entities = [RAVI, PHONE_1]
        relationships = self.extractor.extract_relationships(text, entities)
        uses = [r for r in relationships if r["relationship_type"] == "USES"]
        assert len(uses) >= 1, "USES must be created when 'using mobile number' trigger present"


class TestRelationshipAttributes:
    """Every relationship must have required attributes."""

    def setup_method(self):
        self.extractor = RelationshipExtractor()

    def test_relationship_has_evidence_sentence(self):
        text = "Ravi Kumar called Arun Singh on 12 June 2025."
        entities = [RAVI, ARUN]
        relationships = self.extractor.extract_relationships(text, entities)
        for rel in relationships:
            assert rel.get("evidence"), "Relationship must have evidence"
            assert rel["evidence"].get("sentence"), "Evidence must contain source sentence"

    def test_relationship_has_confidence(self):
        text = "Ravi Kumar was arrested in FIR No. 101/2025."
        entities = [RAVI, CASE_101]
        relationships = self.extractor.extract_relationships(text, entities)
        for rel in relationships:
            assert "confidence" in rel
            assert 0.0 <= rel["confidence"] <= 1.0

    def test_relationship_has_status(self):
        text = "Ravi Kumar called Arun Singh."
        entities = [RAVI, ARUN]
        relationships = self.extractor.extract_relationships(text, entities)
        for rel in relationships:
            assert "status" in rel
            assert rel["status"] in (
                "CONFIRMED", "ALLEGED", "SUSPECTED", "DENIED", "NEGATED", "UNVERIFIED"
            )

    def test_relationship_has_provenance(self):
        text = "Ravi Kumar owns vehicle DL-01-AB-1234."
        entities = [RAVI, VEH_1]
        relationships = self.extractor.extract_relationships(text, entities)
        for rel in relationships:
            assert "provenance" in rel
            assert rel["provenance"].get("extraction_method")

    def test_relationship_has_verification_status(self):
        text = "Ravi Kumar called Arun Singh."
        entities = [RAVI, ARUN]
        relationships = self.extractor.extract_relationships(text, entities)
        for rel in relationships:
            assert rel.get("verification_status") == "AI_SUGGESTED"

    def test_alleged_relationship_has_status_alleged(self):
        text = "Ravi Kumar was allegedly involved in the robbery."
        case = {"id": "e_case2", "type": "CRIME_TYPE", "text": "robbery", "role": None,
                "confidence": 0.85, "normalized_value": "robbery"}
        entities = [RAVI, case]
        relationships = self.extractor.extract_relationships(text, entities)
        # Any relationship involving 'allegedly' must be ALLEGED or SUSPECTED
        for rel in relationships:
            assert rel["status"] in ("ALLEGED", "SUSPECTED", "UNVERIFIED"), \
                f"Alleged relationship should not be CONFIRMED, got {rel['status']}"
