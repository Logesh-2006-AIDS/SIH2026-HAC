"""
Phase 5: Tamper-Evident Audit Trail API Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, log_audit_action
from app.db.postgres import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.common import ResponseEnvelope

router = APIRouter()


class AuditLogOut(BaseModel):
    id: int
    timestamp: str
    user_id: Optional[int]
    action: str
    resource_type: str
    resource_id: Optional[str]
    ip_address: Optional[str]
    details: Optional[dict]

    class Config:
        from_attributes = True


class ClientLogRequest(BaseModel):
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[dict] = None


@router.get("/", response_model=ResponseEnvelope, summary="Retrieve Tamper-Evident Audit Logs")
def get_audit_logs(
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Query immutable investigation audit trail with timestamps and user identifiers."""
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)

    total = q.count()
    logs = q.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()

    formatted = [
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat() if l.timestamp else "",
            "user_id": l.user_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "ip_address": l.ip_address or "127.0.0.1",
            "details": l.details,
        }
        for l in logs
    ]

    return ResponseEnvelope(
        success=True,
        message=f"Found {total} audit records.",
        data={"total": total, "items": formatted},
    )


@router.post("/log", response_model=ResponseEnvelope, summary="Record a Client Investigation Event")
def record_event(
    payload: ClientLogRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record an audit trail event triggered by investigator actions (search, zoom, path query)."""
    log_audit_action(
        db=db,
        action=payload.action,
        resource_type=payload.resource_type,
        resource_id=payload.resource_id,
        user_id=current_user.id if current_user else None,
        details=payload.details,
    )
    return ResponseEnvelope(
        success=True,
        message="Audit record logged successfully.",
        data={"action": payload.action, "recorded": True},
    )
