"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Direct NLP Processing & Testing Endpoint
"""
from fastapi import APIRouter
from app.nlp.pipeline import nlp_engine
from app.schemas.schemas import NLPProcessRequest, NLPProcessResponse

router = APIRouter()

@router.post("/process", response_model=NLPProcessResponse)
def process_text_nlp(payload: NLPProcessRequest):
    """Processes any raw text through the full legal NLP pipeline."""
    result = nlp_engine.process_text(payload.text, case_id=payload.case_id or "ADHOC-TEST")
    return result
