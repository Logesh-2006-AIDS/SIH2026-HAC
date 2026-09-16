"""
Tests: Entity Extraction
========================
Tests for phone, vehicle, case number, date, and person extraction.
Uses real sample Indian FIR text.
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.nlp.patterns import PatternMatcher, normalize_phone, normalize_vehicle, normalize_date
from app.nlp.ner import NamedEntityRecognizer


# ── Sample FIR text ───────────────────────────────────────────────────────────
SAMPLE_FIR_1 = """
FIR No. 101/2025
Date: 12/06/2025
Police Station: Kotwali, Delhi

Complainant: Suresh Kumar, R/o 45 Gandhi Nagar, Delhi, Ph: 9876543210

On 12 June 2025 at 10:30 PM, the complainant Suresh Kumar reported that his vehicle
DL-01-AB-1234 was stolen from near Connaught Place. The suspect was seen driving
the vehicle and was identified as Ramesh Gupta. Accused Ramesh Gupta (alias Ramu)
was later arrested from Lajpat Nagar. Phone number used: +91-98765-43210.
FIR registered under IPC Section 379 (theft of vehicle).
Case No. 45/2025.
"""

SAMPLE_FIR_2 = """
FIR No. 204/2025
Accused: Vikram Singh S/o Rajendra Singh, R/o B-12, Rohini, Delhi
Phone: 8800123456
Vehicle: HR-26-CT-1234
Bank Account: 1234567890123
IFSC: HDFC0001234
Date of incident: 15/07/2025
Time: At 2300 hours
Amount transferred: Rs. 5,00,000 (five lakh rupees)
"""


# ── Pattern Matcher Tests ─────────────────────────────────────────────────────

class TestPhoneExtraction:

    def setup_method(self):
        self.pm = PatternMatcher()

    def test_extracts_bare_10_digit_phone(self):
        entities = self.pm.extract_pattern_entities("Contact: 9876543210")
        phones = [e for e in entities if e["type"] == "PHONE"]
        assert len(phones) >= 1
        assert "9876543210" in phones[0]["text"] or "+91" in phones[0]["normalized_value"]

    def test_extracts_plus91_phone(self):
        entities = self.pm.extract_pattern_entities("Call +91-98765-43210")
        phones = [e for e in entities if e["type"] == "PHONE"]
        assert len(phones) >= 1

    def test_phone_normalization_bare(self):
        result = normalize_phone("9876543210")
        assert result == "+919876543210"

    def test_phone_normalization_with_country_code(self):
        result = normalize_phone("+91-98765-43210")
        assert result == "+919876543210"

    def test_phone_normalization_with_91_prefix(self):
        result = normalize_phone("919876543210")
        assert result == "+919876543210"

    def test_phone_in_fir_text(self):
        entities = self.pm.extract_pattern_entities(SAMPLE_FIR_1)
        phones = [e for e in entities if e["type"] == "PHONE"]
        assert len(phones) >= 1

    def test_phone_has_provenance(self):
        entities = self.pm.extract_pattern_entities("Ph: 9876543210")
        phones = [e for e in entities if e["type"] == "PHONE"]
        assert phones
        assert "provenance" in phones[0]
        assert "char_start" in phones[0]["provenance"]
        assert "char_end" in phones[0]["provenance"]

    def test_phone_has_original_and_normalized(self):
        entities = self.pm.extract_pattern_entities("Phone: +91-98765-43210")
        phones = [e for e in entities if e["type"] == "PHONE"]
        assert phones
        assert phones[0]["text"]  # original_text
        assert phones[0]["normalized_value"]  # canonical form


class TestVehicleExtraction:

    def setup_method(self):
        self.pm = PatternMatcher()

    def test_extracts_vehicle_with_hyphens(self):
        entities = self.pm.extract_pattern_entities("Vehicle DL-01-AB-1234 was stolen")
        vehicles = [e for e in entities if e["type"] == "VEHICLE"]
        assert len(vehicles) >= 1

    def test_extracts_vehicle_without_hyphens(self):
        entities = self.pm.extract_pattern_entities("Vehicle HR26CT1234 found")
        vehicles = [e for e in entities if e["type"] == "VEHICLE"]
        assert len(vehicles) >= 1

    def test_vehicle_normalization(self):
        result = normalize_vehicle("DL 01 AB 1234")
        assert "DL" in result
        assert "01" in result

    def test_vehicle_in_fir_text(self):
        entities = self.pm.extract_pattern_entities(SAMPLE_FIR_1)
        vehicles = [e for e in entities if e["type"] == "VEHICLE"]
        assert len(vehicles) >= 1


class TestCaseNumberExtraction:

    def setup_method(self):
        self.pm = PatternMatcher()

    def test_extracts_fir_number(self):
        entities = self.pm.extract_pattern_entities("FIR No. 101/2025 was registered")
        cases = [e for e in entities if e["type"] == "CASE"]
        assert len(cases) >= 1

    def test_extracts_case_number(self):
        entities = self.pm.extract_pattern_entities("Case No. 45/2025")
        cases = [e for e in entities if e["type"] == "CASE"]
        assert len(cases) >= 1

    def test_extracts_cr_number(self):
        entities = self.pm.extract_pattern_entities("CR No. 22/2024 was filed")
        cases = [e for e in entities if e["type"] == "CASE"]
        assert len(cases) >= 1


class TestDateExtraction:

    def setup_method(self):
        self.pm = PatternMatcher()

    def test_extracts_dd_mm_yyyy(self):
        entities = self.pm.extract_pattern_entities("Incident on 12/06/2025")
        dates = [e for e in entities if e["type"] == "DATE"]
        assert len(dates) >= 1

    def test_extracts_written_date(self):
        entities = self.pm.extract_pattern_entities("On 12 June 2025 at 10 PM")
        dates = [e for e in entities if e["type"] == "DATE"]
        assert len(dates) >= 1

    def test_date_normalized_to_iso(self):
        result = normalize_date("12/06/2025")
        assert result == "2025-06-12"

    def test_date_iso_format_preserved(self):
        result = normalize_date("2025-06-12")
        assert result == "2025-06-12"

    def test_written_date_normalized(self):
        result = normalize_date("12 June 2025")
        assert result == "2025-06-12"


class TestPersonExtraction:

    def setup_method(self):
        self.ner = NamedEntityRecognizer()

    def test_extracts_persons(self):
        entities = self.ner.extract_entities(SAMPLE_FIR_1)
        persons = [e for e in entities if e["type"] == "PERSON"]
        assert len(persons) >= 1

    def test_person_has_role(self):
        entities = self.ner.extract_entities(SAMPLE_FIR_1)
        persons = [e for e in entities if e["type"] == "PERSON"]
        for person in persons:
            assert "role" in person
            assert person["role"] is not None

    def test_person_has_provenance(self):
        entities = self.ner.extract_entities(SAMPLE_FIR_1)
        persons = [e for e in entities if e["type"] == "PERSON"]
        for person in persons:
            assert "provenance" in person
            assert person["provenance"].get("sentence"), "Person must have source sentence"

    def test_person_has_confidence(self):
        entities = self.ner.extract_entities(SAMPLE_FIR_1)
        persons = [e for e in entities if e["type"] == "PERSON"]
        for person in persons:
            assert "confidence" in person
            assert 0.0 <= person["confidence"] <= 1.0

    def test_entity_has_verification_status(self):
        entities = self.ner.extract_entities(SAMPLE_FIR_1)
        for entity in entities:
            assert entity.get("verification_status") == "AI_SUGGESTED"

    def test_son_of_pattern(self):
        """Test extraction from 'Vikram Singh S/o Rajendra Singh'"""
        entities = self.ner.extract_entities(SAMPLE_FIR_2)
        persons = [e for e in entities if e["type"] == "PERSON"]
        person_texts = [p["text"].lower() for p in persons]
        # Both names should be extracted
        assert any("vikram" in t for t in person_texts), f"Vikram not found in: {person_texts}"
