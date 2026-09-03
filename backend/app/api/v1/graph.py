"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Person-Centric Knowledge Graph & Two-Person Path Analyzer API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from app.db.neo4j_client import neo4j_client
from app.services.graph_service import graph_analytics
from app.schemas.schemas import GraphResponse
from app.services.ingestion import ingestion_service
from app.db.session import SessionLocal
import os

router = APIRouter()

def ensure_graph_seeded():
    """Ensures in-memory graph is populated from dataset if empty."""
    g = neo4j_client.get_full_graph()
    if not g["nodes"]:
        db = SessionLocal()
        try:
            folder = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "dataset")
            if os.path.exists(folder):
                ingestion_service.load_seed_datasets(db, folder)
        except Exception as e:
            print(f"Auto-seed error in graph: {e}")
        finally:
            db.close()

@router.get("/")
def get_graph(
    full: bool = Query(False, description="Whether to return full 300+ node database or a clean focused starter graph"),
    center_person: Optional[str] = Query(None, description="Optional center person ID to focus on"),
    hops: int = Query(1, ge=1, le=3, description="Neighborhood expansion level")
):
    """
    Returns a clean, focused investigation graph by default instead of a messy 500-node dump.
    If center_person is provided, returns their direct ego-network.
    """
    ensure_graph_seeded()
    if full:
        return neo4j_client.get_full_graph()

    if center_person:
        return graph_analytics.get_focused_person_subgraph(center_person, hops=hops)

    # Default Clean Focus Graph (Top Syndicate Cluster ~15-20 nodes)
    return graph_analytics.get_focused_person_subgraph("Vikram Singh", hops=1, max_nodes=20)

@router.get("/person-network")
def get_person_network(
    person_id: str = Query(..., description="Suspect Name or Entity ID"),
    hops: int = Query(1, ge=1, le=3, description="Expansion hops (1=direct, 2=extended)")
):
    """Returns focused ego-network with only direct related entities around the selected person."""
    ensure_graph_seeded()
    return graph_analytics.get_focused_person_subgraph(person_id, hops=hops)

@router.get("/path-analysis")
def analyze_two_person_connection(
    source: str = Query(..., description="Person A Name or ID"),
    target: str = Query(..., description="Person B Name or ID")
):
    """
    Finds the shortest/most relevant path between Person A and Person B,
    and returns step-by-step forensic evidence, confidence scores, and explanation narrative.
    """
    ensure_graph_seeded()
    return graph_analytics.explain_connection_path(source, target)

@router.get("/shortest-path")
def get_shortest_path(
    source: str = Query(..., description="Source suspect/entity name"),
    target: str = Query(..., description="Target suspect/entity name")
):
    """Legacy alias for path analysis."""
    ensure_graph_seeded()
    return graph_analytics.explain_connection_path(source, target)

@router.get("/search")
def search_graph_entities(
    q: str = Query("", description="Search term for persons, phones, vehicles, orgs, cases"),
    limit: int = Query(15, ge=1, le=50)
):
    """Autocomplete search for finding persons, vehicles, phones, and cases in graph."""
    ensure_graph_seeded()
    return graph_analytics.search_entities(q, limit=limit)

@router.get("/node/{node_id}")
def get_node_details(node_id: str):
    """Gets direct neighbors and all connected edges for a specific node."""
    ensure_graph_seeded()
    graph = neo4j_client.get_full_graph()
    matching_node = next((n for n in graph["nodes"] if n["id"].lower() == node_id.lower() or str(n.get("name","")).lower() == node_id.lower()), None)
    if not matching_node:
        raise HTTPException(status_code=404, detail="Node not found in graph")

    actual_id = matching_node["id"]
    connected_edges = [
        e for e in graph["edges"]
        if e["source"].lower() == actual_id.lower() or e["target"].lower() == actual_id.lower()
    ]
    neighbor_ids = {
        e["target"] if e["source"].lower() == actual_id.lower() else e["source"]
        for e in connected_edges
    }
    neighbor_nodes = [n for n in graph["nodes"] if n["id"] in neighbor_ids]

    return {
        "node": matching_node,
        "edges": connected_edges,
        "neighbors": neighbor_nodes,
        "degree": len(connected_edges)
    }
