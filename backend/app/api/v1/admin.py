"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Admin Control, System Diagnostics & Dataset Seeding Endpoints
"""
import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, CaseFile, ExtractedEntityRecord, ExtractedRelationRecord, AuditLog
from app.db.neo4j_client import neo4j_client
from app.services.ingestion import ingestion_service
from app.services.stitch_service import stitch_service
from app.schemas.schemas import AuditLogResponse
from app.core.config import settings

router = APIRouter()

@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    """Health check for all services (FastAPI, SQLite/Postgres, Neo4j, Storage)."""
    cases_count = db.query(CaseFile).count()
    entities_count = db.query(ExtractedEntityRecord).count()
    users_count = db.query(User).count()
    graph_data = neo4j_client.get_full_graph()

    return {
        "system_status": "ONLINE",
        "database": {
            "type": "SQLite / PostgreSQL",
            "status": "HEALTHY",
            "total_cases": cases_count,
            "total_db_entities": entities_count,
            "total_users": users_count
        },
        "neo4j_graph": {
            "status": "CONNECTED" if neo4j_client.is_connected else "ACTIVE (In-Memory Resilient Mode)",
            "is_live_neo4j": neo4j_client.is_connected,
            "total_nodes": len(graph_data["nodes"]),
            "total_edges": len(graph_data["edges"]),
            "engine": graph_data.get("engine", "In-Memory")
        },
        "storage": {
            "status": "HEALTHY",
            "upload_dir": settings.UPLOAD_DIR,
            "dataset_dir": settings.DATASET_DIR
        },
        "stitch_api": stitch_service.get_status()
    }

@router.post("/seed-dataset")
def seed_dataset(db: Session = Depends(get_db)):
    """Triggers the ingestion of all 9 CSV dataset files."""
    result = ingestion_service.seed_dataset_csvs(db)
    # Log audit
    audit = AuditLog(
        username="admin",
        role="admin",
        action="SEED_DATASET",
        resource="SIH Investigation CSV Database"
    )
    db.add(audit)
    db.commit()
    return result

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieves recent system audit logs."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs

@router.post("/reset-graph")
def reset_graph(db: Session = Depends(get_db)):
    """Resets the Knowledge Graph for a clean state."""
    neo4j_client.clear_database()
    return {"status": "SUCCESS", "message": "Knowledge Graph wiped clean."}
