"""
Graph Store Interface & Implementations
=======================================
Provides ONE unified interface for graph storage and querying:
1. MemgraphStore: Live Memgraph graph database (via Bolt).
2. LocalFixtureStore: In-memory graph loaded from canonical fixture,
   supporting live dynamic additions (ingested FIR entities & edges).
"""
import abc
import json
import logging
import os
from collections import defaultdict, deque
from typing import Any, Dict, List, Optional, Set, Tuple

from app.core.config import settings
from app.db.graph_client import MemgraphClient

logger = logging.getLogger(__name__)


def _data_dir() -> str:
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    project_dir = os.path.dirname(backend_dir)
    return os.path.join(project_dir, "data", "metadata")


def _normalize_edge(edge: Dict[str, Any]) -> Dict[str, Any]:
    source = edge.get("source") or edge.get("from_id")
    target = edge.get("target") or edge.get("to_id")
    rel_type = edge.get("type") or edge.get("relation") or "ASSOCIATED_WITH"
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
        props["confidence"] = edge.get("confidence", 0.9)
    if "evidence" in edge and "evidence" not in props:
        props["evidence"] = edge.get("evidence", "")
    return {
        "id": edge.get("id") or f"REL-{source}-{target}",
        "source": source,
        "target": target,
        "type": rel_type,
        "relationship": rel_type,
        "properties": props,
        "source_case": props.get("source_case", ""),
        "confidence": props.get("confidence", 0.9),
        "evidence": props.get("evidence", ""),
    }


def _infer_entity_type(node: Dict[str, Any]) -> str:
    if node.get("type") and node.get("type") not in ("Entity", "UNKNOWN"):
        return node["type"]
    if node.get("reg_number"):
        return "Vehicle"
    if node.get("number") and not node.get("name"):
        return "Phone"
    if node.get("account_number"):
        return "FinancialAccount"
    if node.get("lat") is not None and node.get("lon") is not None:
        return "Location"
    if node.get("alias") and any(
        k in str(node.get("alias", "")).upper()
        for k in ("LOGISTICS", "EXPORTS", "HAWALA", "EXCHANGE", "TRADERS", "COMPANY")
    ):
        return "Organization"
    return "Person"


class BaseGraphStore(abc.ABC):
    """Abstract interface for all Knowledge Graph operations."""

    @abc.abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """Return node, edge, and store metadata."""
        pass

    @abc.abstractmethod
    def get_subgraph(self, case_id: Optional[str] = None) -> Dict[str, List[Any]]:
        """Retrieve nodes and edges, optionally filtered by case."""
        pass

    @abc.abstractmethod
    def get_focus_subgraph(self, entity_id: str, case_id: Optional[str] = None, hops: int = 1) -> Dict[str, List[Any]]:
        """Retrieve ego-network around a target entity."""
        pass

    @abc.abstractmethod
    def get_entity_connections(self, entity_id: str) -> Dict[str, Any]:
        """Retrieve direct 1-hop connections for an entity."""
        pass

    @abc.abstractmethod
    def get_shortest_path(self, source_id: str, target_id: str) -> Dict[str, Any]:
        """Find the shortest connection path between two entities with evidence."""
        pass

    @abc.abstractmethod
    def get_centrality(self) -> Dict[str, Any]:
        """Compute Betweenness and Degree centrality rankings."""
        pass

    @abc.abstractmethod
    def get_entity_profile(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve complete profile of an entity."""
        pass

    @abc.abstractmethod
    def get_entity_priority(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Calculate investigation priority score for an entity."""
        pass

    @abc.abstractmethod
    def get_communities(self) -> List[Dict[str, Any]]:
        """Detect community clusters in the graph."""
        pass

    @abc.abstractmethod
    def add_nodes(self, nodes: List[Dict[str, Any]]) -> int:
        """Insert or update entity nodes."""
        pass

    @abc.abstractmethod
    def add_edges(self, edges: List[Dict[str, Any]]) -> int:
        """Insert or update relationships."""
        pass

    @abc.abstractmethod
    def merge_nodes(self, primary_id: str, duplicate_id: str, reason: str = "") -> Dict[str, Any]:
        """Merge duplicate node into primary node and return reversible merge log."""
        pass

    @abc.abstractmethod
    def split_node(self, merge_log: Dict[str, Any]) -> bool:
        """Reverse a prior merge using its merge log."""
        pass

    @abc.abstractmethod
    def reset_to_fixtures(self) -> None:
        """Reset graph store state to canonical fixtures."""
        pass


class LocalFixtureStore(BaseGraphStore):
    """In-memory Knowledge Graph store initialized from canonical fixtures with JSON state persistence."""

    def __init__(self):
        self._nodes: Dict[str, Dict[str, Any]] = {}
        self._edges: List[Dict[str, Any]] = []
        self._load_canonical_fixtures()
        self._load_persisted_overlay()

    def _persisted_file_path(self) -> str:
        return os.path.join(_data_dir(), "persisted_graph_state.json")

    def _load_canonical_fixtures(self):
        try:
            metadata_dir = _data_dir()
            graph_path = os.path.join(metadata_dir, "ground_truth_graph.json")
            if os.path.exists(graph_path):
                with open(graph_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for n in data.get("nodes", []):
                        nid = n.get("id")
                        if nid:
                            node_data = dict(n)
                            node_data["type"] = _infer_entity_type(node_data)
                            self._nodes[nid] = node_data
                    for e in data.get("edges", []):
                        self._edges.append(_normalize_edge(e))
                logger.info("LocalFixtureStore initialized with %d nodes and %d edges.", len(self._nodes), len(self._edges))
        except Exception as e:
            logger.warning("Error loading canonical fixture in LocalFixtureStore: %s", e)

    def _load_persisted_overlay(self):
        persisted_path = self._persisted_file_path()
        if os.path.exists(persisted_path):
            try:
                with open(persisted_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for n in data.get("nodes", []):
                        nid = n.get("id")
                        if nid:
                            self._nodes[nid] = n
                    if "edges" in data:
                        self._edges = [_normalize_edge(e) for e in data["edges"]]
                logger.info("LocalFixtureStore loaded persisted overlay from %s (%d nodes, %d edges).", persisted_path, len(self._nodes), len(self._edges))
            except Exception as e:
                logger.warning("Error reading persisted graph overlay: %s", e)

    def _save_persisted_state(self):
        try:
            persisted_path = self._persisted_file_path()
            data = {
                "nodes": list(self._nodes.values()),
                "edges": self._edges,
            }
            with open(persisted_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.warning("Error saving persisted graph state: %s", e)

    def get_stats(self) -> Dict[str, Any]:
        return {
            "mode": "DEMO / FIXTURE",
            "store": "LocalFixtureStore",
            "node_count": len(self._nodes),
            "edge_count": len(self._edges),
            "is_live": False,
        }

    def get_subgraph(self, case_id: Optional[str] = None) -> Dict[str, List[Any]]:
        case_id_clean = case_id.replace("CASE-", "") if case_id else None
        nodes = list(self._nodes.values())
        edges = list(self._edges)

        if case_id_clean:
            nodes = [n for n in nodes if case_id_clean in (n.get("cases") or [])]
            valid_ids = {n["id"] for n in nodes}
            edges = [e for e in edges if e["source"] in valid_ids and e["target"] in valid_ids]

        return {"nodes": nodes, "edges": edges}

    def get_focus_subgraph(self, entity_id: str, case_id: Optional[str] = None, hops: int = 1) -> Dict[str, List[Any]]:
        if entity_id not in self._nodes:
            return {"nodes": [], "edges": [], "focus_entity_id": entity_id}

        case_id_clean = case_id.replace("CASE-", "") if case_id else None
        nodes = list(self._nodes.values())
        edges = list(self._edges)

        if case_id_clean:
            nodes = [n for n in nodes if case_id_clean in (n.get("cases") or [])]
            valid_ids = {n["id"] for n in nodes}
            edges = [e for e in edges if e["source"] in valid_ids and e["target"] in valid_ids]
            if entity_id not in valid_ids:
                return {"nodes": [], "edges": [], "focus_entity_id": entity_id}

        adj = defaultdict(set)
        for e in edges:
            u, v = e["source"], e["target"]
            adj[u].add(v)
            adj[v].add(u)

        included: Set[str] = {entity_id}
        frontier = {entity_id}
        for _ in range(max(1, min(hops, 2))):
            nxt = set()
            for nid in frontier:
                nxt.update(adj.get(nid, set()))
            included.update(nxt)
            frontier = nxt

        focus_nodes = [self._nodes[nid] for nid in included if nid in self._nodes]
        focus_edges = [e for e in edges if e["source"] in included and e["target"] in included]
        return {"nodes": focus_nodes, "edges": focus_edges, "focus_entity_id": entity_id}

    def get_entity_connections(self, entity_id: str) -> Dict[str, Any]:
        center = self._nodes.get(entity_id)
        if not center:
            return {"entity_id": entity_id, "connections": []}

        connections = []
        for e in self._edges:
            if e["source"] == entity_id:
                other_id = e["target"]
            elif e["target"] == entity_id:
                other_id = e["source"]
            else:
                continue
            other = self._nodes.get(other_id, {})
            connections.append({
                "target_id": other_id,
                "target_name": other.get("name") or other.get("reg_number") or other.get("number") or other_id,
                "target_type": other.get("type") or _infer_entity_type(other),
                "relationship": e.get("type"),
                "properties": e.get("properties") or {},
                "cases": other.get("cases") or [],
            })
        return {"entity_id": entity_id, "connections": connections}

    def get_shortest_path(self, source_id: str, target_id: str) -> Dict[str, Any]:
        if source_id == target_id:
            return {
                "path": [source_id],
                "hop_count": 0,
                "hops": [],
                "explanation": "Source and target are the same entity.",
            }

        adj = defaultdict(list)
        for e in self._edges:
            u, v = e["source"], e["target"]
            adj[u].append((v, e))
            adj[v].append((u, e))

        queue = deque([[source_id]])
        visited = {source_id}
        edge_map = {}

        found_path = None
        while queue:
            current_path = queue.popleft()
            curr = current_path[-1]
            if curr == target_id:
                found_path = current_path
                break
            for neighbor, edge_obj in adj[curr]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    edge_map[(curr, neighbor)] = edge_obj
                    edge_map[(neighbor, curr)] = edge_obj
                    queue.append(current_path + [neighbor])

        if not found_path:
            return {"path": [], "hop_count": 0, "hops": [], "explanation": "No connection path found."}

        hops = []
        for i in range(len(found_path) - 1):
            u, v = found_path[i], found_path[i + 1]
            e = edge_map.get((u, v), {})
            node_u = self._nodes.get(u, {})
            node_v = self._nodes.get(v, {})
            hops.append({
                "from_id": u,
                "from_name": node_u.get("name") or node_u.get("reg_number") or node_u.get("number") or u,
                "to_id": v,
                "to_name": node_v.get("name") or node_v.get("reg_number") or node_v.get("number") or v,
                "relationship": e.get("type") or "LINKED_TO",
                "evidence_source": (e.get("properties") or {}).get("source_case") or e.get("source_case") or "Investigation Record",
                "confidence": (e.get("properties") or {}).get("confidence", 0.9),
                "source_document": (e.get("properties") or {}).get("source_document") or "FIR-Case",
            })

        names = [self._nodes.get(nid, {}).get("name", nid) for nid in found_path]
        explanation = f"Connection found in {len(hops)} hop(s): {' -> '.join(names)}."
        return {
            "path": found_path,
            "hop_count": len(hops),
            "hops": hops,
            "explanation": explanation,
        }

    def get_centrality(self) -> Dict[str, Any]:
        adj = defaultdict(set)
        for e in self._edges:
            adj[e["source"]].add(e["target"])
            adj[e["target"]].add(e["source"])

        nodes = list(self._nodes.keys())
        n_count = len(nodes)
        cb = {n: 0.0 for n in nodes}

        for s in nodes:
            stack = []
            pred = {w: [] for w in nodes}
            sigma = {w: 0 for w in nodes}
            sigma[s] = 1
            dist = {w: -1 for w in nodes}
            dist[s] = 0
            q = deque([s])

            while q:
                v = q.popleft()
                stack.append(v)
                for w in adj[v]:
                    if dist[w] < 0:
                        dist[w] = dist[v] + 1
                        q.append(w)
                    if dist[w] == dist[v] + 1:
                        sigma[w] += sigma[v]
                        pred[w].append(v)

            delta = {w: 0.0 for w in nodes}
            while stack:
                w = stack.pop()
                for v in pred[w]:
                    if sigma[w] > 0:
                        delta[v] += (sigma[v] / sigma[w]) * (1.0 + delta[w])
                if w != s:
                    cb[w] += delta[w]

        scale = 1.0 / max(1, (n_count - 1) * (n_count - 2) / 2)
        ranked = []
        for nid, val in cb.items():
            norm_val = round(val * scale, 4)
            node = self._nodes.get(nid, {})
            cases = node.get("cases") or []
            is_bridge = len(cases) > 1 or norm_val > 0.08
            role = "Cross-Case Coordinator" if is_bridge else "Operative"
            ranked.append({
                "entity_id": nid,
                "name": node.get("name") or node.get("reg_number") or node.get("number") or nid,
                "type": node.get("type") or _infer_entity_type(node),
                "betweenness_centrality": norm_val,
                "degree": len(adj[nid]),
                "cases": cases,
                "role_in_network": role,
                "is_bridge": is_bridge,
                "explanation": f"Entity appears in {len(cases)} case(s) with {len(adj[nid])} direct ties.",
            })

        ranked.sort(key=lambda x: (len(x["cases"]) > 1, x["betweenness_centrality"], x["degree"]), reverse=True)
        return {"bridge_entities": ranked[:15], "all_ranked": ranked}

    def get_entity_profile(self, entity_id: str) -> Optional[Dict[str, Any]]:
        node = self._nodes.get(entity_id)
        if not node:
            return None

        conn_data = self.get_entity_connections(entity_id)
        connections = conn_data.get("connections", [])
        cases = node.get("cases") or []
        is_cross_case = len(cases) > 1

        profile = {
            "id": entity_id,
            "name": node.get("name") or node.get("reg_number") or node.get("number") or entity_id,
            "type": node.get("type") or _infer_entity_type(node),
            "role": node.get("role") or "Suspect",
            "aliases": node.get("aliases") or [],
            "phone": node.get("phone"),
            "address": node.get("address"),
            "cases": cases,
            "is_cross_case": is_cross_case,
            "degree": len(connections),
            "evidence_count": len(connections),
            "connections": connections,
            "verification_status": node.get("verification_status") or "AI_SUGGESTED",
        }
        return {"entity": profile, "connections": connections}

    def get_entity_priority(self, entity_id: str) -> Optional[Dict[str, Any]]:
        node = self._nodes.get(entity_id)
        if not node:
            return None

        conn = self.get_entity_connections(entity_id)
        deg = len(conn.get("connections", []))
        case_count = len(node.get("cases") or [])

        # Priority score (0 to 100)
        score = min(100, int(deg * 10 + case_count * 25))
        priority_label = "CRITICAL" if score >= 75 else "HIGH" if score >= 50 else "MEDIUM"

        return {
            "entity_id": entity_id,
            "priority_score": score,
            "priority_level": priority_label,
            "degree": deg,
            "case_count": case_count,
            "explanation": f"Investigation priority derived from {deg} network links across {case_count} case(s).",
        }

    def get_communities(self) -> List[Dict[str, Any]]:
        adj = defaultdict(set)
        for e in self._edges:
            adj[e["source"]].add(e["target"])
            adj[e["target"]].add(e["source"])

        visited = set()
        communities = []
        comm_idx = 1

        for nid, node in self._nodes.items():
            if nid not in visited:
                comp = []
                q = deque([nid])
                visited.add(nid)
                while q:
                    curr = q.popleft()
                    comp.append(curr)
                    for nbr in adj[curr]:
                        if nbr not in visited:
                            visited.add(nbr)
                            q.append(nbr)
                
                comp_nodes = [self._nodes[c] for c in comp if c in self._nodes]
                all_cases = set()
                for c in comp_nodes:
                    all_cases.update(c.get("cases") or [])

                communities.append({
                    "community_id": f"COMM-{comm_idx:02d}",
                    "name": f"Syndicate Cluster {comm_idx}",
                    "size": len(comp),
                    "members": [c.get("name") or c.get("id") for c in comp_nodes[:8]],
                    "cases": list(all_cases),
                    "primary_crime": "Organized Network",
                })
                comm_idx += 1

        communities.sort(key=lambda x: x["size"], reverse=True)
        return communities

    def add_nodes(self, nodes: List[Dict[str, Any]]) -> int:
        count = 0
        for n in nodes:
            nid = n.get("id")
            if nid:
                existing = self._nodes.get(nid, {})
                merged = {**existing, **n}
                merged["type"] = n.get("type") or _infer_entity_type(merged)
                self._nodes[nid] = merged
                count += 1
        if count > 0:
            self._save_persisted_state()
        return count

    def add_edges(self, edges: List[Dict[str, Any]]) -> int:
        count = 0
        for e in edges:
            norm = _normalize_edge(e)
            if norm.get("source") and norm.get("target"):
                self._edges.append(norm)
                count += 1
        if count > 0:
            self._save_persisted_state()
        return count

    def merge_nodes(self, primary_id: str, duplicate_id: str, reason: str = "") -> Dict[str, Any]:
        """Merge duplicate node into primary node and re-wire relationships in memory."""
        if primary_id not in self._nodes or duplicate_id not in self._nodes:
            raise ValueError(f"Cannot merge: node '{primary_id}' or '{duplicate_id}' not found.")

        import copy
        from datetime import datetime, timezone

        orig_primary = copy.deepcopy(self._nodes[primary_id])
        orig_duplicate = copy.deepcopy(self._nodes[duplicate_id])

        primary = self._nodes[primary_id]
        duplicate = self._nodes[duplicate_id]

        # Consolidate aliases
        aliases = set(primary.get("aliases") or [])
        if primary.get("alias"):
            aliases.add(primary["alias"])
        if duplicate.get("name"):
            aliases.add(duplicate["name"])
        if duplicate.get("alias"):
            aliases.add(duplicate["alias"])
        for a in (duplicate.get("aliases") or []):
            aliases.add(a)
        primary["aliases"] = sorted(list(aliases))

        # Consolidate cases
        cases = set(primary.get("cases") or [])
        for c in (duplicate.get("cases") or []):
            cases.add(c)
        primary["cases"] = sorted(list(cases))

        # Track and re-route edges
        transferred_edges = []
        for idx, edge in enumerate(self._edges):
            src = edge.get("source")
            tgt = edge.get("target")
            if src == duplicate_id or tgt == duplicate_id:
                transferred_edges.append({
                    "edge_index": idx,
                    "original_edge": copy.deepcopy(edge),
                    "original_source": src,
                    "original_target": tgt,
                })
                if src == duplicate_id:
                    edge["source"] = primary_id
                if tgt == duplicate_id:
                    edge["target"] = primary_id

        # Delete duplicate node
        del self._nodes[duplicate_id]

        merge_log = {
            "primary_id": primary_id,
            "duplicate_id": duplicate_id,
            "original_primary_node": orig_primary,
            "original_duplicate_node": orig_duplicate,
            "transferred_edges": transferred_edges,
            "reason": reason,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._save_persisted_state()
        return merge_log

    def split_node(self, merge_log: Dict[str, Any]) -> bool:
        """Reverse a merge and restore both nodes and their original edge endpoints."""
        if not merge_log:
            return False

        primary_id = merge_log.get("primary_id")
        duplicate_id = merge_log.get("duplicate_id")
        orig_primary = merge_log.get("original_primary_node")
        orig_duplicate = merge_log.get("original_duplicate_node")

        if orig_primary and primary_id:
            self._nodes[primary_id] = orig_primary
        if orig_duplicate and duplicate_id:
            self._nodes[duplicate_id] = orig_duplicate

        for item in merge_log.get("transferred_edges", []):
            orig_src = item.get("original_source")
            orig_tgt = item.get("original_target")
            idx = item.get("edge_index")
            if idx is not None and 0 <= idx < len(self._edges):
                self._edges[idx]["source"] = orig_src
                self._edges[idx]["target"] = orig_tgt
            else:
                for edge in self._edges:
                    if edge.get("source") == primary_id and orig_src == duplicate_id:
                        edge["source"] = orig_src
                    if edge.get("target") == primary_id and orig_tgt == duplicate_id:
                        edge["target"] = orig_tgt

        self._save_persisted_state()
        return True

    def reset_to_fixtures(self) -> None:
        persisted_path = self._persisted_file_path()
        if os.path.exists(persisted_path):
            try:
                os.remove(persisted_path)
            except Exception as e:
                logger.warning("Could not remove persisted graph overlay: %s", e)
        self._nodes.clear()
        self._edges.clear()
        self._load_canonical_fixtures()


class MemgraphStore(BaseGraphStore):
    """Live Memgraph implementation over Bolt protocol."""

    def __init__(self):
        self._fallback_store = LocalFixtureStore()

    def get_stats(self) -> Dict[str, Any]:
        if not MemgraphClient.verify_connectivity():
            return self._fallback_store.get_stats()
        try:
            nodes = MemgraphClient.run_query("MATCH (n) RETURN count(n) AS count")
            edges = MemgraphClient.run_query("MATCH ()-[r]->() RETURN count(r) AS count")
            return {
                "mode": "LIVE",
                "store": "MemgraphStore",
                "node_count": nodes[0].get("count", 0) if nodes else 0,
                "edge_count": edges[0].get("count", 0) if edges else 0,
                "is_live": True,
            }
        except Exception:
            return self._fallback_store.get_stats()

    def get_subgraph(self, case_id: Optional[str] = None) -> Dict[str, List[Any]]:
        if not MemgraphClient.verify_connectivity():
            return self._fallback_store.get_subgraph(case_id)
        try:
            case_id_clean = case_id.replace("CASE-", "") if case_id else None
            query = """
            MATCH (n:Entity)
            WHERE $case_id IS NULL OR $case_id IN n.cases
            WITH collect(DISTINCT n) AS nodes
            MATCH (n1:Entity)-[r]->(n2:Entity)
            WHERE n1 IN nodes AND n2 IN nodes
            RETURN nodes, collect(DISTINCT {source: n1.id, target: n2.id, type: type(r), properties: properties(r)}) AS edges
            """
            res = MemgraphClient.run_query(query, {"case_id": case_id_clean})
            if res and res[0].get("nodes"):
                return {
                    "nodes": [dict(n) for n in res[0]["nodes"]],
                    "edges": [_normalize_edge(e) for e in res[0].get("edges", [])],
                }
        except Exception as e:
            logger.warning("Memgraph get_subgraph query failed (%s), using fixture.", e)
        return self._fallback_store.get_subgraph(case_id)

    def get_focus_subgraph(self, entity_id: str, case_id: Optional[str] = None, hops: int = 1) -> Dict[str, List[Any]]:
        if not MemgraphClient.verify_connectivity():
            return self._fallback_store.get_focus_subgraph(entity_id, case_id, hops)
        try:
            case_id_clean = case_id.replace("CASE-", "") if case_id else None
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
            RETURN nodes, collect(DISTINCT {{source: n1.id, target: n2.id, type: type(r), properties: properties(r)}}) AS edges
            """
            res = MemgraphClient.run_query(query, {"entity_id": entity_id, "case_id": case_id_clean})
            if res and res[0].get("nodes"):
                return {
                    "nodes": [dict(n) for n in res[0]["nodes"]],
                    "edges": [_normalize_edge(e) for e in res[0].get("edges", [])],
                    "focus_entity_id": entity_id,
                }
        except Exception as e:
            logger.warning("Memgraph get_focus_subgraph query failed (%s), using fixture.", e)
        return self._fallback_store.get_focus_subgraph(entity_id, case_id, hops)

    def get_entity_connections(self, entity_id: str) -> Dict[str, Any]:
        if not MemgraphClient.verify_connectivity():
            return self._fallback_store.get_entity_connections(entity_id)
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
            results = MemgraphClient.run_query(query, {"entity_id": entity_id})
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
        except Exception as e:
            logger.warning("Memgraph get_entity_connections failed (%s), using fixture.", e)
        return self._fallback_store.get_entity_connections(entity_id)

    def get_shortest_path(self, source_id: str, target_id: str) -> Dict[str, Any]:
        if not MemgraphClient.verify_connectivity():
            return self._fallback_store.get_shortest_path(source_id, target_id)
        try:
            query = """
            MATCH (start:Entity {id: $source_id}), (end:Entity {id: $target_id})
            MATCH p = shortestPath((start)-[*]-(end))
            RETURN [n in nodes(p) | {id: n.id, name: n.name, type: labels(n)[0]}] AS path_nodes,
                   [r in relationships(p) | {
                       type: type(r),
                       source_case: r.source_case,
                       confidence: r.confidence,
                       evidence: r.evidence
                   }] AS path_edges
            """
            results = MemgraphClient.run_query(query, {"source_id": source_id, "target_id": target_id})
            if results and results[0].get("path_nodes"):
                p_nodes = results[0]["path_nodes"]
                p_edges = results[0].get("path_edges", [])
                hops = []
                for i in range(len(p_nodes) - 1):
                    e = p_edges[i] if i < len(p_edges) else {}
                    hops.append({
                        "from_id": p_nodes[i]["id"],
                        "from_name": p_nodes[i].get("name") or p_nodes[i]["id"],
                        "to_id": p_nodes[i + 1]["id"],
                        "to_name": p_nodes[i + 1].get("name") or p_nodes[i + 1]["id"],
                        "relationship": e.get("type") or "LINKED_TO",
                        "evidence_source": e.get("source_case") or "Investigation Record",
                        "confidence": e.get("confidence", 0.9),
                        "source_document": f"Case-{e.get('source_case', '')}",
                    })
                return {
                    "path": [n["id"] for n in p_nodes],
                    "hop_count": len(hops),
                    "hops": hops,
                    "explanation": f"Connection found in {len(hops)} hop(s).",
                }
        except Exception as e:
            logger.warning("Memgraph shortest_path failed (%s), using fixture.", e)
        return self._fallback_store.get_shortest_path(source_id, target_id)

    def get_centrality(self) -> Dict[str, Any]:
        return self._fallback_store.get_centrality()

    def get_entity_profile(self, entity_id: str) -> Optional[Dict[str, Any]]:
        return self._fallback_store.get_entity_profile(entity_id)

    def get_entity_priority(self, entity_id: str) -> Optional[Dict[str, Any]]:
        return self._fallback_store.get_entity_priority(entity_id)

    def get_communities(self) -> List[Dict[str, Any]]:
        return self._fallback_store.get_communities()

    def add_nodes(self, nodes: List[Dict[str, Any]]) -> int:
        self._fallback_store.add_nodes(nodes)
        if MemgraphClient.verify_connectivity():
            try:
                # Dynamic cypher insert for memgraph
                query = """
                UNWIND $nodes AS n
                MERGE (e:Entity {id: n.id})
                SET e += n
                """
                MemgraphClient.run_query(query, {"nodes": nodes})
            except Exception as e:
                logger.warning("Memgraph node insert warning: %s", e)
        return len(nodes)

    def add_edges(self, edges: List[Dict[str, Any]]) -> int:
        self._fallback_store.add_edges(edges)
        return len(edges)

    def merge_nodes(self, primary_id: str, duplicate_id: str, reason: str = "") -> Dict[str, Any]:
        """
        Merge duplicate node into primary node.
        NOTE: MemgraphStore.merge_nodes against a live Memgraph cluster is experimental / UNTESTED in this environment;
        in DEMO_MODE, LocalFixtureStore provides the fully validated and tested implementation.
        """
        log = self._fallback_store.merge_nodes(primary_id, duplicate_id, reason)
        if MemgraphClient.verify_connectivity():
            try:
                # Untested against live Memgraph cluster
                query = """
                MATCH (p:Entity {id: $primary_id}), (d:Entity {id: $duplicate_id})
                MATCH (d)-[r]->(target)
                CREATE (p)-[r2:LINKED_TO]->(target)
                SET r2 = properties(r)
                DELETE r
                DELETE d
                """
                MemgraphClient.run_query(query, {"primary_id": primary_id, "duplicate_id": duplicate_id})
            except Exception as e:
                logger.warning("Memgraph merge_nodes execution note (untested): %s", e)
        return log

    def split_node(self, merge_log: Dict[str, Any]) -> bool:
        """
        Reverse a node merge.
        NOTE: MemgraphStore.split_node against a live Memgraph cluster is experimental / UNTESTED.
        """
        return self._fallback_store.split_node(merge_log)

    def reset_to_fixtures(self) -> None:
        """Reset graph store to canonical fixtures."""
        self._fallback_store.reset_to_fixtures()


_GRAPH_STORE_INSTANCE: Optional[BaseGraphStore] = None


def get_graph_store() -> BaseGraphStore:
    """Return the active singleton GraphStore."""
    global _GRAPH_STORE_INSTANCE
    if _GRAPH_STORE_INSTANCE is None:
        if settings.GRAPH_STORE == "memgraph" and not settings.DEMO_MODE:
            _GRAPH_STORE_INSTANCE = MemgraphStore()
        else:
            _GRAPH_STORE_INSTANCE = LocalFixtureStore()
    return _GRAPH_STORE_INSTANCE
