"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Lead Verification & Human-in-the-Loop AI Feedback API Endpoints
"""
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import AuditLog, ExtractedRelationRecord

router = APIRouter()

class LeadStatusUpdate(BaseModel):
    lead_id: int
    status: str  # VERIFIED, REJECTED, UNDER_REVIEW
    officer_notes: Optional[str] = ""

# Sample in-memory lead store for live interactive review
DEFAULT_LEADS = [
    {
        "id": 1,
        "source": "Vikram Singh",
        "target": "Viper Syndicate",
        "relation": "MEMBER_OF",
        "confidence": 0.94,
        "status": "UNDER_REVIEW",
        "evidence": "Vikram Singh used mobile phone +91-98765-32100 to contact gang members of Viper Syndicate.",
        "case_id": "FIR-2025-ND-101",
        "risk_level": "CRITICAL"
    },
    {
        "id": 2,
        "source": "Ravi Kumar",
        "target": "DL01AB1234",
        "relation": "OWNS_VEHICLE",
        "confidence": 0.96,
        "status": "VERIFIED",
        "evidence": "Accused Ravi Kumar was driving Hyundai Creta DL01AB1234 registered in his name.",
        "case_id": "FIR-2025-ND-101",
        "risk_level": "HIGH"
    },
    {
        "id": 3,
        "source": "Aarav Mehta",
        "target": "Priya Nair",
        "relation": "CRYPTO_MULE",
        "confidence": 0.89,
        "status": "UNDER_REVIEW",
        "evidence": "Priya Nair provided mule bank accounts and cryptocurrency conversion services to Aarav Mehta.",
        "case_id": "FIR-2025-ND-102",
        "risk_level": "SEVERE"
    },
    {
        "id": 4,
        "source": "Meena Sharma",
        "target": "Sanjay Gupta",
        "relation": "HAWALA_OPERATOR",
        "confidence": 0.95,
        "status": "VERIFIED",
        "evidence": "Meena Sharma transferred funds to Sanjay Gupta for routing via Salt Lake, Kolkata.",
        "case_id": "FIR-2025-ND-101",
        "risk_level": "HIGH"
    },
    {
        "id": 5,
        "source": "Suresh Yadav",
        "target": "UP32XY4411",
        "relation": "OPERATED_VEHICLE",
        "confidence": 0.78,
        "status": "UNDER_REVIEW",
        "evidence": "Unverified informant claim that Suresh Yadav fled in silver Bolero UP32XY4411.",
        "case_id": "FIR-2025-ND-103",
        "risk_level": "MEDIUM"
    }
]

@router.get("/")
def get_ai_leads():
    """Retrieves all AI-generated leads requiring investigator verification."""
    return DEFAULT_LEADS

@router.post("/verify")
def update_lead_status(payload: LeadStatusUpdate, db: Session = Depends(get_db)):
    """Allows an investigator to Approve, Reject, or Flag an AI relationship."""
    lead = next((l for l in DEFAULT_LEADS if l["id"] == payload.lead_id), None)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead["status"] = payload.status
    lead["officer_notes"] = payload.officer_notes

    # Add audit log
    audit = AuditLog(
        username="investigator",
        role="investigator",
        action=f"LEAD_{payload.status}",
        resource=f"Lead #{payload.lead_id}: {lead['source']} -> {lead['relation']} -> {lead['target']}"
    )
    db.add(audit)
    db.commit()

    return {"status": "SUCCESS", "updated_lead": lead}
