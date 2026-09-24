"""
Forwarding shim for legacy references.
Use app.db.graph_client instead.
"""
from app.db.graph_client import MemgraphClient, get_memgraph

Neo4jClient = MemgraphClient
