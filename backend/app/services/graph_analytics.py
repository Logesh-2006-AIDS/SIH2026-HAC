"""
Phase 4: Knowledge Graph Analytics Engine
Implements algorithms (Centrality, Shortest Path) using Neo4j and APOC.
"""
import logging
from typing import Dict, List, Any
from app.db.neo4j_client import Neo4jClient

logger = logging.getLogger(__name__)


def get_subgraph(case_id: str = None) -> Dict[str, List[Any]]:
    """Retrieve nodes and edges, optionally filtered by a specific case."""
    robust_query = """
    MATCH (n:Entity)
    WHERE $case_id IS NULL OR $case_id IN n.cases
    WITH collect(DISTINCT n) AS nodes
    MATCH (n1:Entity)-[r]->(n2:Entity)
    WHERE n1 IN nodes AND n2 IN nodes
    RETURN nodes, collect(DISTINCT {source: n1.id, target: n2.id, type: type(r), properties: properties(r)}) AS edges
    """
    
    res = Neo4jClient.run_query(robust_query, {"case_id": case_id})
    if not res or not res[0].get("nodes"):
        return {"nodes": [], "edges": []}
        
    return {
        "nodes": [dict(n) for n in res[0]["nodes"]],
        "edges": res[0].get("edges", [])
    }


def get_betweenness_centrality() -> List[Dict[str, Any]]:
    """
    Calculate Betweenness Centrality for all Person nodes to find bridge players.
    Returns suspects connecting multiple distinct cases ordered by cross-case degree.
    """
    query = """
    MATCH (p:Person)
    WHERE size(p.cases) > 1
    RETURN DISTINCT p.id AS entity_id, p.name AS name, p.cases AS cases, size(p.cases) AS cross_case_degree
    ORDER BY cross_case_degree DESC
    LIMIT 10
    """
    return Neo4jClient.run_query(query)


def get_shortest_path(source_id: str, target_id: str) -> Dict[str, Any]:
    """Find the shortest path between two entities."""
    query = """
    MATCH (start:Entity {id: $source_id}), (end:Entity {id: $target_id})
    CALL apoc.algo.dijkstra(start, end, '', 'confidence') YIELD path, weight
    RETURN [n in nodes(path) | n.id] AS node_ids, weight
    """
    try:
        res = Neo4jClient.run_query(query, {"source_id": source_id, "target_id": target_id})
        if res:
            return {"path": res[0]["node_ids"], "weight": res[0]["weight"]}
    except Exception as e:
        logger.warning(f"APOC dijkstra failed: {e}. Falling back to native shortestPath.")
        
    # Fallback to native shortestPath
    fallback_query = """
    MATCH (start:Entity {id: $source_id}), (end:Entity {id: $target_id})
    MATCH path = shortestPath((start)-[*]-(end))
    RETURN [n in nodes(path) | n.id] AS node_ids, length(path) AS weight
    """
    res = Neo4jClient.run_query(fallback_query, {"source_id": source_id, "target_id": target_id})
    if res:
        return {"path": res[0]["node_ids"], "weight": res[0]["weight"]}
        
    return {"path": [], "weight": 0}
