"""
Database Reset & Seeding Script for Demo Mode
=============================================
Safely reinitializes the SQLite relational database schema and seeds default users.
Run with: python reset_demo_db.py
"""
import sys
import os

# Ensure backend root is on sys.path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db.postgres import Base, engine, SessionLocal
from app.models import User, Case, AuditLog, DataSource, RawEntity, PendingResolution
from app.models.user import UserRole
from app.core.security import get_password_hash
from app.services.graph_store import get_graph_store


def reset_database():
    print("--------------------------------------------------")
    print("Re-initializing SQLite Relational Evidence Store...")
    print("--------------------------------------------------")
    
    # 1. Reset persisted Knowledge Graph fixtures
    get_graph_store().reset_to_fixtures()
    print("[OK] Reset Knowledge Graph to clean canonical fixtures (data/metadata/ground_truth_graph.json)")

    # 2. Drop all existing SQLite tables
    Base.metadata.drop_all(bind=engine)
    # Re-create all tables with updated schema
    Base.metadata.create_all(bind=engine)
    print("[OK] Created tables: users, cases, audit_logs, data_sources, raw_entities, pending_resolutions")

    db = SessionLocal()
    try:
        # Seed standard role accounts with both .gov.in domains
        users = [
            # Standard SIH login credentials
            User(
                email="admin@sih.gov.in",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin Director Sharma",
                badge_number="DL-ADM-001",
                role=UserRole.ADMIN,
                department="Special Cell Headquarters",
                is_active=True,
            ),
            User(
                email="investigator@sih.gov.in",
                hashed_password=get_password_hash("investigator123"),
                full_name="Inspector Rajesh Verma",
                badge_number="DL-INV-001",
                role=UserRole.INVESTIGATOR,
                department="Cyber Crime PS East",
                is_active=True,
            ),
            User(
                email="analyst@sih.gov.in",
                hashed_password=get_password_hash("analyst123"),
                full_name="Analyst Priya Sen",
                badge_number="DL-ANL-101",
                role=UserRole.ANALYST,
                department="Crime Intelligence Unit",
                is_active=True,
            ),
            # Police.gov.in aliases
            User(
                email="admin@police.gov.in",
                hashed_password=get_password_hash("Admin@123"),
                full_name="Admin Director Sharma",
                badge_number="DL-ADM-002",
                role=UserRole.ADMIN,
                department="Special Cell Headquarters",
                is_active=True,
            ),
            User(
                email="investigator@police.gov.in",
                hashed_password=get_password_hash("Invest@123"),
                full_name="Inspector Rajesh Verma",
                badge_number="DL-INV-002",
                role=UserRole.INVESTIGATOR,
                department="Cyber Crime PS East",
                is_active=True,
            ),
            User(
                email="analyst@police.gov.in",
                hashed_password=get_password_hash("Analyst@123"),
                full_name="Analyst Priya Sen",
                badge_number="DL-ANL-102",
                role=UserRole.ANALYST,
                department="Crime Intelligence Unit",
                is_active=True,
            ),
        ]
        db.add_all(users)

        # Seed initial pending resolution candidates (with strong corroboration signals)
        candidates = [
            PendingResolution(
                node_a_id="PERSON-001",
                node_b_id="RK-001",
                node_a_name="Ravi Kumar",
                node_b_name="R. Kumar (alias RK)",
                entity_type="Person",
                similarity_score=0.91,
                match_reason="Name similarity 91.0% + Shared Phone: +91-98110-44501",
                signals=["Shared Phone: +91-98110-44501", "Shared Case(s) (Info only): CASE-101"],
                status="PENDING",
            ),
            PendingResolution(
                node_a_id="PERSON-002",
                node_b_id="VICKY-002",
                node_a_name="Vikram Singh",
                node_b_name="Vicky (Logistics)",
                entity_type="Person",
                similarity_score=0.94,
                match_reason="Name similarity 88.0% + Shared Vehicle: DL-01-AB-1234",
                signals=["Shared Vehicle: DL-01-AB-1234", "Shared Phone: +91-98765-43210"],
                status="PENDING",
            ),
            PendingResolution(
                node_a_id="ORG-001",
                node_b_id="ORG-002",
                node_a_name="Apex Global Logistics",
                node_b_name="Apex Logistics HQ",
                entity_type="Organization",
                similarity_score=0.96,
                match_reason="Name similarity 96.0% + Shared Bank Account: 112233445566778",
                signals=["Shared Bank Account: 112233445566778"],
                status="PENDING",
            ),
        ]
        db.add_all(candidates)
        db.commit()

        print("[OK] Seeded demo accounts for Admin, Investigator, Analyst")
        print("[OK] Seeded pending entity resolution review records")
        print("--------------------------------------------------")
        print("Demo database & graph state reset successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    reset_database()
