import logging
from app.db.postgres import Base, engine
from app.db.neo4j_client import Neo4jClient
from app.models import User, Case, AuditLog, DataSource, DataSourceType, IngestStatus, RawEntity, PendingResolution  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_postgres():
    """Create all relational tables in PostgreSQL."""
    logger.info("Initializing PostgreSQL schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("PostgreSQL schema initialization complete.")


def init_neo4j():
    """Create constraints and indexes in Neo4j Knowledge Graph."""
    logger.info("Initializing Neo4j graph schema constraints & indexes...")
    if not Neo4jClient.verify_connectivity():
        logger.warning("Neo4j is not reachable. Skipping Neo4j initialization.")
        return

    statements = [
        # Entity Unique Constraints & Indexes
        "CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE",
        "CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE",
        "CREATE CONSTRAINT case_id_unique IF NOT EXISTS FOR (c:Case) REQUIRE c.id IS UNIQUE",
        "CREATE CONSTRAINT phone_number_unique IF NOT EXISTS FOR (ph:Phone) REQUIRE ph.number IS UNIQUE",
        "CREATE CONSTRAINT account_number_unique IF NOT EXISTS FOR (fa:FinancialAccount) REQUIRE fa.account_number IS UNIQUE",
        "CREATE CONSTRAINT org_id_unique IF NOT EXISTS FOR (o:Organization) REQUIRE o.id IS UNIQUE",
        "CREATE CONSTRAINT location_id_unique IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE",
        "CREATE CONSTRAINT vehicle_id_unique IF NOT EXISTS FOR (v:Vehicle) REQUIRE v.reg_number IS UNIQUE",
        
        # Property Indexes for rapid searching
        "CREATE INDEX entity_name_idx IF NOT EXISTS FOR (e:Entity) ON (e.name)",
        "CREATE INDEX case_number_idx IF NOT EXISTS FOR (c:Case) ON (c.case_number)",
    ]

    for stmt in statements:
        try:
            Neo4jClient.run_query(stmt)
            logger.info(f"Executed Neo4j DDL: {stmt[:50]}...")
        except Exception as e:
            logger.warning(f"Neo4j DDL execution note: {e}")

    logger.info("Neo4j graph schema initialization complete.")


def init_all():
    """Initialize both PostgreSQL and Neo4j."""
    init_postgres()
    init_neo4j()


if __name__ == "__main__":
    init_all()
