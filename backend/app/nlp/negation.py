"""
Negation and Uncertainty Detector
==================================
Detects negation and uncertainty in sentence context around extracted triggers.

CRITICAL RULE:
  A negated statement MUST NOT be inserted as a positive graph fact.
  An uncertain/alleged statement MUST be stored with appropriate status,
  never as CONFIRMED.

Status values:
  CONFIRMED   — direct declarative, no hedging
  ALLEGED     — explicit allegation language
  SUSPECTED   — investigative suspicion
  DENIED      — explicit denial by subject
  NEGATED     — grammatical negation detected
  UNVERIFIED  — default for AI-extracted items
"""

import re
from typing import List, Dict, Any, Optional, Tuple


# ── Negation cue tokens ───────────────────────────────────────────────────────
NEGATION_CUES = {
    "not", "no", "never", "neither", "nor", "nobody", "nothing", "nowhere",
    "cannot", "can't", "couldn't", "won't", "wouldn't", "shouldn't",
    "didn't", "doesn't", "don't", "isn't", "aren't", "wasn't", "weren't",
    "hasn't", "haven't", "hadn't", "without", "lack", "lacks", "lacked",
    "deny", "denied", "denies", "denying",
    "refuse", "refused", "refutes", "refuted",
    "absent", "absence",
    "failed to", "unable to", "unrelated", "unconnected",
}

# Multi-word negation phrases (checked as substrings, case-insensitive)
NEGATION_PHRASES = [
    "did not", "does not", "do not", "was not", "were not", "has not",
    "have not", "had not", "could not", "would not", "should not",
    "is not", "are not", "will not", "cannot",
    "no evidence", "no connection", "no link", "no record",
    "not present", "not involved", "not related", "not linked",
    "not connected", "not found", "not confirmed",
    "failed to establish", "could not establish",
    "no proof", "no indication",
    "denied knowing", "denied meeting", "denied calling", "denied contact",
    "not accused", "not suspected",
]

# ── Uncertainty / Allegation markers ─────────────────────────────────────────
UNCERTAINTY_MARKERS = {
    "alleged",    "allegedly",   "allegation",
    "suspected",  "suspicion",   "suspect",
    "reportedly", "reported",    "reports",
    "believed",   "believed to", "believe",
    "possibly",   "possible",    "possibility",
    "perhaps",    "presumably",
    "claimed",    "claim",       "claims",
    "according",  "stated by",
    "unconfirmed", "unverified",
    "may",        "might",       "could",
    "appears",    "seems",       "seemingly",
    "indicated",  "suggests",    "suggested",
    "sources say", "sources claim",
    "alleged to have", "believed to have",
    "under suspicion",
}

# Stronger allegation phrases → ALLEGED
ALLEGATION_PHRASES = [
    "alleged to have", "allegedly involved", "allegedly committed",
    "allegedly transferred", "allegedly called",
    "according to", "as per informant", "as per sources",
    "informant stated", "source stated", "complainant alleged",
    "claimed to have", "reportedly involved", "reportedly called",
]

# Suspicion phrases → SUSPECTED
SUSPICION_PHRASES = [
    "suspected of", "suspected involvement", "under suspicion",
    "believed to be involved", "possibly involved", "may have",
    "might have", "could have been", "appears to have",
]

# Denial phrases → DENIED
DENIAL_PHRASES = [
    "denied", "denies", "denied knowing", "denied meeting",
    "denied having", "denied calling", "denied any connection",
    "denied involvement", "claimed innocence",
]


def _window_text(sentence: str, char_start: int, char_end: int, window: int = 80) -> str:
    """Extract text window around a trigger span."""
    left = max(0, char_start - window)
    right = min(len(sentence), char_end + window)
    return sentence[left:right]


def detect_negation(sentence: str, trigger_start: int = 0, trigger_end: int = -1) -> bool:
    """
    Returns True if the sentence contains a negation cue within the context
    window around [trigger_start, trigger_end].

    When trigger_start/end are not provided, scans the full sentence.
    """
    if trigger_end < 0:
        context = sentence
    else:
        context = _window_text(sentence, trigger_start, trigger_end, window=60)

    context_lower = context.lower()

    # Check multi-word negation phrases first
    for phrase in NEGATION_PHRASES:
        if phrase in context_lower:
            return True

    # Check individual negation tokens
    tokens = re.findall(r"\b\w+\b", context_lower)
    for token in tokens:
        if token in NEGATION_CUES:
            return True

    return False


def detect_uncertainty(sentence: str) -> Dict[str, Any]:
    """
    Returns uncertainty analysis for a sentence.

    Returns:
        {
            "is_uncertain": bool,
            "status": "CONFIRMED" | "ALLEGED" | "SUSPECTED" | "DENIED" | "UNVERIFIED",
            "markers": List[str]  # matching markers found
        }
    """
    sentence_lower = sentence.lower()
    found_markers: List[str] = []

    # Check denial first (specific)
    for phrase in DENIAL_PHRASES:
        if phrase in sentence_lower:
            found_markers.append(phrase)
            return {
                "is_uncertain": True,
                "status": "DENIED",
                "markers": found_markers,
            }

    # Check explicit allegation phrases → ALLEGED
    for phrase in ALLEGATION_PHRASES:
        if phrase in sentence_lower:
            found_markers.append(phrase)

    # Check suspicion phrases → SUSPECTED
    suspicion_found = []
    for phrase in SUSPICION_PHRASES:
        if phrase in sentence_lower:
            suspicion_found.append(phrase)

    # Check individual uncertainty markers
    tokens = re.findall(r"\b\w+\b", sentence_lower)
    for token in tokens:
        if token in UNCERTAINTY_MARKERS:
            found_markers.append(token)

    if found_markers and not suspicion_found:
        return {
            "is_uncertain": True,
            "status": "ALLEGED",
            "markers": list(set(found_markers)),
        }
    elif suspicion_found:
        all_markers = list(set(found_markers + suspicion_found))
        return {
            "is_uncertain": True,
            "status": "SUSPECTED",
            "markers": all_markers,
        }

    return {
        "is_uncertain": False,
        "status": "CONFIRMED",
        "markers": [],
    }


def analyze_sentence(sentence: str, trigger_start: int = 0, trigger_end: int = -1) -> Dict[str, Any]:
    """
    Full analysis combining negation + uncertainty.
    Returns the final relationship status to assign.

    Returns:
        {
            "negated": bool,
            "uncertain": bool,
            "status": "CONFIRMED" | "ALLEGED" | "SUSPECTED" | "DENIED" | "NEGATED" | "UNVERIFIED",
            "markers": List[str]
        }
    """
    is_negated = detect_negation(sentence, trigger_start, trigger_end)
    if is_negated:
        return {
            "negated": True,
            "is_negated": True,
            "uncertain": True,
            "status": "NEGATED",
            "markers": ["negation_detected"],
        }

    uncertainty = detect_uncertainty(sentence)
    return {
        "negated": False,
        "is_negated": False,
        "uncertain": uncertainty["is_uncertain"],
        "status": uncertainty["status"],
        "markers": uncertainty["markers"],
    }
