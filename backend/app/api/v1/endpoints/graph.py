"""
Phase 4: Knowledge Graph API Endpoints
"""
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.schemas.common import ResponseEnvelope
from app.services import graph_builder, graph_analytics
from app.core.config import settings

router = APIRouter()

@router.post(
    "/seed",
    response_model=ResponseEnvelope,
    summary="Seed the Neo4j Graph from Synthetic Dataset",
)
def seed_graph():
    """Wipes the existing Neo4j graph and seeds it directly from data/metadata JSON files."""
    try:
        # Assuming run from backend/ directory or root directory
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        data_dir = os.path.join(base_dir, "data")
        
        stats = graph_builder.build_graph_from_synthetic_data(data_dir)
        return ResponseEnvelope(
            success=True,
            message="Graph successfully seeded.",
            data=stats
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/subgraph",
    response_model=ResponseEnvelope,
    summary="Retrieve Graph Nodes and Edges",
)
def get_subgraph(case_id: Optional[str] = Query(None, description="Filter by a specific Case ID")):
    """Get the graph structure, optionally filtered by a Case ID."""
    try:
        data = graph_analytics.get_subgraph(case_id)
        return ResponseEnvelope(
            success=True,
            message="Subgraph retrieved successfully.",
            data=data
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
    """Find the shortest connection chain between two entities."""
    try:
        data = graph_analytics.get_shortest_path(source_id, target_id)
        if not data.get("path"):
            return ResponseEnvelope(
                success=False,
                message="No path found between the specified entities.",
                data=data
            )
        return ResponseEnvelope(
            success=True,
            message="Shortest path discovered.",
            data=data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
