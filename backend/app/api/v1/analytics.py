"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Graph Analytics & Intelligence API Endpoints
"""
from fastapi import APIRouter
from app.services.graph_service import graph_analytics
from app.db.neo4j_client import neo4j_client
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
            print(f"Auto-seed error in analytics: {e}")
        finally:
            db.close()

@router.get("/centrality")
def get_centrality_rankings():
    """Computes betweenness centrality and key suspect threat index."""
    ensure_graph_seeded()
    return graph_analytics.compute_centrality()

@router.get("/syndicates")
def get_syndicates():
    """Identifies criminal sub-graphs, syndicates and gangs."""
    ensure_graph_seeded()
    return graph_analytics.detect_syndicates()

@router.get("/communities")
def get_communities():
    """Identifies Louvain / connected community clusters."""
    ensure_graph_seeded()
    return graph_analytics.detect_syndicates()

@router.get("/shortest-path")
def find_shortest_path(source: str, target: str):
    """Finds shortest path between two suspects."""
    ensure_graph_seeded()
    return graph_analytics.find_shortest_path(source, target)
