import os
import sys
import json
from datetime import datetime, timezone

# Ensure root backend dir is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.postgres import SessionLocal, engine, Base
import app.models
from app.models.user import User, UserRole
from app.models.case import Case, CaseStatus, CasePriority
from app.models.ingestion import DataSource, DataSourceType, IngestStatus, RawEntity, PendingResolution
from app.models.audit import AuditLog
from app.db.neo4j_client import Neo4jClient
from app.services import graph_builder

def seed_database():
    print("=== SEEDING SIH 2026 DATABASE ===")
    
    # 1. Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 2. Seed Default Users
        if db.query(User).count() == 0:
            print("Seeding default RBAC Users...")
            users = [
                User(
                    email="admin@sih2026.gov.in",
                    badge_number="ADM-001",
                    full_name="Chief Admin",
                    department="Cyber Crime Command",
                    hashed_password="hashed_placeholder",
                    role=UserRole.ADMIN,
                    is_superuser=True
                ),
                User(
                    email="investigator@sih2026.gov.in",
                    badge_number="INV-204",
                    full_name="Inspector Rajesh Sharma",
                    department="Special Cell - Organized Crime",
                    hashed_password="hashed_placeholder",
                    role=UserRole.INVESTIGATOR,
                    is_active=True
                ),
                User(
                    email="analyst@sih2026.gov.in",
                    badge_number="ANL-109",
                    full_name="Dr. Ananya Roy",
                    department="Intelligence & Analytics Bureau",
                    hashed_password="hashed_placeholder",
                    role=UserRole.ANALYST,
                    is_active=True
                )
            ]
            db.add_all(users)
            db.commit()
            print("Default users seeded.")

        # 3. Seed Cases
        if db.query(Case).count() == 0:
            print("Seeding FIR Cases...")
            cases_data = [
                {
                    "case_number": "101",
                    "title": "FIR 101/2025: Extortion & Protection Money Syndicate",
                    "description": "Extortion racket targeting South Delhi businessmen. Demands made via VoIP calls and messenger apps. Money routed through shell companies.",
                    "crime_category": "Extortion / Organized Crime",
                    "jurisdiction": "New Delhi - Special Cell",
                    "status": CaseStatus.UNDER_INVESTIGATION,
                    "priority": CasePriority.HIGH
                },
                {
                    "case_number": "102",
                    "title": "FIR 102/2025: Crypto Layering & Cyber Fraud Racket",
                    "description": "Phishing & investment fraud ring operating across Gurgaon and Noida. Illegal funds converted to USDT and laundered through P2P exchanges.",
                    "crime_category": "Cyber Crime / Financial Fraud",
                    "jurisdiction": "NCR Cyber Cell",
                    "status": CaseStatus.UNDER_INVESTIGATION,
                    "priority": CasePriority.CRITICAL
                },
                {
                    "case_number": "103",
                    "title": "FIR 103/2025: Illegal Arms Trafficking Corridor",
                    "description": "Interstate illegal weapons movement into NCR. Cross-border smuggling syndicate operating safehouses in UP and Haryana.",
                    "crime_category": "Arms Trafficking",
                    "jurisdiction": "Special Task Force",
                    "status": CaseStatus.UNDER_INVESTIGATION,
                    "priority": CasePriority.CRITICAL
                },
                {
                    "case_number": "104",
                    "title": "FIR 104/2025: Luxury Vehicle Theft & Identity Forgery",
                    "description": "Interstate gang stealing high-end SUVs, altering chassis numbers, and reselling with forged registration papers across North India.",
                    "crime_category": "Vehicle Theft / Forgery",
                    "jurisdiction": "Crime Branch",
                    "status": CaseStatus.OPEN,
                    "priority": CasePriority.MEDIUM
                },
                {
                    "case_number": "105",
                    "title": "FIR 105/2025: Multi-State Hawala Money Laundering Syndicate",
                    "description": "Unaccounted cash transfers operating through angadia network in Chandni Chowk & Zaveri Bazaar. Connects extortion proceeds to shell accounts.",
                    "crime_category": "Hawala / Financial Crime",
                    "jurisdiction": "Economic Offences Wing",
                    "status": CaseStatus.UNDER_INVESTIGATION,
                    "priority": CasePriority.HIGH
                }
            ]
            for c_data in cases_data:
                c = Case(**c_data)
                db.add(c)
            db.commit()
            print("5 Primary FIR Cases seeded.")

        # 4. Try Seeding Neo4j Knowledge Graph
        try:
            print("Attempting to seed Neo4j graph...")
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            project_dir = os.path.dirname(backend_dir)
            data_dir = os.path.join(project_dir, "data")
            
            if Neo4jClient.verify_connectivity():
                stats = graph_builder.build_graph_from_synthetic_data(data_dir)
                print("Neo4j Graph successfully seeded:", stats)
            else:
                print("Neo4j connection test failed. Graph fallback mode active.")
        except Exception as e:
            print("Neo4j seeding notice (will fallback seamlessly):", e)

        print("=== DATABASE SEED COMPLETE ===")

    except Exception as e:
        db.rollback()
        print("Error seeding database:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
