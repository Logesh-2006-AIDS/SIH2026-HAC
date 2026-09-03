"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Graph Analytics, Centrality & Syndicate Intelligence Service
"""
from typing import Dict, Any, List, Optional
from collections import defaultdict, deque
from app.db.neo4j_client import neo4j_client

class GraphAnalyticsService:
    """
    Computes graph algorithms:
    1. Betweenness & Degree Centrality (Kingpin & Bridge Suspect Detection)
    2. Shortest Path Linking between two suspects
    3. Community / Criminal Syndicate Cluster Detection
    4. Cross-Case Connection Finder
    """

    def compute_centrality(self) -> List[Dict[str, Any]]:
        graph = neo4j_client.get_full_graph()
        nodes = graph["nodes"]
        edges = graph["edges"]

        if not nodes:
            return []

        # Degree calculation
        degrees = defaultdict(int)
        adjacency = defaultdict(list)

        for edge in edges:
            s = edge["source"]
            t = edge["target"]
            degrees[s] += 1
            degrees[t] += 1
            adjacency[s].append(t)
            adjacency[t].append(s)

        # Approximate Betweenness Centrality (Brandes-style or shortest paths passes)
        betweenness = defaultdict(float)
        node_ids = list({n["id"] for n in nodes})

        for s in node_ids:
            # BFS for shortest paths
            queue = deque([s])
            dist = {s: 0}
            preds = defaultdict(list)
            sigma = defaultdict(int)
            sigma[s] = 1
            order = []

            while queue:
                v = queue.popleft()
                order.append(v)
                for w in adjacency[v]:
                    if w not in dist:
                        dist[w] = dist[v] + 1
                        queue.append(w)
                    if dist[w] == dist[v] + 1:
                        sigma[w] += sigma[v]
                        preds[w].append(v)

            delta = defaultdict(float)
            while order:
                w = order.pop()
                for v in preds[w]:
                    delta[v] += (sigma[v] / max(1, sigma[w])) * (1 + delta[w])
                if w != s:
                    betweenness[w] += delta[w]

        # Combine results
        max_deg = max(degrees.values()) if degrees else 1
        max_bet = max(betweenness.values()) if betweenness else 1

        ranked = []
        for n in nodes:
            n_id = n["id"]
            deg_score = round(degrees[n_id] / max_deg, 3) if max_deg > 0 else 0
            bet_score = round(betweenness[n_id] / max_bet, 3) if max_bet > 0 else 0
            # Composite threat index
            threat_index = round((deg_score * 0.4) + (bet_score * 0.6) * 100, 1)

            # Role hypothesis
            role_hypothesis = "Key Orchestrator / Kingpin" if bet_score > 0.6 else ("Direct Associate / Mule" if deg_score > 0.4 else "Network Node")

            ranked.append({
                "id": n_id,
                "name": n.get("name", n_id),
                "label": n.get("label", "Entity"),
                "degree_connections": degrees[n_id],
                "betweenness_centrality": bet_score,
                "threat_index": threat_index,
                "role_hypothesis": role_hypothesis,
                "aliases": n.get("aliases", [])
            })

        # Sort by threat index
        ranked.sort(key=lambda x: x["threat_index"], reverse=True)
        return ranked

    def find_shortest_path(self, source_id: str, target_id: str) -> Dict[str, Any]:
        graph = neo4j_client.get_full_graph()
        edges = graph["edges"]

        adjacency = defaultdict(list)
        edge_map = {}
        for edge in edges:
            s, t = edge["source"], edge["target"]
            adjacency[s].append((t, edge))
            adjacency[t].append((s, edge))
            edge_map[(s, t)] = edge
            edge_map[(t, s)] = edge

        # BFS for shortest path
        queue = deque([[source_id]])
        visited = {source_id}

        while queue:
            path = queue.popleft()
            curr = path[-1]
            if curr.lower() == target_id.lower() or curr == target_id:
                path_edges = []
                for i in range(len(path) - 1):
                    pair = (path[i], path[i+1])
                    if pair in edge_map:
                        path_edges.append(edge_map[pair])
                return {
                    "found": True,
                    "degrees_of_separation": len(path) - 1,
                    "path_nodes": path,
                    "path_edges": path_edges
                }
            for neighbor, _ in adjacency[curr]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(path + [neighbor])

        return {
            "found": False,
            "degrees_of_separation": -1,
            "path_nodes": [],
            "path_edges": []
        }

    def detect_syndicates(self) -> List[Dict[str, Any]]:
        """Detects connected criminal sub-graphs / syndicates."""
        graph = neo4j_client.get_full_graph()
        nodes = {n["id"]: n for n in graph["nodes"]}
        edges = graph["edges"]

        adjacency = defaultdict(list)
        for e in edges:
            adjacency[e["source"]].append(e["target"])
            adjacency[e["target"]].append(e["source"])

        visited = set()
        clusters = []
        cluster_id = 1

        for node_id in nodes:
            if node_id not in visited:
                comp = []
                queue = deque([node_id])
                visited.add(node_id)

                while queue:
                    curr = queue.popleft()
                    comp.append(curr)
                    for neighbor in adjacency[curr]:
                        if neighbor not in visited:
                            visited.add(neighbor)
                            queue.append(neighbor)

                if len(comp) >= 2:
                    # Identify members and types
                    members = [nodes[nid] for nid in comp if nid in nodes]
                    suspects = [m for m in members if m.get("label") == "SUSPECT_PERSON"]
                    vehicles = [m for m in members if m.get("label") == "VEHICLE_NUMBER"]
                    phones = [m for m in members if m.get("label") == "PHONE_NUMBER"]

                    syndicate_name = f"Syndicate Cluster #{cluster_id}"
                    for m in members:
                        if m.get("label") == "CRIMINAL_ORGANIZATION":
                            syndicate_name = m.get("name", syndicate_name)
                            break

                    clusters.append({
                        "cluster_id": f"SYN-{cluster_id:03d}",
                        "name": syndicate_name,
                        "total_nodes": len(comp),
                        "suspects_count": len(suspects),
                        "vehicles_count": len(vehicles),
                        "phones_count": len(phones),
                        "threat_level": "HIGH" if len(suspects) >= 3 else "MEDIUM",
                        "members": [m.get("name", m["id"]) for m in members]
                    })
                    cluster_id += 1

        return clusters

# Global singleton
graph_analytics = GraphAnalyticsService()
