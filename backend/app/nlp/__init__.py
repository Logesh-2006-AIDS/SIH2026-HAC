"""
================================================================================
SIH 2026 — HOUSE TARGARYEN
AI-Powered Criminal Network Intelligence Platform
================================================================================
Module: NLP Document Intelligence Pipeline (v2)

Pipeline:
  DOCUMENT → SENTENCE → ENTITY → ROLE → RELATIONSHIP → CONTEXT
  → TEMPORAL → CONFIDENCE → PROVENANCE → VALIDATION → STAGING
  → GRAPH → INVESTIGATOR VERIFICATION

Core Principle:
  AI EXTRACTS FACTS.          (NLP pipeline)
  GRAPH ANALYTICS FINDS PATTERNS.   (Memgraph)
  AI SUGGESTS LEADS.          (analyst_intelligence.py)
  INVESTIGATOR VERIFIES THEM. (leads API)

New in v2:
  - Hybrid NER: spaCy + Indian domain heuristics
  - Person role classification: ACCUSED / VICTIM / WITNESS / COMPLAINANT /
    OFFICER / INVESTIGATOR / INFORMANT / UNKNOWN
  - Semantic relationship extraction (trigger-based, not co-occurrence)
  - Negation detection: "did not contact" → no CONTACTED edge
  - Uncertainty detection: "allegedly" → status=ALLEGED
  - Entity resolution: multi-signal, no auto-merge
  - Temporal extraction: event dates per relationship
  - Coreference resolution: "the accused", "the victim"
  - Pre-graph validation
  - Staging model: all AI extractions → AI_SUGGESTED
================================================================================
"""

__version__ = "2.0.0"
