"""
Phase 5 / Phase 3: Lead Verification & Human-in-the-Loop API Endpoints

Accepts Analyst → Investigator intelligence leads (handoff) with complete provenance:
- Evidentiary strength score & label
- Plain-language reason & supporting record citations
- Mandatory officer remarks on verification / rejection
- Audit logging for full chain of custody
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
from app.services.graph_store import compute_evidentiary_strength

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
        "evidentiary_strength": compute_evidentiary_strength(0.94, "AI_SUGGESTED", "Shared phone and logistics account", "FIR-101", 2),
        "evidence": "Both suspect records share primary phone +91-98110-44501 and associate with Apex Global Logistics.",
        "supporting_records": [
            {"source_document_id": "call_detail_records.csv", "row_reference": "row 2", "details": "Matching caller +91-98110-44501"}
        ],
        "reason": "Both suspect records share primary phone +91-98110-44501 and associate with Apex Global Logistics across Case 101 and Case 105 (warrants review).",
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
        "evidentiary_strength": compute_evidentiary_strength(0.96, "AI_SUGGESTED", "Vehicle DL-01-AB-1234 registered in Case 101", "FIR-101", 2),
        "evidence": "Vehicle DL-01-AB-1234 registered to Vikram Singh in Case 101; matching CDR logs in Case 102.",
        "supporting_records": [
            {"source_document_id": "FIR-101.pdf", "row_reference": "para 4", "details": "Registered getaway vehicle"}
        ],
        "reason": "Vehicle DL-01-AB-1234 registered to Vikram Singh in Case 101 overlaps with phone intercept in Case 102 (warrants review).",
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
        "evidentiary_strength": compute_evidentiary_strength(1.0, "AI_SUGGESTED", "Account received victim proceeds", "financial_transactions.csv", 2),
        "evidence": "Account received victim phishing proceeds in Case 102 and sent layering transfers in Case 105.",
        "supporting_records": [
            {"source_document_id": "financial_transactions.csv", "row_reference": "row 14", "details": "NEFT transfer of Rs 86,000"}
        ],
        "reason": "Account 112233445566778 received phishing proceeds in Case 102 and executed layering transfers in Case 105 (warrants review).",
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
        "evidentiary_strength": compute_evidentiary_strength(0.88, "AI_SUGGESTED", "Proceeds from cloned vehicle sales", "FIR-104", 2),
        "evidence": "Proceeds from cloned vehicle sales deposited into Axis Bank account routed to Shroff Hawala.",
        "supporting_records": [
            {"source_document_id": "financial_transactions.csv", "row_reference": "row 4", "details": "Hawala routing"}
        ],
        "reason": "Proceeds from cloned vehicle sales deposited into Axis Bank account routed to Shroff Hawala (warrants review).",
        "status": "PENDING",
        "reviewed_by": None,
        "reviewed_at": None,
        "remarks": None,
    },
]


class LeadVerifyRequest(BaseModel):
    action: str = Field(..., description="VERIFIED | APPROVED | REJECTED")
    remarks: str = Field(..., min_length=3, description="Mandatory officer verification remarks / explanation")


class IntelligenceLeadCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: str = "HIGH"
    related_cases: List[str] = Field(default_factory=list)
    entities: List[Any] = Field(default_factory=list)
    relationships: List[Any] = Field(default_factory=list)
    locations: List[Any] = Field(default_factory=list)
    evidence: List[Any] = Field(default_factory=list)
    supporting_records: List[Any] = Field(default_factory=list)
    reason: str = ""
    confidence: Optional[float] = None
    confidence_reason: Optional[str] = None
    evidentiary_strength: Optional[Dict[str, Any]] = None
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
        stat_upper = status_filter.upper()
        if stat_upper == "VERIFIED":
            items = [l for l in items if l.get("status") in ("VERIFIED", "APPROVED")]
        else:
            items = [l for l in items if l.get("status") == stat_upper]

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
        stat_upper = status_filter.upper()
        if stat_upper == "VERIFIED":
            items = [l for l in items if l.get("status") in ("VERIFIED", "APPROVED")]
        else:
            items = [l for l in items if l.get("status") == stat_upper]

    return ResponseEnvelope(
        success=True,
        message=f"Found {len(items)} intelligence lead(s).",
        data={"total": len(items), "leads": items},
    )


@router.post("/intelligence", response_model=ResponseEnvelope, summary="Create analyst intelligence lead for Investigator")
def create_intelligence_lead(payload: IntelligenceLeadCreate):
    """Analyst → Investigator lead handoff with full provenance and evidentiary citations."""
    global _INTEL_SEQ
    lead_id = f"INTEL-{_INTEL_SEQ:03d}"
    _INTEL_SEQ += 1

    # Compute or inherit evidentiary strength
    ev_strength = payload.evidentiary_strength
    if not ev_strength:
        ev_strength = compute_evidentiary_strength(
            confidence=payload.confidence or 0.90,
            verification_status="AI_SUGGESTED",
            evidence_snippet=payload.reason or payload.description or "",
            source_document_id=", ".join(payload.related_cases) or "Analyst Intelligence",
            distinct_docs_count=max(1, len(payload.related_cases)),
        )

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
        "supporting_records": payload.supporting_records,
        "reason": payload.reason,
        "confidence": payload.confidence or 0.90,
        "confidence_reason": payload.confidence_reason,
        "evidentiary_strength": ev_strength,
        "pattern_type": payload.pattern_type or "Analyst Pattern Lead",
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
    """Verify or Reject an AI lead suggestion with mandatory investigator remarks and audit logging."""
    lead = next((l for l in _all_leads() if l.get("id") == lead_id or l.get("lead_id") == lead_id), None)
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead '{lead_id}' not found.")

    action_norm = payload.action.upper()
    if action_norm in ("VERIFIED", "APPROVED"):
        final_status = "VERIFIED"
    elif action_norm == "REJECTED":
        final_status = "REJECTED"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'VERIFIED', 'APPROVED', or 'REJECTED'.")

    if not payload.remarks or len(payload.remarks.strip()) < 3:
        raise HTTPException(status_code=400, detail="Investigator verification remarks are required.")

    now_iso = datetime.now(timezone.utc).isoformat()
    reviewer_badge = current_user.badge_number if current_user and current_user.badge_number else "DL-CB-9021"

    lead["status"] = final_status
    lead["remarks"] = payload.remarks.strip()
    lead["reviewed_by"] = reviewer_badge
    lead["reviewed_at"] = now_iso

    # Recompute evidentiary strength reflecting human verification
    if lead.get("evidentiary_strength"):
        base_conf = lead.get("confidence", 0.90)
        snippet = lead.get("reason") or lead.get("evidence") or ""
        doc_id = ", ".join(lead.get("related_cases", [])) if lead.get("related_cases") else "Lead Record"
        lead["evidentiary_strength"] = compute_evidentiary_strength(
            confidence=base_conf,
            verification_status="VERIFIED" if final_status == "VERIFIED" else "UNVERIFIED",
            evidence_snippet=snippet,
            source_document_id=doc_id,
            distinct_docs_count=max(1, len(lead.get("related_cases", []))),
        )

    log_audit_action(
        db=db,
        action=f"LEAD_{final_status}",
        resource_type="LEAD",
        resource_id=lead_id,
        user_id=current_user.id if current_user else None,
        details={
            "lead_id": lead_id,
            "decision": final_status,
            "remarks": payload.remarks.strip(),
            "reviewer_badge": reviewer_badge,
            "reviewed_at": now_iso,
            "lead_kind": lead.get("lead_kind", "MERGE"),
            "title": lead.get("title", ""),
        },
    )

    return ResponseEnvelope(
        success=True,
        message=f"Lead {lead_id} successfully marked as {final_status}.",
        data=lead,
    )
