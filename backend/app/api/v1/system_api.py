"""
SIH 2026: AI Criminal Network Investigation Platform
User Management & Settings API Endpoints
"""
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter()

USERS_LIST = [
    {"id": 1, "username": "admin", "full_name": "Chief Administrator Sharma", "role": "Admin", "badge": "POL-HQ-01", "email": "admin@police.gov.in", "status": "ACTIVE", "last_active": "Just now"},
    {"id": 2, "username": "investigator", "full_name": "Senior IO Rajesh Varma", "role": "Investigator", "badge": "POL-IO-44", "email": "rajesh.io@delhipolice.gov.in", "status": "ACTIVE", "last_active": "5 mins ago"},
    {"id": 3, "username": "analyst", "full_name": "Intelligence Analyst Priya Sen", "role": "Analyst", "badge": "POL-INT-12", "email": "priya.intel@police.gov.in", "status": "ACTIVE", "last_active": "12 mins ago"},
    {"id": 4, "username": "viewer", "full_name": "Judicial Officer K. Raman", "role": "Viewer", "badge": "JUD-DEL-09", "email": "raman.court@judiciary.gov.in", "status": "ACTIVE", "last_active": "2 hours ago"}
]

@router.get("/users")
def get_all_users():
    return USERS_LIST

@router.get("/settings")
def get_system_settings():
    return {
        "security": {
            "jwt_expiry_hours": 24,
            "two_factor_auth": True,
            "session_idle_timeout_mins": 30,
            "tamper_evident_hashing": "SHA-256 Mandatory"
        },
        "interface": {
            "theme": "Investigation Dark (Charcoal/Cyan)",
            "graph_render_engine": "Cytoscape.js + CoSE-Bilkent",
            "auto_refresh_sec": 15
        },
        "nlp_thresholds": {
            "entity_confidence_threshold": 0.85,
            "relationship_threshold": 0.80,
            "auto_verification": False
        }
    }
