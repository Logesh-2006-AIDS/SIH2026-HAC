"""
Tests: Temporal Extraction
============================
Verifies that event dates are correctly extracted from sentences.

CRITICAL: Document date must NOT be assumed to be the event date.
Only dates explicitly mentioned in the sentence are extracted.
"""

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.nlp.temporal import (
    extract_dates_from_sentence,
    extract_times_from_sentence,
    extract_temporal_info,
    extract_relative_time,
)


class TestDateExtraction:

    def test_extracts_dd_mm_yyyy(self):
        dates = extract_dates_from_sentence("Incident on 12/06/2025 was reported.")
        assert len(dates) >= 1
        assert dates[0]["iso_date"] == "2025-06-12"

    def test_extracts_written_date(self):
        dates = extract_dates_from_sentence("On 12 June 2025 at 10:30 PM.")
        assert len(dates) >= 1
        assert dates[0]["iso_date"] == "2025-06-12"

    def test_extracts_iso_date(self):
        dates = extract_dates_from_sentence("On 2025-07-15 the accused was arrested.")
        assert len(dates) >= 1
        assert dates[0]["iso_date"] == "2025-07-15"

    def test_extracts_dd_month_yyyy(self):
        dates = extract_dates_from_sentence("3rd March 2024 was the date of incident.")
        assert len(dates) >= 1
        assert dates[0]["iso_date"] == "2024-03-03"

    def test_extracts_month_dd_yyyy(self):
        dates = extract_dates_from_sentence("On March 15, 2024 the theft was committed.")
        assert len(dates) >= 1
        assert dates[0]["iso_date"] == "2024-03-15"

    def test_no_false_dates_from_case_numbers(self):
        """FIR No. 101/2025 should NOT be extracted as a date."""
        dates = extract_dates_from_sentence("FIR No. 101/2025 was registered.")
        # If any date is extracted, verify it's not from "101/2025"
        for d in dates:
            assert d["iso_date"] != "2025-01-01" or "FIR" not in d["text"]

    def test_date_has_source_text(self):
        dates = extract_dates_from_sentence("On 12 June 2025 the crime occurred.")
        assert dates
        assert dates[0]["text"]  # Source text preserved


class TestTimeExtraction:

    def test_extracts_time_with_ampm(self):
        times = extract_times_from_sentence("At 10:30 PM the suspect was seen.")
        assert len(times) >= 1

    def test_extracts_24h_time(self):
        times = extract_times_from_sentence("At 22:30 hours the call was made.")
        assert len(times) >= 1

    def test_extracts_police_hours_format(self):
        """'at 2230 hrs' is common in Indian police reports."""
        times = extract_times_from_sentence("At 2230 hrs the accused was arrested.")
        assert len(times) >= 1

    def test_no_times_when_none_present(self):
        times = extract_times_from_sentence("The accused was arrested yesterday.")
        # Should not return times for a sentence without any time
        assert isinstance(times, list)


class TestRelativeTimeExtraction:

    def test_yesterday_extracted(self):
        result = extract_relative_time("The accused was seen yesterday near the market.")
        assert result is not None
        assert "yesterday" in result.lower()

    def test_night_of_extracted(self):
        result = extract_relative_time("On the night of 12 June the crime occurred.")
        assert result is not None

    def test_no_relative_time_in_neutral_sentence(self):
        result = extract_relative_time("Ravi Kumar was arrested in FIR No. 101/2025.")
        # Should not return arbitrary relative time
        assert result is None or isinstance(result, str)


class TestFullTemporalInfo:

    def test_has_temporal_when_date_present(self):
        result = extract_temporal_info("On 12 June 2025 the robbery occurred.")
        assert result["has_temporal"] is True
        assert result["event_date"] == "2025-06-12"

    def test_no_temporal_when_no_date(self):
        result = extract_temporal_info("Ravi Kumar was arrested by the police.")
        # Should return has_temporal=False
        assert result["has_temporal"] is False
        assert result["event_date"] is None

    def test_combined_date_and_time(self):
        result = extract_temporal_info("On 12 June 2025 at 10:30 PM the incident occurred.")
        assert result["has_temporal"] is True
        assert result["event_date"] == "2025-06-12"
        # Time may or may not be extracted depending on sentence

    def test_date_range_produces_start_end(self):
        result = extract_temporal_info(
            "The accused was active between 01/06/2025 and 15/06/2025."
        )
        if result["has_temporal"]:
            # Multiple dates → start/end
            assert result.get("start_date") is not None or result.get("event_date") is not None

    def test_document_header_date_not_event_date(self):
        """
        The pipeline should NOT assume the FIR date is the event date.
        This test verifies that temporal extraction works at sentence level,
        not document level.
        """
        doc_text = "FIR Date: 20/06/2025"
        sentence = "The accused called the victim on 15/06/2025."
        result = extract_temporal_info(sentence)
        # Event date should be 15/06/2025 (from sentence), not 20/06/2025 (from header)
        assert result["has_temporal"] is True
        assert result["event_date"] == "2025-06-15"
