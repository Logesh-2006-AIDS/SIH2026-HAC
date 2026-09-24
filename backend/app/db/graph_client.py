"""
Memgraph graph database client (Bolt protocol).
Connects to Memgraph when running; provides clean connectivity check.
"""
import logging
from typing import Any, Dict, List, Optional

from neo4j import GraphDatabase, Driver

from app.core.config import settings

logger = logging.getLogger(__name__)


class MemgraphClient:
    """Singleton Memgraph client over Bolt protocol."""

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
                    connection_acquisition_timeout=2,
                    connection_timeout=2,
                )
                logger.info("Connected to Memgraph at %s", uri)
            except Exception as e:
                logger.error("Failed to connect to Memgraph at %s: %s", uri, e)
                raise
        return cls._driver

    @classmethod
    def close(cls):
        if cls._driver is not None:
            try:
                cls._driver.close()
            except Exception:
                pass
            cls._driver = None
            logger.info("Memgraph driver closed.")

    @classmethod
    def verify_connectivity(cls) -> bool:
        if settings.GRAPH_STORE == "fixture" and settings.DEMO_MODE:
            return False
        try:
            driver = cls.get_driver()
            driver.verify_connectivity()
            return True
        except Exception as e:
            logger.debug("Memgraph connectivity check: %s", e)
            try:
                if cls._driver is not None:
                    cls._driver.close()
            except Exception:
                pass
            cls._driver = None
            return False

    @classmethod
    def run_query(cls, cypher: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute Cypher against Memgraph."""
        driver = cls.get_driver()
        with driver.session() as session:
            result = session.run(cypher, parameters or {})
            return [record.data() for record in result]


def get_memgraph():
    return MemgraphClient
