import io
from typing import Dict, Any
from pypdf import PdfReader
from app.nlp.pipeline import nlp_pipeline

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extracts raw text from uploaded PDF document bytes using pypdf."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"
        return extracted_text.strip()
    except Exception as e:
        raise ValueError(f"Failed to parse PDF document: {str(e)}")

def process_pdf_document(pdf_bytes: bytes, document_id: str = "UPLOADED-FIR-PDF") -> Dict[str, Any]:
    """
    Parses PDF bytes, extracts text, and runs it through Phase 3 NLP processing engine.
    """
    extracted_text = extract_text_from_pdf_bytes(pdf_bytes)
    if not extracted_text:
        return {
            "document_id": document_id,
            "status": "ERROR",
            "message": "No readable text could be extracted from the PDF document."
        }

    return nlp_pipeline.process_document(extracted_text, document_id=document_id)
