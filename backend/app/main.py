"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
FastAPI Application Entrypoint
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.db.session import engine, Base
from app.api.v1 import auth, cases, graph, nlp_router, admin, analytics, map_router, leads, overview, cross_case, copilot, system_api, reports

# Create SQLite / PostgreSQL tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Unified AI Intelligence Platform for Criminal Investigation, NLP Entity Extraction, and Neo4j Graph Analytics"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication & RBAC"])
app.include_router(overview.router, prefix=f"{settings.API_V1_STR}/overview", tags=["Overview Dashboard"])
app.include_router(cases.router, prefix=f"{settings.API_V1_STR}/cases", tags=["FIR Case Management"])
app.include_router(graph.router, prefix=f"{settings.API_V1_STR}/graph", tags=["Knowledge Graph"])
app.include_router(nlp_router.router, prefix=f"{settings.API_V1_STR}/nlp", tags=["NLP Engine"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Graph Analytics"])
app.include_router(cross_case.router, prefix=f"{settings.API_V1_STR}/cross-case", tags=["Cross-Case Intelligence"])
app.include_router(copilot.router, prefix=f"{settings.API_V1_STR}/copilot", tags=["AI Copilot Assistant"])
app.include_router(leads.router, prefix=f"{settings.API_V1_STR}/leads", tags=["Lead Verification"])
app.include_router(map_router.router, prefix=f"{settings.API_V1_STR}/map", tags=["Crime Map"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin & Diagnostics"])
app.include_router(system_api.router, prefix=f"{settings.API_V1_STR}/system", tags=["Users & Settings"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Judicial Intelligence Reports"])


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": "2.0.0",
        "docs": "/docs",
        "status": "OPERATIONAL"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
