"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Graph Analytics & Intelligence API Endpoints
"""
from fastapi import APIRouter
from app.services.graph_service import graph_analytics

router = APIRouter()

@router.get("/centrality")
def get_centrality_rankings():
    """Computes betweenness centrality and key suspect threat index."""
    return graph_analytics.compute_centrality()

@router.get("/syndicates")
def get_syndicates():
    """Identifies criminal sub-graphs, syndicates and gangs."""
    return graph_analytics.detect_syndicates()
