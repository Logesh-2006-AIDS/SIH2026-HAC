import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.init_db import init_postgres
from app.db.graph_client import MemgraphClient
from app.services.graph_store import get_graph_store

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sih-platform")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI-Powered Criminal Network Analysis Platform...")
    try:
        init_postgres()
    except Exception as e:
        logger.warning("Database schema initialization: %s", e)

    store = get_graph_store()
    stats = store.get_stats()
    logger.info("Knowledge Graph Store active: %s (%d nodes, %d edges)", stats.get("store"), stats.get("node_count", 0), stats.get("edge_count", 0))

    yield

    logger.info("Shutting down...")
    MemgraphClient.close()


app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

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
    store = get_graph_store()
    stats = store.get_stats()
    return {
        "title": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
        "graph_store": stats.get("store", "LocalFixtureStore"),
        "demo_mode": settings.DEMO_MODE,
    }
