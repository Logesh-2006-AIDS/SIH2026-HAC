import logging
from fastapi import APIRouter
from sqlalchemy import text
from app.core.config import settings
from app.db.postgres import SessionLocal
from app.db.graph_client import MemgraphClient
from app.services.graph_store import get_graph_store
from app.schemas.health import HealthResponse, ServiceStatus

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=HealthResponse, summary="System Health & Database Status")
def check_health() -> HealthResponse:
    services = {}
    overall_status = "healthy"
    store = get_graph_store()
    stats = store.get_stats()

    # 1. API Status
    services["api"] = ServiceStatus(status="UP", details="FastAPI core API active.")

    # 2. Relational Evidence Store (SQLite / PostgreSQL)
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_type = "SQLite" if "sqlite" in settings.SQLALCHEMY_DATABASE_URI else "PostgreSQL"
        services["evidence_store"] = ServiceStatus(
            status="UP",
            details=f"{db_type} evidence and audit store connected.",
        )
    except Exception as e:
        logger.warning("Evidence store health check failed: %s", e)
        services["evidence_store"] = ServiceStatus(status="DOWN", details=f"Unavailable: {str(e)}")
        overall_status = "degraded"

    # 3. Knowledge Graph Store
    if stats.get("is_live"):
        services["graph_store"] = ServiceStatus(
            status="UP",
            details=f"Live Memgraph active ({stats.get('node_count', 0)} nodes, {stats.get('edge_count', 0)} edges).",
        )
        data_mode = "LIVE_MEMGRAPH"
    else:
        services["graph_store"] = ServiceStatus(
            status="UP",
            details=f"LocalFixtureStore active ({stats.get('node_count', 0)} nodes, {stats.get('edge_count', 0)} edges).",
        )
        data_mode = "DEMO_MODE"

    services["data_mode"] = ServiceStatus(
        status="UP",
        details=data_mode,
    )

    return HealthResponse(
        status=overall_status,
        version="1.0.0",
        environment=settings.APP_ENV,
        services=services,
    )
