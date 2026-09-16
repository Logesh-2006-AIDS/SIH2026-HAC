"""
Temporal Information Extractor
================================
Extracts WHEN an event happened from a sentence.

CRITICAL RULE:
  Do NOT assume the document date is the event date.
  Only store a date when it is explicitly stated in the sentence.

Output format per sentence:
  {
    "event_date": "YYYY-MM-DD" | None,
    "start_date": "YYYY-MM-DD" | None,
    "end_date":   "YYYY-MM-DD" | None,
    "time":       "HH:MM" | None,
    "relative_time": str | None,
    "source_text": str  # the matched text fragment
  }
"""

import re
from typing import Optional, Dict, Any, List
from dateutil import parser as dateutil_parser
from dateutil.parser import ParserError


# ── Month name mappings ───────────────────────────────────────────────────────
_MONTHS_EN = (
    "january|february|march|april|may|june|july|august|september|"
    "october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec"
)

# ── Date Patterns ─────────────────────────────────────────────────────────────
_DATE_PATTERNS: List[re.Pattern] = [
    # DD/MM/YYYY or DD-MM-YYYY
    re.compile(r"\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})\b"),
    # YYYY-MM-DD (ISO)
    re.compile(r"\b(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})\b"),
    # DD Month YYYY  e.g. "12 June 2025", "3rd March 2024"
    re.compile(
        r"\b(\d{1,2})(?:st|nd|rd|th)?\s+(" + _MONTHS_EN + r")\s+(\d{4})\b",
        re.IGNORECASE,
    ),
    # Month DD, YYYY  e.g. "June 12, 2025"
    re.compile(
        r"\b(" + _MONTHS_EN + r")\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b",
        re.IGNORECASE,
    ),
    # DD.MM.YYYY
    re.compile(r"\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b"),
]

# ── Time Patterns ─────────────────────────────────────────────────────────────
_TIME_PATTERNS: List[re.Pattern] = [
    # HH:MM AM/PM
    re.compile(r"\b(\d{1,2}):(\d{2})\s*([AaPp][Mm])\b"),
    # HH:MM (24h)
    re.compile(r"\b([01]?\d|2[0-3]):([0-5]\d)\b"),
    # H AM/PM without colon
    re.compile(r"\b(\d{1,2})\s*([AaPp][Mm])\b"),
    # Indian police report: "at 2230 hours", "at 1430 hrs"
    re.compile(r"\bat\s+(\d{3,4})\s*(?:hrs?|hours?)\b", re.IGNORECASE),
]

# ── Relative time phrases ─────────────────────────────────────────────────────
_RELATIVE_PATTERNS: List[re.Pattern] = [
    re.compile(
        r"\b(yesterday|today|the\s+previous\s+(?:day|night)|the\s+following\s+day|"
        r"last\s+(?:night|week|month|year)|the\s+night\s+of|"
        r"(?:in\s+the\s+)?(?:early\s+)?(?:morning|afternoon|evening|night)\s+of|"
        r"around\s+midnight|in\s+the\s+early\s+hours|at\s+dawn)\b",
        re.IGNORECASE,
    ),
    # "on the evening of DD Month"
    re.compile(
        r"\bon\s+the\s+(?:morning|afternoon|evening|night)\s+of\s+(?:\d{1,2}\s+)?" +
        r"(?:" + _MONTHS_EN + r")\b",
        re.IGNORECASE,
    ),
    # "between X and Y" date ranges
    re.compile(
        r"\bbetween\s+\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}\s+and\s+\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}\b",
        re.IGNORECASE,
    ),
]


def _try_parse_date(text: str) -> Optional[str]:
    """Attempt to parse a date string to ISO format YYYY-MM-DD. Returns None on failure."""
    try:
        # Use dateutil with dayfirst=True for Indian date formats
        dt = dateutil_parser.parse(text, dayfirst=True, fuzzy=True)
        return dt.strftime("%Y-%m-%d")
    except (ParserError, OverflowError, ValueError):
        return None


def _parse_24h_time(hour_str: str, minute_str: str = "00") -> Optional[str]:
    """Format to HH:MM 24h."""
    try:
        h = int(hour_str)
        m = int(minute_str)
        if 0 <= h <= 23 and 0 <= m <= 59:
            return f"{h:02d}:{m:02d}"
    except ValueError:
        pass
    return None


def extract_dates_from_sentence(sentence: str) -> List[Dict[str, Any]]:
    """
    Extract all date mentions from a sentence.
    Returns list of {text, iso_date, char_start, char_end}.
    """
    results = []
    seen_spans: set = set()

    for pattern in _DATE_PATTERNS:
        for match in pattern.finditer(sentence):
            span = (match.start(), match.end())
            if span in seen_spans:
                continue
            seen_spans.add(span)
            raw_text = match.group(0)
            iso = _try_parse_date(raw_text)
            if iso:
                results.append({
                    "text": raw_text,
                    "iso_date": iso,
                    "char_start": match.start(),
                    "char_end": match.end(),
                })

    return results


def extract_times_from_sentence(sentence: str) -> List[Dict[str, Any]]:
    """Extract time mentions from a sentence."""
    results = []
    seen_spans: set = set()

    for pattern in _TIME_PATTERNS:
        for match in pattern.finditer(sentence):
            span = (match.start(), match.end())
            if span in seen_spans:
                continue
            seen_spans.add(span)
            raw_text = match.group(0)

            # Try to normalize to HH:MM
            normalized = None
            groups = match.groups()
            if len(groups) >= 3 and groups[2] and groups[2].lower() in ("am", "pm"):
                # H:MM AM/PM
                h = int(groups[0])
                m = int(groups[1]) if len(groups) > 1 and groups[1] else 0
                if groups[2].lower() == "pm" and h != 12:
                    h += 12
                elif groups[2].lower() == "am" and h == 12:
                    h = 0
                normalized = _parse_24h_time(str(h), str(m))
            elif "hrs" in raw_text.lower() or "hours" in raw_text.lower():
                # "at 2230 hrs"
                digits = re.search(r"\d{3,4}", raw_text)
                if digits:
                    val = digits.group(0)
                    if len(val) == 3:
                        val = "0" + val
                    normalized = _parse_24h_time(val[:2], val[2:])
            else:
                # HH:MM 24h
                if len(groups) >= 2:
                    normalized = _parse_24h_time(groups[0], groups[1])

            results.append({
                "text": raw_text,
                "normalized_time": normalized,
                "char_start": match.start(),
                "char_end": match.end(),
            })

    return results


def extract_relative_time(sentence: str) -> Optional[str]:
    """Extract relative temporal expressions."""
    for pattern in _RELATIVE_PATTERNS:
        match = pattern.search(sentence)
        if match:
            return match.group(0).strip()
    return None


def extract_temporal_info(sentence: str) -> Dict[str, Any]:
    """
    Main extractor: returns temporal information found in a single sentence.

    Returns:
        {
            "has_temporal": bool,
            "event_date": str | None,   # ISO YYYY-MM-DD
            "start_date": str | None,
            "end_date": str | None,
            "time": str | None,         # HH:MM
            "relative_time": str | None,
            "source_text": str          # matched text(s)
        }
    """
    dates = extract_dates_from_sentence(sentence)
    times = extract_times_from_sentence(sentence)
    relative = extract_relative_time(sentence)

    source_texts = [d["text"] for d in dates] + [t["text"] for t in times]
    if relative:
        source_texts.append(relative)

    if not dates and not times and not relative:
        return {
            "has_temporal": False,
            "event_date": None,
            "start_date": None,
            "end_date": None,
            "time": None,
            "relative_time": None,
            "source_text": "",
        }

    # Determine event date / date range
    event_date = None
    start_date = None
    end_date = None

    if len(dates) == 1:
        event_date = dates[0]["iso_date"]
    elif len(dates) >= 2:
        # Assume first = start, second = end
        start_date = dates[0]["iso_date"]
        end_date = dates[1]["iso_date"]

    time_val = times[0]["normalized_time"] if times else None

    return {
        "has_temporal": True,
        "event_date": event_date,
        "start_date": start_date,
        "end_date": end_date,
        "time": time_val,
        "relative_time": relative,
        "source_text": "; ".join(source_texts),
    }
