"""
Phase 5: Lead Verification & Human-in-the-Loop API Endpoints
"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, log_audit_action
from app.db.postgres import get_db
from app.models.user import User
from app.schemas.common import ResponseEnvelope

router = APIRouter()

# In-memory store for interactive lead actions in development
LEADS_STORE = [
    {
        "id": "LEAD-001",
        "entity_a": "Ravi Kumar (FIR 101 Extortion)",
        "entity_b": "Ravan (FIR 105 Hawala)",
        "match_type": "Fuzzy Alias & Phone Match",
        "confidence": 0.94,
        "evidence": "Both suspect records share primary phone +91-98110-44501 and associate with Apex Global Logistics.",
        "status": "PENDING",
        "reviewed_by": None,
        "reviewed_at": None,
        "remarks": None,
    },
    {
        "id": "LEAD-002",
        "entity_a": "Vikram Singh (FIR 101 Extortion)",
        "entity_b": "Vicky (FIR 102 Cyber Fraud)",
        "match_type": "Vehicle Plate & Phone Overlap",
        "confidence": 0.96,
        "evidence": "Vehicle DL-01-AB-1234 registered to Vikram Singh in Case 101; matching CDR logs in Case 102.",
        "status": "PENDING",
        "reviewed_by": None,
        "reviewed_at": None,
        "remarks": None,
    },
    {
        "id": "LEAD-003",
        "entity_a": "Account 112233445566778 (ICICI)",
        "entity_b": "Aarav Mehta (Case 105 Hawala)",
        "match_type": "Direct Account Linkage",
        "confidence": 1.0,
        "evidence": "Account received victim phishing proceeds in Case 102 and sent layering transfers in Case 105.",
        "status": "PENDING",
        "reviewed_by": None,
        "reviewed_at": None,
        "remarks": None,
    },
    {
        "id": "LEAD-004",
        "entity_a": "Rohit Patel (Case 104 Auto Theft)",
        "entity_b": "R. Patel (Case 105 Hawala)",
        "match_type": "IFSC & Bank Routing Overlap",
        "confidence": 0.88,
        "evidence": "Proceeds from cloned vehicle sales deposited into Axis Bank account routed to Shroff Hawala.",
        "status": "PENDING",
        "reviewed_by": None,
        "reviewed_at": None,
        "remarks": None,
    },
]


class LeadVerifyRequest(BaseModel):
    action: str  # APPROVED, REJECTED
    remarks: Optional[str] = "Verified by investigating officer"


@router.get("/pending", response_model=ResponseEnvelope, summary="List Pending AI-Suggested Entity Merges & Leads")
def list_pending_leads(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve candidate entity links awaiting investigator review."""
    items = LEADS_STORE
    if status_filter:
        items = [l for l in LEADS_STORE if l["status"] == status_filter.upper()]

    log_audit_action(
        db=db,
        action="LEAD_QUEUE_VIEW",
        resource_type="LEAD",
        user_id=current_user.id if current_user else None,
    )

    return ResponseEnvelope(
        success=True,
        message=f"Found {len(items)} lead(s).",
        data={"total": len(items), "leads": items},
    )


@router.post("/{lead_id}/verify", response_model=ResponseEnvelope, summary="Officer Verification Action (Approve / Reject)")
def verify_lead(
    lead_id: str,
    payload: LeadVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve or Reject an AI lead suggestion with investigator remarks and audit record."""
    lead = next((l for l in LEADS_STORE if l["id"] == lead_id), None)
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead '{lead_id}' not found.")

    if payload.action.upper() not in ("APPROVED", "REJECTED"):
        raise HTTPException(status_code=400, detail="Action must be 'APPROVED' or 'REJECTED'.")

    lead["status"] = payload.action.upper()
    lead["remarks"] = payload.remarks
    lead["reviewed_by"] = current_user.badge_number if current_user else "DL-CB-9021"
    lead["reviewed_at"] = datetime.now(timezone.utc).isoformat()

    log_audit_action(
        db=db,
        action=f"LEAD_{lead['status']}",
        resource_type="LEAD",
        resource_id=lead_id,
        user_id=current_user.id if current_user else None,
        details={
            "lead_id": lead_id,
            "decision": lead["status"],
            "remarks": payload.remarks,
            "entity_a": lead["entity_a"],
            "entity_b": lead["entity_b"],
        },
    )

    return ResponseEnvelope(
        success=True,
        message=f"Lead {lead_id} successfully marked as {lead['status']}.",
        data=lead,
    )
