"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Neo4j Graph Database Client with Resilient In-Memory Fallback Engine
"""
from typing import List, Dict, Any, Optional
import os
import logging

logger = logging.getLogger("neo4j_client")

# In-Memory fallback store
class InMemoryGraphStore:
    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.edges: List[Dict[str, Any]] = []

    def merge_node(self, node_id: str, label: str, properties: Dict[str, Any]):
        props = properties.copy()
        props["id"] = node_id
        props["label"] = label
        if node_id in self.nodes:
            self.nodes[node_id].update(props)
        else:
            self.nodes[node_id] = props

    def merge_relationship(self, source_id: str, rel_type: str, target_id: str, properties: Dict[str, Any] = None):
        props = properties or {}
        # Avoid duplicate edges
        for edge in self.edges:
            if edge["source"] == source_id and edge["target"] == target_id and edge["type"] == rel_type:
                edge["properties"].update(props)
                return
        self.edges.append({
            "source": source_id,
            "target": target_id,
            "type": rel_type,
            "properties": props
        })

    def get_graph(self) -> Dict[str, Any]:
        node_list = list(self.nodes.values())
        return {
            "nodes": node_list,
            "edges": self.edges,
            "stats": {
                "total_nodes": len(node_list),
                "total_edges": len(self.edges)
            }
        }

    def clear(self):
        self.nodes.clear()
        self.edges.clear()


class Neo4jClient:
    def __init__(self):
        self.driver = None
        self.is_connected = False
        self.fallback = InMemoryGraphStore()
        self.connect()

    def connect(self):
        try:
            from neo4j import GraphDatabase
            from app.core.config import settings
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
            # Verify connectivity
            self.driver.verify_connectivity()
            self.is_connected = True
            logger.info("Connected successfully to live Neo4j database.")
        except Exception as e:
            self.is_connected = False
            self.driver = None
            logger.warning(f"Neo4j live connection unavailable ({e}). Using resilient In-Memory Graph Engine.")

    def close(self):
        if self.driver:
            self.driver.close()

    def add_node(self, node_id: str, label: str, properties: Dict[str, Any]):
        """Adds or updates a node in Neo4j and fallback store."""
        self.fallback.merge_node(node_id, label, properties)
        if self.is_connected and self.driver:
            try:
                with self.driver.session() as session:
                    cypher = f"""
                    MERGE (n:{label} {{id: $node_id}})
                    SET n += $props
                    """
                    session.run(cypher, node_id=node_id, props=properties)
            except Exception as e:
                logger.error(f"Error adding node to Neo4j: {e}")

    def add_relationship(self, source_id: str, source_label: str, rel_type: str, target_id: str, target_label: str, properties: Dict[str, Any] = None):
        """Adds or updates a relationship in Neo4j and fallback store."""
        props = properties or {}
        # Ensure source and target nodes exist in fallback
        if source_id not in self.fallback.nodes:
            self.fallback.merge_node(source_id, source_label, {"name": source_id})
        if target_id not in self.fallback.nodes:
            self.fallback.merge_node(target_id, target_label, {"name": target_id})

        self.fallback.merge_relationship(source_id, rel_type, target_id, props)

        if self.is_connected and self.driver:
            try:
                with self.driver.session() as session:
                    cypher = f"""
                    MERGE (a:{source_label} {{id: $source_id}})
                    MERGE (b:{target_label} {{id: $target_id}})
                    MERGE (a)-[r:{rel_type}]->(b)
                    SET r += $props
                    """
                    session.run(cypher, source_id=source_id, target_id=target_id, props=props)
            except Exception as e:
                logger.error(f"Error adding relationship to Neo4j: {e}")

    def get_full_graph(self) -> Dict[str, Any]:
        """Returns the full knowledge graph nodes & edges."""
        if self.is_connected and self.driver:
            try:
                with self.driver.session() as session:
                    result = session.run("""
                    MATCH (n)
                    OPTIONAL MATCH (n)-[r]->(m)
                    RETURN n, r, m
                    """)
                    nodes_dict = {}
                    edges_list = []
                    for record in result:
                        n = record["n"]
                        if n:
                            n_id = n.get("id") or str(n.id)
                            labels = list(n.labels)
                            label = labels[0] if labels else "Entity"
                            props = dict(n)
                            props["id"] = n_id
                            props["label"] = label
                            nodes_dict[n_id] = props

                        r = record["r"]
                        m = record["m"]
                        if r and m:
                            m_id = m.get("id") or str(m.id)
                            edges_list.append({
                                "source": n_id,
                                "target": m_id,
                                "type": r.type,
                                "properties": dict(r)
                            })
                    return {
                        "nodes": list(nodes_dict.values()),
                        "edges": edges_list,
                        "stats": {"total_nodes": len(nodes_dict), "total_edges": len(edges_list)},
                        "engine": "Neo4j Live"
                    }
            except Exception as e:
                logger.warning(f"Error fetching from Neo4j, falling back to in-memory: {e}")

        # Fallback in-memory
        res = self.fallback.get_graph()
        res["engine"] = "In-Memory Graph Engine"
        return res

    def clear_database(self):
        """Clears graph data for fresh dataset seeding."""
        self.fallback.clear()
        if self.is_connected and self.driver:
            try:
                with self.driver.session() as session:
                    session.run("MATCH (n) DETACH DELETE n")
            except Exception as e:
                logger.error(f"Error clearing Neo4j database: {e}")

# Global singleton client
neo4j_client = Neo4jClient()
