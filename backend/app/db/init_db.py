import logging
from app.db.postgres import Base, engine
from app.db.graph_client import MemgraphClient
from app.models import User, Case, AuditLog, DataSource, DataSourceType, IngestStatus, RawEntity, PendingResolution  # noqa: F401
from app.models.integrity import IntegrityAnchor, CustodyEvent  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


from sqlalchemy import text


def init_postgres():
    """Create all relational tables and ensure newly added columns exist in SQLite or PostgreSQL."""
    logger.info("Initializing relational schema...")
    Base.metadata.create_all(bind=engine)

    # Safe migration for newly added columns in existing local SQLite databases
    with engine.connect() as conn:
        for table, col, col_type in [
            ("audit_logs", "previous_hash", "VARCHAR(64)"),
            ("audit_logs", "entry_hash", "VARCHAR(64)"),
            ("data_sources", "authorization_reference", "VARCHAR(500)"),
        ]:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                conn.commit()
                logger.info(f"Added missing column {table}.{col}")
            except Exception:
                pass  # Column already exists
    logger.info("Relational schema initialization complete.")


def init_memgraph():
    """Create indexes/constraints in Memgraph if running."""
    logger.info("Initializing Memgraph schema...")
    if not MemgraphClient.verify_connectivity():
        logger.info("Memgraph not active — operating with LocalFixtureStore.")
        return

    statements = [
        "CREATE INDEX ON :Entity(id);",
        "CREATE INDEX ON :Person(id);",
        "CREATE INDEX ON :Person(name);",
        "CREATE INDEX ON :Phone(number);",
        "CREATE INDEX ON :Case(id);",
        "CREATE INDEX ON :Organization(id);",
        "CREATE INDEX ON :Location(id);",
        "CREATE INDEX ON :Vehicle(id);",
        "CREATE INDEX ON :FinancialAccount(id);",
    ]

    for stmt in statements:
        try:
            MemgraphClient.run_query(stmt)
            logger.info("Executed Memgraph DDL: %s", stmt[:50])
        except Exception as e:
            logger.debug("Memgraph DDL note: %s", e)

    logger.info("Memgraph schema initialization complete.")


def init_all():
    init_postgres()
    init_memgraph()


if __name__ == "__main__":
    init_all()
