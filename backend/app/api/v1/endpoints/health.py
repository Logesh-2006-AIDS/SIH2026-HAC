import logging
from fastapi import APIRouter
from sqlalchemy import text
from app.core.config import settings
from app.db.postgres import SessionLocal
from app.db.neo4j_client import Neo4jClient
from app.schemas.health import HealthResponse, ServiceStatus

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=HealthResponse, summary="System Health & Database Status")
def check_health() -> HealthResponse:
    """Verify operational health and database connectivity for PostgreSQL and Neo4j."""
    services = {}
    overall_status = "healthy"

    # Check PostgreSQL
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        services["postgresql"] = ServiceStatus(status="UP", details="Connected to PostgreSQL instance.")
    except Exception as e:
        logger.warning(f"PostgreSQL health check failed: {e}")
        services["postgresql"] = ServiceStatus(status="DOWN", details=f"Unavailable: {str(e)}")
        overall_status = "degraded"

    # Check Neo4j
    try:
        if Neo4jClient.verify_connectivity():
            services["neo4j"] = ServiceStatus(status="UP", details="Connected to Neo4j Graph DB.")
        else:
            services["neo4j"] = ServiceStatus(status="DOWN", details="Neo4j connection test failed.")
            overall_status = "degraded"
    except Exception as e:
        services["neo4j"] = ServiceStatus(status="DOWN", details=f"Unavailable: {str(e)}")
        overall_status = "degraded"

    return HealthResponse(
        status=overall_status,
        version="0.1.0",
        environment=settings.APP_ENV,
        services=services,
    )
