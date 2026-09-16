import logging
from fastapi import APIRouter
from sqlalchemy import text
from app.core.config import settings
from app.db.postgres import SessionLocal
from app.db.neo4j_client import MemgraphClient
from app.schemas.health import HealthResponse, ServiceStatus

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=HealthResponse, summary="System Health & Database Status")
def check_health() -> HealthResponse:
    services = {}
    overall_status = "healthy"
    data_mode = "LIVE"

    # API itself is up if this handler runs
    services["api"] = ServiceStatus(status="UP", details="FastAPI responding.")

    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        services["postgresql"] = ServiceStatus(status="UP", details="Relational store connected.")
    except Exception as e:
        logger.warning("PostgreSQL health check failed: %s", e)
        services["postgresql"] = ServiceStatus(status="DOWN", details=f"Unavailable: {str(e)}")
        overall_status = "degraded"

    try:
        if MemgraphClient.verify_connectivity():
            services["memgraph"] = ServiceStatus(status="UP", details="Connected to Memgraph graph store.")
            data_mode = "LIVE"
        else:
            services["memgraph"] = ServiceStatus(
                status="DOWN",
                details="Memgraph offline — graph analytics using ground_truth JSON fallback.",
            )
            data_mode = "FALLBACK"
            overall_status = "degraded"
    except Exception as e:
        services["memgraph"] = ServiceStatus(
            status="DOWN",
            details=f"Memgraph offline — JSON fallback active ({e}).",
        )
        data_mode = "FALLBACK"
        overall_status = "degraded"

    services["data_mode"] = ServiceStatus(
        status="UP" if data_mode == "LIVE" else "DEGRADED",
        details=("LIVE" if data_mode == "LIVE" else "DEMO / FALLBACK DATA"),
    )

    return HealthResponse(
        status=overall_status,
        version="0.3.0",
        environment=settings.APP_ENV,
        services=services,
    )
