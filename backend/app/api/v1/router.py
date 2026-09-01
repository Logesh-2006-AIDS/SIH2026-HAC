from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, ingest, graph, cases, leads, audit

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["System Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(ingest.router, prefix="/ingest", tags=["Data Ingestion"])
api_router.include_router(graph.router, prefix="/graph", tags=["Knowledge Graph Analytics"])
api_router.include_router(cases.router, prefix="/cases", tags=["Case Master Dossiers"])
api_router.include_router(leads.router, prefix="/leads", tags=["Lead Verification & HITL"])
api_router.include_router(audit.router, prefix="/audit", tags=["Tamper-Evident Audit Trail"])
