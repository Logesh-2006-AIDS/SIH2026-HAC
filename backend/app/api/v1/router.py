from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, ingest, graph

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["System Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(ingest.router, prefix="/ingest", tags=["Data Ingestion"])
api_router.include_router(graph.router, prefix="/graph", tags=["Knowledge Graph Analytics"])
