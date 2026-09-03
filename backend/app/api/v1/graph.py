"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Knowledge Graph API Endpoints (Visual Graph, Shortest Path, Syndicate Subgraphs)
"""
from typing import Optional
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

@router.get("/", response_model=GraphResponse)
def get_graph():
    """Returns the full knowledge graph nodes & edges for 2D/3D visualization."""
    ensure_graph_seeded()
    return neo4j_client.get_full_graph()

@router.get("/shortest-path")
def get_shortest_path(
    source: str = Query(..., description="Source suspect/entity name"),
    target: str = Query(..., description="Target suspect/entity name")
):
    """Finds degrees of separation and connection path between any two suspects/entities."""
    ensure_graph_seeded()
    path_data = graph_analytics.find_shortest_path(source, target)
    return path_data

@router.get("/node/{node_id}")
def get_node_details(node_id: str):
    """Gets direct neighbors and all connected edges for a specific node."""
    ensure_graph_seeded()
    graph = neo4j_client.get_full_graph()
    matching_node = next((n for n in graph["nodes"] if n["id"].lower() == node_id.lower()), None)
    if not matching_node:
        raise HTTPException(status_code=404, detail="Node not found in graph")

    connected_edges = [
        e for e in graph["edges"]
        if e["source"].lower() == node_id.lower() or e["target"].lower() == node_id.lower()
    ]
    neighbor_ids = {
        e["target"] if e["source"].lower() == node_id.lower() else e["source"]
        for e in connected_edges
    }
    neighbor_nodes = [n for n in graph["nodes"] if n["id"] in neighbor_ids]

    return {
        "node": matching_node,
        "edges": connected_edges,
        "neighbors": neighbor_nodes,
        "degree": len(connected_edges)
    }
