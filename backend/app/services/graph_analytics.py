"""
Phase 4: Knowledge Graph Analytics Engine
Implements algorithms (Centrality, Shortest Path) using Neo4j with a JSON fallback.
"""
import json
import logging
import os
from collections import deque
from typing import Dict, List, Any, Optional, Set, Tuple
from app.db.neo4j_client import Neo4jClient

logger = logging.getLogger(__name__)

_FALLBACK_CACHE: Optional[Dict[str, Any]] = None


def _get_data_dir():
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    project_dir = os.path.dirname(backend_dir)
    return os.path.join(project_dir, "data", "metadata")


def _load_fallback_graph() -> Dict[str, Any]:
    global _FALLBACK_CACHE
    if _FALLBACK_CACHE is not None:
        return _FALLBACK_CACHE
    try:
        path = os.path.join(_get_data_dir(), "ground_truth_graph.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                raw = json.load(f)
                _FALLBACK_CACHE = {
                    "nodes": raw.get("nodes", []),
                    "edges": [_normalize_edge(e) for e in raw.get("edges", [])],
                }
                return _FALLBACK_CACHE
    except Exception as e:
        logger.warning(f"Failed to load fallback graph: {e}")
    _FALLBACK_CACHE = {"nodes": [], "edges": []}
    return _FALLBACK_CACHE


def _normalize_edge(edge: Dict[str, Any]) -> Dict[str, Any]:
    """Unify Neo4j and ground-truth JSON edge shapes."""
    source = edge.get("source") or edge.get("from_id")
    target = edge.get("target") or edge.get("to_id")
    rel_type = edge.get("type") or edge.get("relation") or "LINKED_TO"
    props = edge.get("properties") or {}
    if not props:
        props = {
            k: v
            for k, v in edge.items()
            if k not in ("source", "target", "from_id", "to_id", "type", "relation", "properties")
        }
    if "source_case" in edge and "source_case" not in props:
        props["source_case"] = edge["source_case"]
    if "confidence" in edge and "confidence" not in props:
        props["confidence"] = edge["confidence"]
    return {"source": source, "target": target, "type": rel_type, "properties": props}


def _build_adjacency(edges: List[Dict[str, Any]]) -> Dict[str, Set[str]]:
    adj: Dict[str, Set[str]] = {}
    for e in edges:
        u, v = e.get("source"), e.get("target")
        if u and v:
            adj.setdefault(u, set()).add(v)
            adj.setdefault(v, set()).add(u)
    return adj


def _node_by_id(nodes: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    return {n["id"]: n for n in nodes if n.get("id")}


def _infer_entity_type(node: Dict[str, Any]) -> str:
    if node.get("reg_number"):
        return "Vehicle"
    if node.get("number") and not node.get("name"):
        return "Phone"
    if node.get("account_number"):
        return "FinancialAccount"
    if node.get("lat") is not None and node.get("lon") is not None:
        return "Location"
    if node.get("type") and any(
        k in str(node.get("type", ""))
        for k in ("Company", "Exchange", "Syndicate", "Front", "Hawala", "Services")
    ):
        return "Organization"
    if node.get("role") or node.get("name"):
        return "Person"
    return "Entity"


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
                    "edges": [_normalize_edge(e) for e in res[0].get("edges", [])],
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
        edges = [
            e for e in edges
            if e.get("source") in valid_node_ids and e.get("target") in valid_node_ids
        ]

    return {"nodes": nodes, "edges": edges}


def get_focus_subgraph(
    entity_id: str,
    case_id: Optional[str] = None,
    hops: int = 1,
) -> Dict[str, List[Any]]:
    """Return entity-centered subgraph (default: direct neighbors only)."""
    try:
        if Neo4jClient.verify_connectivity():
            hop_range = max(1, min(hops, 2))
            query = f"""
            MATCH (center:Entity {{id: $entity_id}})
            MATCH path = (center)-[*1..{hop_range}]-(n:Entity)
            WHERE $case_id IS NULL OR $case_id IN center.cases OR $case_id IN n.cases
            WITH collect(DISTINCT center) + collect(DISTINCT n) AS all_nodes
            UNWIND all_nodes AS node
            WITH collect(DISTINCT node) AS nodes
            MATCH (n1:Entity)-[r]->(n2:Entity)
            WHERE n1 IN nodes AND n2 IN nodes
            RETURN nodes, collect(DISTINCT {{
                source: n1.id, target: n2.id, type: type(r), properties: properties(r)
            }}) AS edges
            """
            res = Neo4jClient.run_query(query, {"entity_id": entity_id, "case_id": case_id})
            if res and res[0].get("nodes"):
                return {
                    "nodes": [dict(n) for n in res[0]["nodes"]],
                    "edges": [_normalize_edge(e) for e in res[0].get("edges", [])],
                    "focus_entity_id": entity_id,
                }
    except Exception as e:
        logger.info(f"Neo4j focus query unavailable ({e}), using JSON fallback.")

    fb = _load_fallback_graph()
    nodes = fb.get("nodes", [])
    edges = fb.get("edges", [])
    node_map = _node_by_id(nodes)

    if entity_id not in node_map:
        return {"nodes": [], "edges": [], "focus_entity_id": entity_id}

    if case_id:
        nodes = [n for n in nodes if case_id in (n.get("cases") or [])]
        node_map = _node_by_id(nodes)
        if entity_id not in node_map:
            return {"nodes": [], "edges": [], "focus_entity_id": entity_id}
        valid_ids = set(node_map.keys())
        edges = [e for e in edges if e["source"] in valid_ids and e["target"] in valid_ids]

    adj = _build_adjacency(edges)
    included: Set[str] = {entity_id}
    frontier = {entity_id}
    for _ in range(max(1, min(hops, 2))):
        nxt: Set[str] = set()
        for nid in frontier:
            nxt.update(adj.get(nid, set()))
        included.update(nxt)
        frontier = nxt

    focus_nodes = [node_map[nid] for nid in included if nid in node_map]
    focus_edges = [
        e for e in edges
        if e["source"] in included and e["target"] in included
    ]
    return {"nodes": focus_nodes, "edges": focus_edges, "focus_entity_id": entity_id}


def get_entity_connections(entity_id: str) -> Dict[str, Any]:
    """All 1-hop connections for an entity."""
    try:
        if Neo4jClient.verify_connectivity():
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
                labels = r.get("target_labels") or ["Entity"]
                connections.append({
                    "target_id": r.get("target_id"),
                    "target_name": r.get("target_name", r.get("target_id")),
                    "target_type": labels[0] if isinstance(labels, list) else "Entity",
                    "relationship": r.get("relationship"),
                    "properties": r.get("rel_props") or {},
                    "cases": r.get("target_cases") or [],
                })
            return {"entity_id": entity_id, "connections": connections}
    except Exception:
        pass

    fb = _load_fallback_graph()
    node_map = _node_by_id(fb.get("nodes", []))
    center = node_map.get(entity_id)
    if not center:
        return {"entity_id": entity_id, "connections": []}

    connections = []
    for e in fb.get("edges", []):
        if e["source"] == entity_id:
            other_id = e["target"]
        elif e["target"] == entity_id:
            other_id = e["source"]
        else:
            continue
        other = node_map.get(other_id, {})
        connections.append({
            "target_id": other_id,
            "target_name": other.get("name") or other.get("reg_number") or other.get("number") or other_id,
            "target_type": _infer_entity_type(other),
            "relationship": e.get("type"),
            "properties": e.get("properties") or {},
            "cases": other.get("cases") or [],
        })
    return {"entity_id": entity_id, "connections": connections}


def get_entity_priority(entity_id: str) -> Optional[Dict[str, Any]]:
    """Investigation priority score for an entity."""
    conn_data = get_entity_connections(entity_id)
    connections = conn_data.get("connections", [])
    fb = _load_fallback_graph()
    node_map = _node_by_id(fb.get("nodes", []))
    node = node_map.get(entity_id)
    if not node:
        return None

    degree = len(connections)
    cases = node.get("cases") or []
    rel_types = {c.get("relationship") for c in connections}
    person_conn = sum(1 for c in connections if c.get("target_type") == "Person")
    asset_conn = sum(
        1 for c in connections
        if c.get("target_type") in ("Phone", "FinancialAccount", "Vehicle")
    )

    connectivity_score = min(30, degree * 4)
    cross_case_score = min(25, len(cases) * 10)
    comm_score = min(
        20,
        sum(1 for rt in rel_types if rt in ("COMMUNICATES_WITH", "CALLS", "CONTACTED")) * 7,
    )
    financial_score = min(
        15,
        sum(1 for rt in rel_types if rt in ("TRANSFERRED_TO", "OWNS", "RECEIVES_FROM", "FUNDS")) * 5,
    )
    evidence_score = min(10, (person_conn + asset_conn) * 2)
    total = connectivity_score + cross_case_score + comm_score + financial_score + evidence_score

    if total < 20:
        level, message = "LOW", "Limited network activity for this entity."
    elif total < 50:
        level, message = "MODERATE", "Moderate investigation activity detected."
    elif total < 75:
        level, message = "HIGH", "Significant network activity warrants closer investigation."
    else:
        level, message = "CRITICAL", "High-priority entity with extensive network connections."

    return {
        "entity_id": entity_id,
        "name": node.get("name") or entity_id,
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
        "message": message,
    }


def get_entity_profile(entity_id: str) -> Optional[Dict[str, Any]]:
    """Full entity investigation profile from graph data."""
    fb = _load_fallback_graph()
    node_map = _node_by_id(fb.get("nodes", []))
    node = node_map.get(entity_id)
    if not node:
        return None

    conn_data = get_entity_connections(entity_id)
    connections = conn_data.get("connections", [])
    priority = get_entity_priority(entity_id) or {}

    return {
        "entity": {**node, "entity_type": _infer_entity_type(node)},
        "statistics": {
            "connection_count": len(connections),
            "case_count": len(node.get("cases") or []),
            "degree_centrality": round(len(connections) / max(len(fb.get("nodes", [])), 1), 3),
            "priority_score": priority.get("total_score", 0),
            "priority_level": priority.get("level", "UNKNOWN"),
        },
        "connected_cases": node.get("cases") or [],
        "relationships": [
            {
                "target_id": c["target_id"],
                "target_name": c["target_name"],
                "target_type": c["target_type"],
                "relationship": c["relationship"],
                "source_case": (c.get("properties") or {}).get("source_case"),
                "confidence": (c.get("properties") or {}).get("confidence", 0.9),
                "evidence_source": (c.get("properties") or {}).get("source", "Graph Intelligence"),
            }
            for c in connections
        ],
        "cross_case": len(node.get("cases") or []) > 1,
    }


def get_cross_case_links(case_id: str) -> List[Dict[str, Any]]:
    """Entities linking this case to others."""
    try:
        if Neo4jClient.verify_connectivity():
            query = """
            MATCH (n:Entity)
            WHERE $case_id IN n.cases AND size(n.cases) > 1
            RETURN n.id AS entity_id, n.name AS name, labels(n) AS labels, n.cases AS cases
            ORDER BY size(n.cases) DESC
            """
            results = Neo4jClient.run_query(query, {"case_id": case_id})
            links = []
            for r in (results or []):
                other_cases = [c for c in (r.get("cases") or []) if c != case_id]
                labels = r.get("labels") or ["Entity"]
                links.append({
                    "entity_id": r.get("entity_id"),
                    "name": r.get("name", r.get("entity_id")),
                    "type": labels[0] if isinstance(labels, list) else "Entity",
                    "shared_cases": other_cases,
                    "total_cases": len(r.get("cases", [])),
                })
            return links
    except Exception:
        pass

    fb = _load_fallback_graph()
    links = []
    for n in fb.get("nodes", []):
        cases = n.get("cases") or []
        if case_id in cases and len(cases) > 1:
            links.append({
                "entity_id": n.get("id"),
                "name": n.get("name") or n.get("id"),
                "type": _infer_entity_type(n),
                "shared_cases": [c for c in cases if c != case_id],
                "total_cases": len(cases),
            })
    links.sort(key=lambda x: x["total_cases"], reverse=True)
    return links


def get_case_timeline_events(case: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Build investigation timeline from graph relationships for a case."""
    case_number = case.get("case_number", "")
    subgraph = get_subgraph(case_number)
    edges = subgraph.get("edges", [])
    node_map = _node_by_id(subgraph.get("nodes", []))

    timeline_events = [{
        "date": case.get("incident_date", ""),
        "title": "Case Registered",
        "description": f"{case.get('fir_number')} - {case.get('title')}",
        "entities": case.get("accused", []),
        "relationship": "CASE_REGISTERED",
        "evidence_source": case.get("jurisdiction", ""),
        "confidence": 1.0,
        "event_type": "CASE",
    }]

    desc_map = {
        "COMMUNICATES_WITH": "Communication link identified",
        "CALLS": "CDR call record detected",
        "TRANSFERRED_TO": "Financial transfer recorded",
        "OWNS": "Asset ownership identified",
        "ASSOCIATED_WITH": "Association discovered",
        "WORKS_FOR": "Organizational affiliation identified",
        "OPERATES_FROM": "Operational base identified",
        "INVOLVED_IN": "Case involvement established",
        "TRANSITS_VIA": "Transit route identified",
    }

    seen = set()
    for e in edges:
        key = f"{e['source']}-{e.get('type')}-{e['target']}"
        if key in seen:
            continue
        seen.add(key)
        src = node_map.get(e["source"], {})
        tgt = node_map.get(e["target"], {})
        rel_type = e.get("type", "CONNECTED")
        props = e.get("properties") or {}
        src_name = src.get("name") or src.get("reg_number") or src.get("number") or e["source"]
        tgt_name = tgt.get("name") or tgt.get("reg_number") or tgt.get("number") or e["target"]
        timeline_events.append({
            "date": props.get("timestamp") or case.get("incident_date", ""),
            "title": desc_map.get(rel_type, f"{rel_type.replace('_', ' ').title()} discovered"),
            "description": f"{src_name} → {rel_type.replace('_', ' ')} → {tgt_name}",
            "entities": [src_name, tgt_name],
            "relationship": rel_type,
            "evidence_source": props.get("source") or f"FIR-{case_number}",
            "confidence": props.get("confidence", 0.9),
            "event_type": _infer_entity_type(src),
        })
    return timeline_events


def get_path_with_evidence(source_id: str, target_id: str) -> Dict[str, Any]:
    """Shortest path plus relationship evidence for each hop."""
    path_result = get_shortest_path(source_id, target_id)
    path = path_result.get("path") or []
    if len(path) < 2:
        return {**path_result, "hops": [], "explanation": "No connection path found."}

    fb = _load_fallback_graph()
    node_map = _node_by_id(fb.get("nodes", []))
    edge_index = {}
    for e in fb.get("edges", []):
        edge_index[(e["source"], e["target"])] = e
        edge_index[(e["target"], e["source"])] = e

    hops = []
    for i in range(len(path) - 1):
        a, b = path[i], path[i + 1]
        edge = edge_index.get((a, b), {})
        props = edge.get("properties") or {}
        na = node_map.get(a, {})
        nb = node_map.get(b, {})
        hops.append({
            "from_id": a,
            "from_name": na.get("name") or a,
            "to_id": b,
            "to_name": nb.get("name") or b,
            "relationship": edge.get("type", "CONNECTED"),
            "source_case": props.get("source_case"),
            "confidence": props.get("confidence", 0.9),
            "evidence_source": props.get("source") or f"CDR/FIR-{props.get('source_case', '')}",
        })

    names = [node_map.get(pid, {}).get("name") or pid for pid in path]
    explanation = f"Path exists via {len(hops)} hop(s): {' → '.join(names)}"
    return {**path_result, "hops": hops, "explanation": explanation}


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
