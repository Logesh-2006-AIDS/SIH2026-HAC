from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
from app.nlp.pipeline import nlp_pipeline
from app.nlp.pdf_parser import process_pdf_document

router = APIRouter()

@router.post("/process-text", response_model=Dict[str, Any])
async def process_raw_text_fir(payload: Dict[str, Any]):
    """
    Pass raw police FIR / CDR text to Phase 3 NLP Engine.
    Extracts entities, relationships, aliases & explainable rationales.
    """
    raw_text = payload.get("text", "")
    document_id = payload.get("document_id", "DOC-RAW-01")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Text field cannot be empty.")

    try:
        result = nlp_pipeline.process_document(raw_text, document_id=document_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NLP Processing Error: {str(e)}")

@router.post("/process-pdf", response_model=Dict[str, Any])
async def process_pdf_fir(file: UploadFile = File(...)):
    """
    Upload a PDF FIR / Police Report document.
    Extracts text from PDF pages and runs Phase 3 NLP model predictions.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        pdf_bytes = await file.read()
        result = process_pdf_document(pdf_bytes, document_id=file.filename)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Parsing & NLP Error: {str(e)}")
