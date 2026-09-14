"""
Memgraph graph database client (Bolt protocol).

Memgraph speaks Bolt; we use the official Bolt driver.
When Memgraph is unreachable, graph analytics fall back to
ground_truth JSON — no Docker / Neo4j required for local demo.
"""
import logging
from typing import Any, Dict, List, Optional

from neo4j import GraphDatabase, Driver

from app.core.config import settings

logger = logging.getLogger(__name__)


class MemgraphClient:
    """Singleton Memgraph client over Bolt."""

    _driver: Optional[Driver] = None

    @classmethod
    def get_driver(cls) -> Driver:
        if cls._driver is None:
            uri = settings.MEMGRAPH_URI
            user = settings.MEMGRAPH_USER or ""
            password = settings.MEMGRAPH_PASSWORD or ""
            auth = (user, password) if user else None
            try:
                cls._driver = GraphDatabase.driver(
                    uri,
                    auth=auth,
                    max_connection_lifetime=30 * 60,
                    max_connection_pool_size=50,
                    connection_acquisition_timeout=10,
                )
                logger.info("Connected to Memgraph at %s", uri)
            except Exception as e:
                logger.error("Failed to connect to Memgraph at %s: %s", uri, e)
                raise
        return cls._driver

    @classmethod
    def close(cls):
        if cls._driver is not None:
            cls._driver.close()
            cls._driver = None
            logger.info("Memgraph driver closed.")

    @classmethod
    def verify_connectivity(cls) -> bool:
        try:
            driver = cls.get_driver()
            driver.verify_connectivity()
            return True
        except Exception as e:
            logger.warning("Memgraph connectivity check failed: %s", e)
            # Reset driver so next attempt can reconnect
            try:
                if cls._driver is not None:
                    cls._driver.close()
            except Exception:
                pass
            cls._driver = None
            return False

    @classmethod
    def run_query(cls, cypher: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute Cypher against Memgraph. No named database (Memgraph default)."""
        driver = cls.get_driver()
        with driver.session() as session:
            result = session.run(cypher, parameters or {})
            return [record.data() for record in result]


# Backward-compatible alias used across existing modules
Neo4jClient = MemgraphClient


def get_memgraph():
    return MemgraphClient
