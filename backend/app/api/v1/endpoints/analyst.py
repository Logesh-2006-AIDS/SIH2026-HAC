"""
Analyst Intelligence API
========================
Strategic crime analytics and Entity Resolution Review for the Analyst dashboard.
"""
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.models.ingestion import PendingResolution
from app.services.graph_store import get_graph_store
from app.api.deps import log_audit_action
from app.schemas.common import ResponseEnvelope
from app.services import analyst_intelligence as ai

router = APIRouter()


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)


class ResolutionReviewRequest(BaseModel):
    action: str = Field(..., description="APPROVE | REJECT | SPLIT")
    remarks: Optional[str] = None


@router.get("/overview", response_model=ResponseEnvelope, summary="Crime intelligence overview")
def analyst_overview(
    crime_type: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    geography: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    data = ai.overview(
        crime_type=crime_type,
        start=start,
        end=end,
        geography=geography,
        status=status,
    )
    return ResponseEnvelope(success=True, message="Analyst overview computed.", data=data)


@router.get("/heatmap", response_model=ResponseEnvelope, summary="Crime density heatmap")
def analyst_heatmap(
    mode: str = Query("density", description="density|increasing|decreasing|repeated"),
    crime_type: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    geography: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    geography_level: str = Query("city", description="state|district|city"),
):
    data = ai.build_heatmap(
        mode=mode,
        crime_type=crime_type,
        start=start,
        end=end,
        geography=geography,
        status=status,
        geography_level=geography_level,
    )
    return ResponseEnvelope(success=True, message="Heatmap computed from case/location data.", data=data)


@router.get("/region/{region_id}", response_model=ResponseEnvelope, summary="Region intelligence panel")
def analyst_region(
    region_id: str,
    crime_type: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    geography: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    mode: str = Query("density"),
    geography_level: str = Query("city", description="state|district|city"),
):
    data = ai.region_detail(
        region_id,
        crime_type=crime_type,
        start=start,
        end=end,
        geography=geography,
        status=status,
        mode=mode,
        geography_level=geography_level,
    )
    if not data.get("found"):
        return ResponseEnvelope(success=False, message=data.get("message", "Not found"), data=data)
    return ResponseEnvelope(success=True, message="Region intelligence retrieved.", data=data)


@router.get("/trends", response_model=ResponseEnvelope, summary="Crime trend analysis")
def analyst_trends(
    crime_type: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    geography: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    data = ai.crime_trends(
        crime_type=crime_type,
        start=start,
        end=end,
        geography=geography,
        status=status,
    )
    return ResponseEnvelope(success=True, message="Trends computed.", data=data)


@router.get("/compare", response_model=ResponseEnvelope, summary="Compare crime types / regions / periods")
def analyst_compare(
    axis: str = Query("period", description="period|crime_type|region"),
    left: Optional[str] = Query(None),
    right: Optional[str] = Query(None),
):
    data = ai.compare(axis=axis, left=left, right=right)
    return ResponseEnvelope(success=True, message="Comparison computed.", data=data)


@router.get("/cross-case", response_model=ResponseEnvelope, summary="Cross-case intelligence clusters")
def analyst_cross_case():
    data = ai.cross_case_intelligence()
    return ResponseEnvelope(success=True, message="Cross-case clusters computed.", data=data)


@router.get("/network", response_model=ResponseEnvelope, summary="Macro network overview")
def analyst_network(
    case_id: Optional[str] = Query(None),
    crime_type: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
):
    data = ai.network_overview(case_id=case_id, crime_type=crime_type, entity_type=entity_type)
    return ResponseEnvelope(success=True, message="Network overview aggregated.", data=data)


@router.get("/communities", response_model=ResponseEnvelope, summary="Network communities / clusters")
def analyst_communities():
    data = ai.communities()
    return ResponseEnvelope(success=True, message="Communities detected from graph components.", data=data)


@router.get("/centrality", response_model=ResponseEnvelope, summary="Key / bridge entities with explanations")
def analyst_centrality():
    data = ai.key_entities()
    return ResponseEnvelope(success=True, message="Key entities ranked with explanations.", data=data)


@router.get("/patterns", response_model=ResponseEnvelope, summary="Pattern discovery")
def analyst_patterns(
    crime_type: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    geography: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    data = ai.discover_patterns(
        crime_type=crime_type,
        start=start,
        end=end,
        geography=geography,
        status=status,
    )
    return ResponseEnvelope(success=True, message="Patterns derived from dataset.", data=data)


@router.post("/ask", response_model=ResponseEnvelope, summary="Analyst AI assistant (data-backed)")
def analyst_ask(payload: AskRequest):
    data = ai.ask_analyst(payload.question)
    return ResponseEnvelope(success=True, message="Answer grounded in computed analytics.", data=data)


# ── Entity Resolution Review Endpoints ────────────────────────────────────────

@router.get("/resolutions/pending", response_model=ResponseEnvelope, summary="List candidate entity duplicate merge suggestions")
def list_pending_resolutions(
    status: Optional[str] = Query(None, description="Filter by status (PENDING, APPROVED, REJECTED, SPLIT)"),
    db: Session = Depends(get_db),
):
    store = get_graph_store()
    
    # Auto-seed initial pending resolution candidates if database table is empty
    count = db.query(PendingResolution).count()
    if count == 0:
        seed_candidates = [
            PendingResolution(
                node_a_id="PERSON-001",
                node_b_id="RK-001",
                node_a_name="Ravi Kumar",
                node_b_name="R. Kumar (alias RK)",
                entity_type="Person",
                similarity_score=0.91,
                match_reason="Name similarity 91.0% + Shared Phone: +91-98110-44501",
                signals=["Shared Phone: +91-98110-44501", "Shared Case: CASE-101", "Location Overlap: Laxmi Nagar"],
                status="PENDING",
            ),
            PendingResolution(
                node_a_id="PERSON-002",
                node_b_id="VICKY-002",
                node_a_name="Vikram Singh",
                node_b_name="Vicky (Logistics)",
                entity_type="Person",
                similarity_score=0.94,
                match_reason="Name similarity 88.0% + Shared Vehicle: DL-01-AB-1234",
                signals=["Shared Vehicle: DL-01-AB-1234", "Shared Phone: +91-98765-43210"],
                status="PENDING",
            ),
            PendingResolution(
                node_a_id="ORG-001",
                node_b_id="ORG-002",
                node_a_name="Apex Global Logistics",
                node_b_name="Apex Logistics HQ",
                entity_type="Organization",
                similarity_score=0.96,
                match_reason="Name similarity 96.0% + Shared Address: Okhla Phase III",
                signals=["Shared Address: Okhla Phase III", "Direct Account Routing"],
                status="PENDING",
            ),
        ]
        db.add_all(seed_candidates)
        db.commit()

    q = db.query(PendingResolution)
    if status:
        q = q.filter(PendingResolution.status == status.upper())
    else:
        q = q.order_by(PendingResolution.created_at.desc())

    items = []
    for pr in q.all():
        node_a_profile = store.get_entity_profile(pr.node_a_id) or {"name": pr.node_a_name, "id": pr.node_a_id}
        node_b_profile = store.get_entity_profile(pr.node_b_id) or {"name": pr.node_b_name, "id": pr.node_b_id}
        items.append({
            "id": pr.id,
            "node_a_id": pr.node_a_id,
            "node_b_id": pr.node_b_id,
            "node_a_name": pr.node_a_name or node_a_profile.get("name"),
            "node_b_name": pr.node_b_name or node_b_profile.get("name"),
            "entity_type": pr.entity_type,
            "similarity_score": round(pr.similarity_score, 2),
            "match_reason": pr.match_reason,
            "signals": pr.signals or [],
            "status": pr.status,
            "node_a_details": node_a_profile,
            "node_b_details": node_b_profile,
            "created_at": pr.created_at.isoformat() if pr.created_at else None,
            "reviewed_at": pr.reviewed_at.isoformat() if pr.reviewed_at else None,
            "can_split": bool(pr.merge_log and pr.status == "APPROVED"),
        })

    return ResponseEnvelope(
        success=True,
        message=f"Retrieved {len(items)} entity resolution suggestion(s).",
        data={"items": items, "total": len(items)},
    )


@router.post("/resolutions/{resolution_id}/review", response_model=ResponseEnvelope, summary="Approve, reject, or split an entity resolution candidate")
def review_resolution(
    resolution_id: int,
    payload: ResolutionReviewRequest,
    db: Session = Depends(get_db),
):
    pr = db.query(PendingResolution).filter(PendingResolution.id == resolution_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail=f"Pending resolution #{resolution_id} not found.")

    action = payload.action.upper()
    store = get_graph_store()
    now = datetime.now(timezone.utc)

    if action == "APPROVE":
        try:
            # Ensure primary exists in store, if not create dummy for candidate
            if pr.node_a_id not in store._nodes:
                store.add_nodes([{"id": pr.node_a_id, "name": pr.node_a_name, "type": pr.entity_type}])
            if pr.node_b_id not in store._nodes:
                store.add_nodes([{"id": pr.node_b_id, "name": pr.node_b_name, "type": pr.entity_type}])
                
            merge_log = store.merge_nodes(pr.node_a_id, pr.node_b_id, reason=pr.match_reason or "")
            pr.merge_log = merge_log
            pr.status = "APPROVED"
            pr.reviewed_at = now
            db.commit()
            log_audit_action(
                db=db,
                action="APPROVE_ENTITY_MERGE",
                resource_type="ENTITY",
                resource_id=pr.node_a_id,
                details={"duplicate_id": pr.node_b_id, "reason": pr.match_reason, "remarks": payload.remarks},
            )
            return ResponseEnvelope(success=True, message=f"Merged '{pr.node_b_name}' into '{pr.node_a_name}'.", data={"resolution_id": pr.id, "status": "APPROVED"})
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Failed to merge nodes: {str(e)}")

    elif action == "REJECT":
        pr.status = "REJECTED"
        pr.reviewed_at = now
        db.commit()
        log_audit_action(
            db=db,
            action="REJECT_ENTITY_MERGE",
            resource_type="ENTITY",
            resource_id=pr.node_a_id,
            details={"rejected_duplicate": pr.node_b_id, "remarks": payload.remarks},
        )
        return ResponseEnvelope(success=True, message=f"Rejected merge candidate between '{pr.node_a_name}' and '{pr.node_b_name}'.", data={"resolution_id": pr.id, "status": "REJECTED"})

    elif action == "SPLIT":
        if not pr.merge_log:
            raise HTTPException(status_code=400, detail="Cannot split: no prior merge log recorded for this candidate.")
        try:
            store.split_node(pr.merge_log)
            pr.status = "SPLIT"
            pr.reviewed_at = now
            db.commit()
            log_audit_action(
                db=db,
                action="SPLIT_ENTITY",
                resource_type="ENTITY",
                resource_id=pr.node_a_id,
                details={"restored_duplicate": pr.node_b_id, "remarks": payload.remarks},
            )
            return ResponseEnvelope(success=True, message=f"Successfully split and restored '{pr.node_b_name}' as independent entity.", data={"resolution_id": pr.id, "status": "SPLIT"})
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Failed to split entity: {str(e)}")

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported resolution review action '{action}'. Use APPROVE, REJECT, or SPLIT.")
