"""
Phase 5: Lead Verification & Human-in-the-Loop API Endpoints

Also accepts Analyst → Investigator intelligence leads (handoff).
Does not redesign Investigator workflow — intel leads appear in the same queue.
"""
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, log_audit_action
from app.db.postgres import get_db
from app.models.user import User
from app.schemas.common import ResponseEnvelope

router = APIRouter()

# Analyst-created intelligence leads (handoff to Investigator)
INTEL_LEADS_STORE: List[Dict[str, Any]] = []
_INTEL_SEQ = 1

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


class IntelligenceLeadCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: str = "HIGH"
    related_cases: List[str] = Field(default_factory=list)
    entities: List[Any] = Field(default_factory=list)
    relationships: List[Any] = Field(default_factory=list)
    locations: List[Any] = Field(default_factory=list)
    evidence: List[Any] = Field(default_factory=list)
    reason: str = ""
    confidence: Optional[float] = None
    confidence_reason: Optional[str] = None
    pattern_type: Optional[str] = None
    created_by: str = "ANALYST"


def _all_leads() -> List[Dict[str, Any]]:
    return list(LEADS_STORE) + list(INTEL_LEADS_STORE)


@router.get("/pending", response_model=ResponseEnvelope, summary="List Pending AI-Suggested Entity Merges & Leads")
def list_pending_leads(
    status_filter: Optional[str] = Query(None, alias="status"),
    lead_kind: Optional[str] = Query(None, description="merge|intelligence|all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve candidate entity links and analyst intelligence leads."""
    items = _all_leads()
    if lead_kind == "intelligence":
        items = list(INTEL_LEADS_STORE)
    elif lead_kind == "merge":
        items = list(LEADS_STORE)
    if status_filter:
        items = [l for l in items if l.get("status") == status_filter.upper()]

    log_audit_action(
        db=db,
        action="LEAD_QUEUE_VIEW",
        resource_type="LEAD",
        user_id=current_user.id if current_user else None,
    )

    return ResponseEnvelope(
        success=True,
        message=f"Found {len(items)} lead(s).",
        data={"total": len(items), "leads": items, "items": items},
    )


@router.get("/intelligence", response_model=ResponseEnvelope, summary="List analyst intelligence leads")
def list_intelligence_leads(
    status_filter: Optional[str] = Query(None, alias="status"),
):
    items = INTEL_LEADS_STORE
    if status_filter:
        items = [l for l in items if l.get("status") == status_filter.upper()]
    return ResponseEnvelope(
        success=True,
        message=f"Found {len(items)} intelligence lead(s).",
        data={"total": len(items), "leads": items},
    )


@router.post("/intelligence", response_model=ResponseEnvelope, summary="Create analyst intelligence lead for Investigator")
def create_intelligence_lead(payload: IntelligenceLeadCreate):
    """Analyst → Investigator handoff. Does not alter Investigator workflow UI beyond queue contents."""
    global _INTEL_SEQ
    lead_id = f"INTEL-{_INTEL_SEQ:03d}"
    _INTEL_SEQ += 1
    lead = {
        "id": lead_id,
        "lead_id": lead_id,
        "lead_kind": "INTELLIGENCE",
        "source": "ANALYST",
        "title": payload.title,
        "description": payload.description,
        "priority": payload.priority.upper(),
        "related_cases": payload.related_cases,
        "entities": payload.entities,
        "relationships": payload.relationships,
        "locations": payload.locations,
        "evidence": payload.evidence,
        "reason": payload.reason,
        "confidence": payload.confidence,
        "confidence_reason": payload.confidence_reason,
        "pattern_type": payload.pattern_type,
        "created_by": payload.created_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "PENDING",
        # Compatibility fields for existing LeadVerification cards
        "entity_a": payload.title,
        "entity_b": ", ".join(payload.related_cases) or "Multi-case pattern",
        "match_type": payload.pattern_type or "Analyst Intelligence Lead",
        "reviewed_by": None,
        "reviewed_at": None,
        "remarks": None,
    }
    INTEL_LEADS_STORE.insert(0, lead)
    return ResponseEnvelope(
        success=True,
        message=f"Intelligence lead {lead_id} sent to Investigator queue.",
        data=lead,
    )


@router.post("/{lead_id}/verify", response_model=ResponseEnvelope, summary="Officer Verification Action (Approve / Reject)")
def verify_lead(
    lead_id: str,
    payload: LeadVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve or Reject an AI lead suggestion with investigator remarks and audit record."""
    lead = next((l for l in _all_leads() if l.get("id") == lead_id or l.get("lead_id") == lead_id), None)
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead '{lead_id}' not found.")

    action = payload.action.upper()
    if action not in ("APPROVED", "REJECTED"):
        raise HTTPException(status_code=400, detail="Action must be 'APPROVED' or 'REJECTED'.")

    lead["status"] = action
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
            "lead_kind": lead.get("lead_kind", "MERGE"),
        },
    )

    return ResponseEnvelope(
        success=True,
        message=f"Lead {lead_id} successfully marked as {lead['status']}.",
        data=lead,
    )
