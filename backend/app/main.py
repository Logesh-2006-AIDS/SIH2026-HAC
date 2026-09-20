import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.init_db import init_postgres
from app.db.neo4j_client import MemgraphClient

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
        logger.warning("PostgreSQL schema initialization: %s", e)
    try:
        if MemgraphClient.verify_connectivity():
            logger.info("Memgraph connection established.")
        else:
            logger.warning("Memgraph unreachable — operating with local JSON graph fallback.")
    except Exception as e:
        logger.warning("Memgraph startup check: %s", e)

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
    return {
        "title": settings.APP_NAME,
        "version": "0.2.0",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
        "graph_store": "memgraph",
    }
