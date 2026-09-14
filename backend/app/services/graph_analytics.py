"""
Phase 4: Knowledge Graph Analytics Engine
Implements algorithms (Centrality, Shortest Path) using Neo4j with a JSON fallback.
"""
import json
import logging
import os
from typing import Dict, List, Any
from app.db.neo4j_client import Neo4jClient

logger = logging.getLogger(__name__)

def _get_data_dir():
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    project_dir = os.path.dirname(backend_dir)
    return os.path.join(project_dir, "data", "metadata")

def _load_fallback_graph() -> Dict[str, Any]:
    try:
        path = os.path.join(_get_data_dir(), "ground_truth_graph.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load fallback graph: {e}")
    return {"nodes": [], "edges": []}


def get_subgraph(case_id: str = None) -> Dict[str, List[Any]]:
    """Retrieve nodes and edges, optionally filtered by a specific case."""
    try:
        if Neo4jClient.verify_connectivity():
            robust_query = """
            MATCH (n:Entity)
            WHERE $case_id IS NULL OR $case_id IN n.cases
            WITH collect(DISTINCT n) AS nodes
            MATCH (n1:Entity)-[r]->(n2:Entity)
            WHERE n1 IN nodes AND n2 IN nodes
            RETURN nodes, collect(DISTINCT {source: n1.id, target: n2.id, type: type(r), properties: properties(r)}) AS edges
            """
            res = Neo4jClient.run_query(robust_query, {"case_id": case_id})
            if res and res[0].get("nodes"):
                return {
                    "nodes": [dict(n) for n in res[0]["nodes"]],
                    "edges": res[0].get("edges", [])
                }
    except Exception as e:
        logger.info(f"Neo4j query unavailable ({e}), serving fallback synthetic graph.")

    # Fallback to ground_truth_graph.json
    fb = _load_fallback_graph()
    nodes = fb.get("nodes", [])
    edges = fb.get("edges", [])

    if case_id:
        nodes = [n for n in nodes if case_id in (n.get("cases") or [])]
        valid_node_ids = {n["id"] for n in nodes}
        edges = [e for e in edges if e.get("source") in valid_node_ids and e.get("target") in valid_node_ids]

    return {"nodes": nodes, "edges": edges}


def get_betweenness_centrality() -> List[Dict[str, Any]]:
    """Calculate Centrality to find bridge players connecting multiple cases."""
    try:
        if Neo4jClient.verify_connectivity():
            query = """
            MATCH (p:Person)
            WHERE size(p.cases) > 1
            RETURN DISTINCT p.id AS entity_id, p.name AS name, p.cases AS cases, size(p.cases) AS cross_case_degree
            ORDER BY cross_case_degree DESC
            LIMIT 10
            """
            res = Neo4jClient.run_query(query)
            if res:
                return res
    except Exception:
        pass

    # Fallback calculation from ground truth nodes
    fb = _load_fallback_graph()
    results = []
    for n in fb.get("nodes", []):
        cases = n.get("cases") or []
        if len(cases) > 1:
            results.append({
                "entity_id": n.get("id"),
                "name": n.get("name") or n.get("id"),
                "cases": cases,
                "cross_case_degree": len(cases)
            })
    results.sort(key=lambda x: x["cross_case_degree"], reverse=True)
    return results[:10]


def get_shortest_path(source_id: str, target_id: str) -> Dict[str, Any]:
    """Find the shortest path between two entities."""
    try:
        if Neo4jClient.verify_connectivity():
            query = """
            MATCH (start:Entity {id: $source_id}), (end:Entity {id: $target_id})
            MATCH path = shortestPath((start)-[*]-(end))
            RETURN [n in nodes(path) | n.id] AS node_ids, length(path) AS weight
            """
            res = Neo4jClient.run_query(query, {"source_id": source_id, "target_id": target_id})
            if res:
                return {"path": res[0]["node_ids"], "weight": res[0]["weight"]}
    except Exception:
        pass

    # Simple breadth-first search fallback on graph edges
    fb = _load_fallback_graph()
    adj = {}
    for edge in fb.get("edges", []):
        u, v = edge.get("source"), edge.get("target")
        if u and v:
            adj.setdefault(u, set()).add(v)
            adj.setdefault(v, set()).add(u)

    queue = [[source_id]]
    visited = {source_id}

    while queue:
        path = queue.pop(0)
        curr = path[-1]
        if curr == target_id:
            return {"path": path, "weight": len(path) - 1}
        for neighbor in adj.get(curr, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(path + [neighbor])

    return {"path": [], "weight": 0}
