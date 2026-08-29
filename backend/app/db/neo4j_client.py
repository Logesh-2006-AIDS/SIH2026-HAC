import logging
from typing import Any, Dict, List, Optional
from neo4j import GraphDatabase, Driver
from app.core.config import settings

logger = logging.getLogger(__name__)


class Neo4jClient:
    """Singleton Neo4j database client manager."""

    _driver: Optional[Driver] = None

    @classmethod
    def get_driver(cls) -> Driver:
        if cls._driver is None:
            try:
                cls._driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                    max_connection_lifetime=30 * 60,
                    max_connection_pool_size=50,
                    connection_acquisition_timeout=2 * 60,
                )
                logger.info("Connected to Neo4j graph database.")
            except Exception as e:
                logger.error(f"Failed to connect to Neo4j at {settings.NEO4J_URI}: {e}")
                raise e
        return cls._driver

    @classmethod
    def close(cls):
        if cls._driver is not None:
            cls._driver.close()
            cls._driver = None
            logger.info("Neo4j driver connection closed.")

    @classmethod
    def verify_connectivity(cls) -> bool:
        """Verify that the Neo4j cluster/instance is reachable and authenticated."""
        try:
            driver = cls.get_driver()
            driver.verify_connectivity()
            return True
        except Exception as e:
            logger.warning(f"Neo4j connectivity check failed: {e}")
            return False

    @classmethod
    def run_query(cls, cypher: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Run a Cypher read/write query and return records as dictionaries."""
        driver = cls.get_driver()
        with driver.session(database=settings.NEO4J_DATABASE) as session:
            result = session.run(cypher, parameters or {})
            return [record.data() for record in result]


def get_neo4j():
    """Dependency helper to get active Neo4j client."""
    return Neo4jClient
