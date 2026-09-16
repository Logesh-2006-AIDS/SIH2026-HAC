"""Admin-only operational APIs backed by the existing platform stores."""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import log_audit_action, require_role
from app.api.v1.endpoints.cases import CASE_METADATA
from app.core.security import get_password_hash
from app.db.neo4j_client import MemgraphClient
from app.db.postgres import get_db
from app.models.audit import AuditLog
from app.models.ingestion import DataSource, DataSourceType, IngestStatus, RawEntity
from app.models.user import User, UserRole
from app.schemas.common import ResponseEnvelope
from app.services import graph_analytics
from app.services.ingestion import ingest_document

router = APIRouter()
admin_required = require_role(UserRole.ADMIN)


class AdminUserCreate(BaseModel):
    email: str
    badge_number: str
    full_name: str
    password: str = Field(min_length=8)
    department: Optional[str] = "Crime Branch"
    role: UserRole = UserRole.INVESTIGATOR


class AdminUserUpdate(BaseModel):
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


def _iso(value):
    return value.isoformat() if value else None


def _graph_status():
    """Return live Memgraph counts, or explicitly labelled fallback graph counts."""
    if MemgraphClient.verify_connectivity():
        try:
            nodes = MemgraphClient.run_query("MATCH (n) RETURN count(n) AS count")
            relationships = MemgraphClient.run_query("MATCH ()-[r]->() RETURN count(r) AS count")
            now = datetime.now(timezone.utc).isoformat()
            return {
                "status": "UP",
                "data_mode": "LIVE",
                "node_count": (nodes[0].get("count") if nodes else 0),
                "relationship_count": (relationships[0].get("count") if relationships else 0),
                "last_successful_query": now,
                "last_synchronization": "Not available",
                "import_status": "Not available",
            }
        except Exception:
            # Connectivity can change after the probe. Do not report stale live state.
            pass

    fallback = graph_analytics.get_subgraph()
    return {
        "status": "OFFLINE",
        "data_mode": "DEMO / FALLBACK",
        "node_count": len(fallback.get("nodes", [])),
        "relationship_count": len(fallback.get("edges", [])),
        "last_successful_query": "Not available",
        "last_synchronization": "Not available",
        "import_status": "Fallback graph in use — no live Memgraph import status.",
    }


@router.get("/overview", response_model=ResponseEnvelope, summary="Admin operational overview")
def overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    role_counts = {
        role.value: db.query(func.count(User.id)).filter(User.role == role).scalar() or 0
        for role in UserRole
    }
    source_count = db.query(func.count(DataSource.id)).scalar() or 0
    raw_entity_count = db.query(func.count(RawEntity.id)).scalar() or 0
    pending_jobs = db.query(func.count(DataSource.id)).filter(
        DataSource.status.in_([IngestStatus.PENDING, IngestStatus.PROCESSING])
    ).scalar() or 0
    failed_documents = db.query(func.count(DataSource.id)).filter(DataSource.status == IngestStatus.FAILED).scalar() or 0
    completed_documents = db.query(func.count(DataSource.id)).filter(DataSource.status == IngestStatus.COMPLETED).scalar() or 0
    confidence = db.query(func.avg(RawEntity.confidence)).scalar()
    graph = _graph_status()

    return ResponseEnvelope(
        success=True,
        message="Admin operational overview retrieved.",
        data={
            "data_mode": graph["data_mode"],
            "users": {"total": total_users, "by_role": role_counts},
            "cases": {"active": sum(1 for case in CASE_METADATA if case.get("status") not in {"CLOSED", "RESOLVED"})},
            "records": {"imports": source_count, "raw_entities": raw_entity_count},
            "jobs": {"pending": pending_jobs, "failed": failed_documents},
            "graph": graph,
            "nlp": {
                "documents_processed": completed_documents,
                "pending_documents": pending_jobs,
                "failed_documents": failed_documents,
                "entities_extracted": raw_entity_count,
                "relationships_extracted": "Not available",
                "average_entity_confidence": round(float(confidence), 3) if confidence is not None else "Not available",
            },
        },
    )


@router.get("/users", response_model=ResponseEnvelope, summary="Admin user directory")
def list_users(
    query: Optional[str] = Query(None),
    role: Optional[UserRole] = Query(None),
    active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    users_query = db.query(User)
    if query:
        needle = f"%{query.strip()}%"
        users_query = users_query.filter(
            (User.full_name.ilike(needle)) | (User.email.ilike(needle)) | (User.badge_number.ilike(needle))
        )
    if role:
        users_query = users_query.filter(User.role == role)
    if active is not None:
        users_query = users_query.filter(User.is_active == active)

    users = users_query.order_by(User.full_name.asc()).all()
    items = []
    for user in users:
        last_activity = db.query(func.max(AuditLog.timestamp)).filter(AuditLog.user_id == user.id).scalar()
        items.append({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "badge_number": user.badge_number,
            "department": user.department,
            "role": user.role.value,
            "is_active": user.is_active,
            "last_activity": _iso(last_activity),
        })
    return ResponseEnvelope(success=True, message="User directory retrieved.", data={"total": len(items), "items": items})


@router.post("/users", response_model=ResponseEnvelope, status_code=status.HTTP_201_CREATED, summary="Create user")
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    exists = db.query(User).filter(
        (User.email == payload.email) | (User.badge_number == payload.badge_number)
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="A user with this email or badge already exists.")
    user = User(
        email=payload.email,
        badge_number=payload.badge_number,
        full_name=payload.full_name,
        department=payload.department,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_audit_action(db, "ADMIN_CREATE_USER", "USER", str(user.id), current_user.id, {"role": user.role.value})
    return ResponseEnvelope(success=True, message="User created.", data={"id": user.id, "role": user.role.value})


@router.patch("/users/{user_id}", response_model=ResponseEnvelope, summary="Update user role or status")
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_user.id and payload.is_active is False:
        raise HTTPException(status_code=400, detail="An administrator cannot disable their own active session.")
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    db.commit()
    log_audit_action(db, "ADMIN_UPDATE_USER", "USER", str(user.id), current_user.id, {"role": user.role.value, "active": user.is_active})
    return ResponseEnvelope(success=True, message="User updated.", data={"id": user.id, "role": user.role.value, "is_active": user.is_active})


@router.get("/imports", response_model=ResponseEnvelope, summary="Admin import history")
def import_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    sources = db.query(DataSource).order_by(DataSource.ingested_at.desc()).limit(100).all()
    return ResponseEnvelope(
        success=True,
        message="Import history retrieved.",
        data={
            "items": [{
                "id": source.id,
                "filename": source.filename,
                "source_type": source.source_type.value,
                "status": source.status.value,
                "rows_processed": source.row_count,
                "error": source.error_log,
                "ingested_at": _iso(source.ingested_at),
                "case_id": source.case_id_ref,
                "reprocess_supported": False,
            } for source in sources],
            "reprocessing_note": "Not available: original source content is not retained by the current ingestion model.",
        },
    )


@router.post("/imports/file", response_model=ResponseEnvelope, status_code=status.HTTP_201_CREATED, summary="Admin import file")
async def import_file(
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(None),
    source_type: Optional[DataSourceType] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """Admin-only entry point to the existing ingestion service."""
    content_bytes = await file.read()
    if file.filename and file.filename.lower().endswith(".pdf"):
        from app.nlp.pdf_parser import extract_text_from_pdf_bytes
        try:
            content = extract_text_from_pdf_bytes(content_bytes)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"PDF parsing failed: {exc}") from exc
    else:
        try:
            content = content_bytes.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=400, detail="File must be UTF-8 text or a valid PDF.") from exc
    try:
        result = ingest_document(
            db=db,
            filename=file.filename or "upload",
            content=content,
            source_type=source_type,
            case_id=case_id,
            file_size=len(content_bytes),
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {exc}") from exc
    log_audit_action(db, "ADMIN_IMPORT_FILE", "DATA_SOURCE", str(result["data_source_id"]), current_user.id, {"filename": result["filename"]})
    return ResponseEnvelope(success=True, message="File imported.", data=result)


@router.get("/audit", response_model=ResponseEnvelope, summary="Admin audit log")
def audit_log(
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return ResponseEnvelope(
        success=True,
        message="Audit log retrieved.",
        data={"items": [{
            "id": log.id,
            "timestamp": _iso(log.timestamp),
            "user": log.user.full_name if log.user else "System",
            "action": log.action,
            "resource": f"{log.resource_type}{f' · {log.resource_id}' if log.resource_id else ''}",
            "status": "RECORDED",
            "ip_address": log.ip_address,
        } for log in logs]},
    )


@router.get("/roles", response_model=ResponseEnvelope, summary="Role permissions")
def role_permissions(current_user: User = Depends(admin_required)):
    return ResponseEnvelope(
        success=True,
        message="Server-enforced role permissions retrieved.",
        data={
            "enforcement": "FastAPI RBAC dependency",
            "roles": [
                {"role": "ADMIN", "permissions": ["Manage users and roles", "View system health", "View import and audit history", "Upload through admin ingestion"]},
                {"role": "INVESTIGATOR", "permissions": ["Work assigned cases", "Review leads", "View case graph"]},
                {"role": "ANALYST", "permissions": ["View strategic analytics", "Create intelligence leads"]},
                {"role": "VIEWER", "permissions": ["Read-only authorised views"]},
            ],
        },
    )
