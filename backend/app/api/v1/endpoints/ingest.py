"""
Phase 2 Ingestion API Endpoints
================================
POST /api/v1/ingest/file         — Upload and ingest a single file
POST /api/v1/ingest/text         — Ingest plain text content directly
GET  /api/v1/ingest/sources      — List all ingested data sources
GET  /api/v1/ingest/sources/{id} — Get a specific ingestion record & entity counts
GET  /api/v1/ingest/entities     — List extracted raw entities with optional filters
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.models.ingestion import DataSource, DataSourceType, IngestStatus, RawEntity
from app.models.user import User, UserRole
from app.schemas.common import ResponseEnvelope
from app.services.ingestion import detect_source_type, ingest_document
from app.api.deps import require_role, log_audit_action

router = APIRouter()
logger = logging.getLogger(__name__)

_ingest_write = require_role(UserRole.INVESTIGATOR, UserRole.ADMIN)
_any_officer = require_role(UserRole.INVESTIGATOR, UserRole.ANALYST, UserRole.ADMIN)

# Source types that require legal authorization_reference
_SENSITIVE_SOURCES = {DataSourceType.CDR, DataSourceType.FINANCIAL}


# ── Request / Response Schemas ────────────────────────────────────────────────

class TextIngestRequest(BaseModel):
    filename: str
    content: str
    source_type: Optional[DataSourceType] = None
    case_id: Optional[str] = None
    authorization_reference: Optional[str] = None


class DataSourceOut(BaseModel):
    id: int
    filename: str
    source_type: str
    status: str
    row_count: Optional[int]
    case_id_ref: Optional[str]
    entities_count: Optional[int] = None

    class Config:
        from_attributes = True


class RawEntityOut(BaseModel):
    id: int
    entity_type: str
    raw_text: str
    normalized: Optional[str]
    confidence: float
    source_case_id: Optional[str]
    is_resolved: bool

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/file",
    response_model=ResponseEnvelope,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and ingest a file (FIR .txt, CDR .csv, Financial .csv, Intelligence .json)",
)
async def ingest_file(
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(None),
    source_type: Optional[DataSourceType] = Form(None),
    authorization_reference: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(_ingest_write),
):
    # Determine effective source type for authorization check
    effective_type = source_type or detect_source_type(file.filename or "upload")

    # Require authorization_reference for CDR and FINANCIAL data
    if effective_type in _SENSITIVE_SOURCES:
        if not authorization_reference or not authorization_reference.strip():
            raise HTTPException(
                status_code=422,
                detail=f"authorization_reference is required for {effective_type.value} data "
                       f"(provide court order number, authority, and date).",
            )

    content_bytes = await file.read()
    if file.filename and file.filename.lower().endswith(".pdf"):
        from app.nlp.pdf_parser import extract_text_from_pdf_bytes
        try:
            content = extract_text_from_pdf_bytes(content_bytes)
        except Exception as e:
            logger.exception(f"Failed to parse PDF: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    else:
        try:
            content = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File must be UTF-8 encoded text or a valid PDF.")

    try:
        result = ingest_document(
            db=db,
            filename=file.filename or "upload",
            content=content,
            source_type=source_type,
            case_id=case_id,
            file_size=len(content_bytes),
            user_id=current_user.id if current_user else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception(f"Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

    # Store authorization_reference on the DataSource record
    if authorization_reference and result.get("data_source_id"):
        ds = db.query(DataSource).filter(DataSource.id == result["data_source_id"]).first()
        if ds:
            ds.authorization_reference = authorization_reference.strip()
            db.commit()

    # Log custody event for the upload
    try:
        from app.services.integrity import log_custody_event
        if result.get("data_source_id"):
            log_custody_event(
                db=db,
                data_source_id=result["data_source_id"],
                action="UPLOAD",
                user_id=current_user.id if current_user else None,
                details={"filename": file.filename, "file_size": len(content_bytes)},
            )
    except Exception:
        pass  # Custody logging failure should not block ingestion

    log_audit_action(
        db=db,
        action="INGEST_FILE",
        resource_type="DATA_SOURCE",
        resource_id=str(result.get("data_source_id")),
        user_id=current_user.id if current_user else None,
        details={"filename": file.filename},
    )

    return ResponseEnvelope(
        success=True,
        message=f"File '{file.filename}' ingested successfully.",
        data=result,
    )


@router.post(
    "/text",
    response_model=ResponseEnvelope,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest plain text content directly",
)
def ingest_text(
    payload: TextIngestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_ingest_write),
):
    effective_type = payload.source_type or detect_source_type(payload.filename)

    # Require authorization_reference for CDR and FINANCIAL data
    if effective_type in _SENSITIVE_SOURCES:
        if not payload.authorization_reference or not payload.authorization_reference.strip():
            raise HTTPException(
                status_code=422,
                detail=f"authorization_reference is required for {effective_type.value} data "
                       f"(provide court order number, authority, and date).",
            )

    try:
        result = ingest_document(
            db=db,
            filename=payload.filename,
            content=payload.content,
            source_type=payload.source_type,
            case_id=payload.case_id,
            user_id=current_user.id if current_user else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception(f"Text ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

    # Store authorization_reference
    if payload.authorization_reference and result.get("data_source_id"):
        ds = db.query(DataSource).filter(DataSource.id == result["data_source_id"]).first()
        if ds:
            ds.authorization_reference = payload.authorization_reference.strip()
            db.commit()

    return ResponseEnvelope(
        success=True,
        message="Text content ingested successfully.",
        data=result,
    )


@router.get(
    "/sources",
    response_model=ResponseEnvelope,
    summary="List all ingested data sources",
)
def list_sources(
    source_type: Optional[DataSourceType] = Query(None),
    status_filter: Optional[IngestStatus] = Query(None, alias="status"),
    case_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(_any_officer),
):
    q = db.query(DataSource)
    if source_type:
        q = q.filter(DataSource.source_type == source_type)
    if status_filter:
        q = q.filter(DataSource.status == status_filter)
    if case_id:
        q = q.filter(DataSource.case_id_ref == case_id)

    total = q.count()
    sources = q.order_by(DataSource.ingested_at.desc()).offset(offset).limit(limit).all()

    out = []
    for ds in sources:
        entity_count = db.query(func.count(RawEntity.id)).filter(
            RawEntity.data_source_id == ds.id
        ).scalar()
        out.append(DataSourceOut(
            id=ds.id,
            filename=ds.filename,
            source_type=ds.source_type.value,
            status=ds.status.value,
            row_count=ds.row_count,
            case_id_ref=ds.case_id_ref,
            entities_count=entity_count,
        ))

    return ResponseEnvelope(
        success=True,
        message=f"Found {total} data source(s).",
        data={"total": total, "items": [s.model_dump() for s in out]},
    )


@router.get(
    "/sources/{source_id}",
    response_model=ResponseEnvelope,
    summary="Get details for a specific data source",
)
def get_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_any_officer),
):
    ds = db.query(DataSource).filter(DataSource.id == source_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found.")

    entity_count = db.query(func.count(RawEntity.id)).filter(
        RawEntity.data_source_id == source_id
    ).scalar()

    # Log custody VIEW event
    try:
        from app.services.integrity import log_custody_event
        log_custody_event(
            db=db,
            data_source_id=source_id,
            action="VIEW",
            user_id=current_user.id if current_user else None,
        )
    except Exception:
        pass

    return ResponseEnvelope(
        success=True,
        message="Data source retrieved.",
        data={
            "id": ds.id,
            "filename": ds.filename,
            "source_type": ds.source_type.value,
            "status": ds.status.value,
            "row_count": ds.row_count,
            "case_id_ref": ds.case_id_ref,
            "file_size_bytes": ds.file_size_bytes,
            "content_hash": ds.content_hash,
            "ingested_at": ds.ingested_at.isoformat() if ds.ingested_at else None,
            "error_log": ds.error_log,
            "entities_extracted": entity_count,
            "authorization_reference": ds.authorization_reference,
        },
    )


@router.get(
    "/entities",
    response_model=ResponseEnvelope,
    summary="List raw extracted entities with optional filters",
)
def list_entities(
    entity_type: Optional[str] = Query(None),
    source_case_id: Optional[str] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(_any_officer),
):
    q = db.query(RawEntity)
    if entity_type:
        q = q.filter(RawEntity.entity_type == entity_type.upper())
    if source_case_id:
        q = q.filter(RawEntity.source_case_id == source_case_id)
    if is_resolved is not None:
        q = q.filter(RawEntity.is_resolved == is_resolved)

    total = q.count()
    entities = q.offset(offset).limit(limit).all()
    return ResponseEnvelope(
        success=True,
        message=f"Found {total} raw entity record(s).",
        data={
            "total": total,
            "items": [
                {
                    "id": e.id,
                    "entity_type": e.entity_type,
                    "raw_text": e.raw_text,
                    "normalized": e.normalized,
                    "confidence": e.confidence,
                    "source_case_id": e.source_case_id,
                    "is_resolved": e.is_resolved,
                }
                for e in entities
            ],
        },
    )
