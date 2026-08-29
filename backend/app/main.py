import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.neo4j_client import Neo4jClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sih-platform")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    logger.info("Starting up AI-Powered Criminal Network Analysis Platform...")
    # Test Neo4j connectivity
    try:
        if Neo4jClient.verify_connectivity():
            logger.info("Neo4j database connection established.")
        else:
            logger.warning("Neo4j database is currently unreachable.")
    except Exception as e:
        logger.warning(f"Neo4j startup check notice: {e}")
    
    yield

    logger.info("Shutting down application...")
    Neo4jClient.close()


app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "title": settings.APP_NAME,
        "version": "0.1.0",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
    }
