"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
FIR Case Ingestion & Case Management API Endpoints
"""
import os
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import CaseFile, ExtractedEntityRecord, ExtractedRelationRecord, User
from app.api.v1.auth import get_current_user
from app.services.ingestion import ingestion_service
from app.schemas.schemas import CaseFileResponse

router = APIRouter()

@router.post("/upload")
async def upload_fir_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(""),
    fir_number: Optional[str] = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads an FIR document (PDF, TXT, CSV), saves it locally with SHA-256 hash,
    runs the NLP extraction engine, saves metadata to DB, and updates Neo4j.
    """
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    result = ingestion_service.process_and_save_fir(
        db=db,
        filename=file.filename,
        file_bytes=file_bytes,
        uploaded_by=current_user.username,
        fir_number=fir_number,
        title=title
    )
    return result

@router.get("/", response_model=List[CaseFileResponse])
def list_cases(db: Session = Depends(get_db)):
    """Lists all processed FIR cases."""
    cases = db.query(CaseFile).order_by(CaseFile.created_at.desc()).all()
    results = []
    for c in cases:
        results.append({
            "id": c.id,
            "case_id": c.case_id,
            "title": c.title,
            "fir_number": c.fir_number,
            "police_station": c.police_station,
            "state": c.state,
            "original_filename": c.original_filename,
            "file_path": c.file_path,
            "file_hash_sha256": c.file_hash_sha256,
            "file_size_bytes": c.file_size_bytes,
            "status": c.status,
            "uploaded_by": c.uploaded_by,
            "created_at": c.created_at,
            "entities_count": len(c.entities),
            "relationships_count": len(c.relationships)
        })
    return results

@router.get("/{case_id}")
def get_case_details(case_id: str, db: Session = Depends(get_db)):
    """Retrieves full case details including raw text, entities, and relations."""
    case = db.query(CaseFile).filter(CaseFile.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    entities = [
        {"text": e.text, "normalized": e.normalized, "label": e.label, "confidence": e.confidence, "extractor": e.extractor}
        for e in case.entities
    ]
    relationships = [
        {"source": r.source, "source_type": r.source_type, "relation": r.relation, "target": r.target, "target_type": r.target_type, "confidence": r.confidence, "evidence": r.evidence_sentence}
        for r in case.relationships
    ]

    return {
        "case_id": case.case_id,
        "title": case.title,
        "fir_number": case.fir_number,
        "police_station": case.police_station,
        "original_filename": case.original_filename,
        "file_hash_sha256": case.file_hash_sha256,
        "raw_text": case.raw_text,
        "summary": json.loads(case.summary_text) if case.summary_text else {},
        "created_at": case.created_at,
        "entities": entities,
        "relationships": relationships
    }

@router.get("/{case_id}/download")
def download_case_file(case_id: str, db: Session = Depends(get_db)):
    """Downloads the local copy of the raw FIR file."""
    case = db.query(CaseFile).filter(CaseFile.case_id == case_id).first()
    if not case or not os.path.exists(case.file_path):
        raise HTTPException(status_code=404, detail="File not found on local disk")

    return FileResponse(
        path=case.file_path,
        filename=case.original_filename,
        media_type="application/octet-stream"
    )
