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


@router.get(
    "/entity/{entity_id}/priority",
    response_model=ResponseEnvelope,
    summary="Calculate Investigation Priority Score for an Entity",
)
def get_entity_priority(entity_id: str):
    """
    Compute investigation priority from real graph metrics:
    - Network Connectivity (degree centrality)
    - Cross-Case Associations
    - Communication Activity
    - Financial Activity
    - Evidence Density
    """
    try:
        query = """
        MATCH (n:Entity {id: $entity_id})
        OPTIONAL MATCH (n)-[r]-(connected)
        WITH n, count(DISTINCT connected) AS degree,
             collect(DISTINCT type(r)) AS rel_types,
             collect(DISTINCT connected) AS neighbors
        RETURN n.id AS entity_id, n.name AS name, n.cases AS cases,
               degree,
               rel_types,
               size([x IN neighbors WHERE 'Person' IN labels(x)]) AS person_connections,
               size([x IN neighbors WHERE 'Organization' IN labels(x)]) AS org_connections,
               size([x IN neighbors WHERE 'Phone' IN labels(x) OR 'FinancialAccount' IN labels(x)]) AS asset_connections
        """
        results = Neo4jClient.run_query(query, {"entity_id": entity_id})
        if not results:
            raise HTTPException(status_code=404, detail=f"Entity '{entity_id}' not found.")

        r = results[0]
        degree = r.get("degree", 0)
        cases = r.get("cases") or []
        rel_types = r.get("rel_types") or []
        person_conn = r.get("person_connections", 0)
        org_conn = r.get("org_connections", 0)
        asset_conn = r.get("asset_connections", 0)

        # Calculate component scores (each out of max)
        connectivity_score = min(30, degree * 4)  # max 30
        cross_case_score = min(25, len(cases) * 10)  # max 25
        comm_score = min(20, sum(1 for rt in rel_types if rt in ("COMMUNICATES_WITH", "CALLS", "CONTACTED")) * 7)  # max 20
        financial_score = min(15, sum(1 for rt in rel_types if rt in ("TRANSFERRED_TO", "OWNS", "RECEIVES_FROM", "FUNDS")) * 5)  # max 15
        evidence_score = min(10, (person_conn + org_conn + asset_conn) * 2)  # max 10

        total = connectivity_score + cross_case_score + comm_score + financial_score + evidence_score

        if total < 20:
            level = "LOW"
            message = "Insufficient evidence for reliable priority calculation."
        elif total < 50:
            level = "MODERATE"
            message = "Moderate investigation activity detected."
        elif total < 75:
            level = "HIGH"
            message = "Significant network activity warrants closer investigation."
        else:
            level = "CRITICAL"
            message = "High-priority entity with extensive network connections."

        return ResponseEnvelope(
            success=True,
            message=message,
            data={
                "entity_id": entity_id,
                "name": r.get("name"),
                "total_score": total,
                "max_score": 100,
                "level": level,
                "breakdown": {
                    "network_connectivity": {"score": connectivity_score, "max": 30, "detail": f"{degree} direct connections"},
                    "cross_case_associations": {"score": cross_case_score, "max": 25, "detail": f"Appears in {len(cases)} case(s)"},
                    "communication_activity": {"score": comm_score, "max": 20, "detail": f"{person_conn} person connections"},
                    "financial_activity": {"score": financial_score, "max": 15, "detail": f"{asset_conn} financial/phone assets"},
                    "evidence_density": {"score": evidence_score, "max": 10, "detail": f"{len(rel_types)} relationship types"},
                },
                "cases": cases,
                "disclaimer": "Priority is based on observable network and case activity. It does not determine guilt.",
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/entity/{entity_id}/connections",
    response_model=ResponseEnvelope,
    summary="Get All Connections for an Entity",
)
def get_entity_connections(entity_id: str):
    """Return all entities connected to a given entity with relationship details."""
    try:
        query = """
        MATCH (n:Entity {id: $entity_id})-[r]-(connected:Entity)
        RETURN n.name AS source_name,
               type(r) AS relationship,
               properties(r) AS rel_props,
               connected.id AS target_id,
               connected.name AS target_name,
               labels(connected) AS target_labels,
               connected.cases AS target_cases
        """
        results = Neo4jClient.run_query(query, {"entity_id": entity_id})
        connections = []
        for r in (results or []):
            connections.append({
                "target_id": r.get("target_id"),
                "target_name": r.get("target_name", r.get("target_id")),
                "target_type": (r.get("target_labels") or ["Entity"])[0] if isinstance(r.get("target_labels"), list) else "Entity",
                "relationship": r.get("relationship"),
                "properties": r.get("rel_props") or {},
                "cases": r.get("target_cases") or [],
            })
        return ResponseEnvelope(
            success=True,
            message=f"Found {len(connections)} connections for entity {entity_id}.",
            data={"entity_id": entity_id, "connections": connections}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/communities",
    response_model=ResponseEnvelope,
    summary="Detect Communities / Clusters in the Graph",
)
def get_communities():
    """Identify connected clusters of entities using Neo4j."""
    try:
        query = """
        MATCH (n:Entity)
        WITH collect(n) AS allNodes
        UNWIND allNodes AS node
        MATCH path = (node)-[*1..3]-(connected:Entity)
        WITH node, collect(DISTINCT connected.id) AS cluster_members
        RETURN node.id AS entity_id, node.name AS name, node.cases AS cases,
               size(cluster_members) AS cluster_size
        ORDER BY cluster_size DESC
        LIMIT 20
        """
        results = Neo4jClient.run_query(query)
        return ResponseEnvelope(
            success=True,
            message=f"Community analysis for {len(results or [])} entities.",
            data=results or []
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
