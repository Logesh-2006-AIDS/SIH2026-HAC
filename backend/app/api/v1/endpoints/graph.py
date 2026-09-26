"""
Knowledge Graph API Endpoints
==============================
Exposes graph traversal, centrality analytics, shortest-path tracing, and focus subgraphs.
"""
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.common import ResponseEnvelope
from app.services import graph_builder, graph_analytics

router = APIRouter()


@router.post(
    "/seed",
    response_model=ResponseEnvelope,
    summary="Seed the Knowledge Graph from Synthetic Dataset",
)
def seed_graph():
    """Seed or synchronize the active graph store from data/metadata JSON."""
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        data_dir = os.path.join(base_dir, "data")

        stats = graph_builder.build_graph_from_synthetic_data(data_dir)
        return ResponseEnvelope(
            success=True,
            message="Graph seed / sync completed successfully.",
            data=stats
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/subgraph",
    response_model=ResponseEnvelope,
    summary="Retrieve Graph Nodes and Edges",
)
def get_subgraph(
    case_id: Optional[str] = Query(None, description="Filter by a specific Case ID"),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0, description="Minimum confidence threshold"),
    relationship_type: Optional[str] = Query(None, description="Filter by relationship type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
):
    """Get the graph structure, optionally filtered by Case ID, confidence, rel type, entity type."""
    try:
        data = graph_analytics.get_subgraph(
            case_id=case_id,
            min_confidence=min_confidence,
            relationship_type=relationship_type,
            entity_type=entity_type,
        )
        return ResponseEnvelope(
            success=True,
            message="Subgraph retrieved successfully.",
            data=data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/search",
    response_model=ResponseEnvelope,
    summary="Search Entities in the Graph",
)
def search_entities(
    q: str = Query(..., min_length=1, description="Search query string"),
    entity_type: Optional[str] = Query(None, description="Optional entity type filter"),
    limit: int = Query(30, ge=1, le=100, description="Max results"),
):
    """Search entities by phone number, vehicle plate, bank account, name, or alias."""
    try:
        results = graph_analytics.search_entities(query=q, entity_type=entity_type, limit=limit)
        return ResponseEnvelope(
            success=True,
            message=f"Found {len(results)} matching entity/entities.",
            data=results,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/centrality",
    response_model=ResponseEnvelope,
    summary="Get High-Betweenness / Cross-Case Bridge Entities",
)
def get_centrality():
    """Identify key entities that connect multiple cases."""
    try:
        data = graph_analytics.get_betweenness_centrality()
        return ResponseEnvelope(
            success=True,
            message="Centrality analytics retrieved.",
            data=data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/shortest-path",
    response_model=ResponseEnvelope,
    summary="Find Shortest Path between Two Entities",
)
def get_shortest_path(
    source_id: str = Query(..., description="ID of the starting entity"),
    target_id: str = Query(..., description="ID of the target entity")
):
    """Find the shortest connection chain between two entities with evidence."""
    try:
        data = graph_analytics.get_path_with_evidence(source_id, target_id)
        if not data.get("path"):
            return ResponseEnvelope(
                success=False,
                message="No path found between the specified entities.",
                data=data
            )
        return ResponseEnvelope(
            success=True,
            message=data.get("explanation", "Shortest path discovered."),
            data=data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/focus-subgraph",
    response_model=ResponseEnvelope,
    summary="Entity-centered focus subgraph",
)
def get_focus_subgraph(
    entity_id: str = Query(..., description="Center entity ID"),
    case_id: Optional[str] = Query(None, description="Optional case filter"),
    hops: int = Query(1, ge=1, le=2, description="Expansion hops (1=direct only)"),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0, description="Minimum confidence threshold"),
    relationship_type: Optional[str] = Query(None, description="Filter by relationship type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
):
    """Return focused subgraph around a selected entity with filters."""
    try:
        data = graph_analytics.get_focus_subgraph(
            entity_id=entity_id,
            case_id=case_id,
            hops=hops,
            min_confidence=min_confidence,
            relationship_type=relationship_type,
            entity_type=entity_type,
        )
        return ResponseEnvelope(
            success=True,
            message=f"Focus subgraph for {entity_id}.",
            data=data,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/entity/{entity_id}/profile",
    response_model=ResponseEnvelope,
    summary="Full entity investigation profile",
)
def get_entity_profile(entity_id: str):
    """Entity details, relationships, statistics for investigator UI."""
    profile = graph_analytics.get_entity_profile(entity_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Entity '{entity_id}' not found.")
    return ResponseEnvelope(
        success=True,
        message="Entity profile retrieved.",
        data=profile,
    )


@router.get(
    "/entity/{entity_id}/priority",
    response_model=ResponseEnvelope,
    summary="Calculate Investigation Priority Score for an Entity",
)
def get_entity_priority(entity_id: str):
    """Compute investigation priority from graph metrics."""
    data = graph_analytics.get_entity_priority(entity_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Entity '{entity_id}' not found.")
    return ResponseEnvelope(
        success=True,
        message=data.pop("message", "Priority calculated."),
        data=data,
    )


@router.get(
    "/entity/{entity_id}/connections",
    response_model=ResponseEnvelope,
    summary="Get All Connections for an Entity",
)
def get_entity_connections(entity_id: str):
    """Return all entities connected to a given entity with relationship details."""
    try:
        data = graph_analytics.get_entity_connections(entity_id)
        return ResponseEnvelope(
            success=True,
            message=f"Connections retrieved for entity {entity_id}.",
            data=data,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/communities",
    response_model=ResponseEnvelope,
    summary="Detect Communities / Clusters in the Graph",
)
def get_communities():
    """Identify connected clusters of entities in the knowledge graph."""
    try:
        results = graph_analytics.get_communities()
        return ResponseEnvelope(
            success=True,
            message=f"Community analysis found {len(results)} syndicate cluster(s).",
            data=results
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
