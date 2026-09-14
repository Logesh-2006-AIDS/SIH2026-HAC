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
        else:
            services["memgraph"] = ServiceStatus(
                status="UP",
                details="Memgraph offline — FastAPI serving ground_truth JSON fallback.",
            )
    except Exception:
        services["memgraph"] = ServiceStatus(
            status="UP",
            details="Memgraph offline — FastAPI serving ground_truth JSON fallback.",
        )

    return HealthResponse(
        status=overall_status,
        version="0.2.0",
        environment=settings.APP_ENV,
        services=services,
    )
