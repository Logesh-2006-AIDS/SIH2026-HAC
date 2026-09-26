"""
Knowledge Graph Analytics Engine
================================
Routes graph analytics and queries through the unified GraphStore interface.
Supports live dynamic updates from ingestion, shortest path with explainable evidence,
betweenness centrality, and community clustering.
"""
import logging
from typing import Any, Dict, List, Optional

from app.services.graph_store import get_graph_store

logger = logging.getLogger(__name__)


def get_subgraph(
    case_id: Optional[str] = None,
    min_confidence: float = 0.0,
    relationship_type: Optional[str] = None,
    entity_type: Optional[str] = None,
) -> Dict[str, List[Any]]:
    """Retrieve graph nodes and relationships, optionally filtered by Case ID, confidence, rel type, entity type."""
    return get_graph_store().get_subgraph(
        case_id=case_id,
        min_confidence=min_confidence,
        relationship_type=relationship_type,
        entity_type=entity_type,
    )


def get_focus_subgraph(
    entity_id: str,
    case_id: Optional[str] = None,
    hops: int = 1,
    min_confidence: float = 0.0,
    relationship_type: Optional[str] = None,
    entity_type: Optional[str] = None,
) -> Dict[str, List[Any]]:
    """Return entity-centered ego network with filters."""
    return get_graph_store().get_focus_subgraph(
        entity_id=entity_id,
        case_id=case_id,
        hops=hops,
        min_confidence=min_confidence,
        relationship_type=relationship_type,
        entity_type=entity_type,
    )


def search_entities(
    query: str,
    entity_type: Optional[str] = None,
    limit: int = 30,
) -> List[Dict[str, Any]]:
    """Global multi-attribute and fuzzy entity search."""
    return get_graph_store().search_entities(query=query, entity_type=entity_type, limit=limit)


def get_entity_connections(entity_id: str) -> Dict[str, Any]:
    """Retrieve 1-hop connections for an entity."""
    return get_graph_store().get_entity_connections(entity_id)


def get_path_with_evidence(source_id: str, target_id: str) -> Dict[str, Any]:
    """Find shortest path between two entities with explainable evidence trails."""
    return get_graph_store().get_shortest_path(source_id, target_id)


def get_betweenness_centrality() -> Dict[str, Any]:
    """Identify key bridge entities that connect multiple cases or syndicates."""
    return get_graph_store().get_centrality()


def get_entity_profile(entity_id: str) -> Optional[Dict[str, Any]]:
    """Full entity investigation profile."""
    return get_graph_store().get_entity_profile(entity_id)


def get_entity_priority(entity_id: str) -> Optional[Dict[str, Any]]:
    """Calculate investigative priority score for an entity."""
    return get_graph_store().get_entity_priority(entity_id)


def get_communities() -> List[Dict[str, Any]]:
    """Detect connected clusters and communities in the graph."""
    return get_graph_store().get_communities()
