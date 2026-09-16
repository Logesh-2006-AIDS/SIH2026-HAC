"""
Analyst Intelligence API
========================
Strategic crime analytics for the Analyst dashboard.
"""
from typing import Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.schemas.common import ResponseEnvelope
from app.services import analyst_intelligence as ai

router = APIRouter()


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)


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
