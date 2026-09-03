"""
SIH 2026: AI Criminal Network Investigation Platform
Overview Dashboard API Endpoints (KPIs, Crime Trends, Hotspots)
"""
from fastapi import APIRouter
from app.db.neo4j_client import neo4j_client

router = APIRouter()

@router.get("/stats")
def get_overview_stats():
    graph = neo4j_client.get_full_graph()
    nodes = graph["nodes"]
    edges = graph["edges"]

    # Calculate entity counts by label
    persons = [n for n in nodes if n.get("label") in ("SUSPECT_PERSON", "PERSON")]
    orgs = [n for n in nodes if n.get("label") in ("CRIMINAL_ORGANIZATION", "ORGANIZATION")]
    vehicles = [n for n in nodes if n.get("label") == "VEHICLE_NUMBER"]
    phones = [n for n in nodes if n.get("label") == "PHONE_NUMBER"]
    locations = [n for n in nodes if n.get("label") == "LOCATION"]
    firs = [n for n in nodes if n.get("label") == "FIR_RECORD"]

    # High-risk entities (degree >= 3 or specific suspects)
    degrees = {}
    for e in edges:
        degrees[e["source"]] = degrees.get(e["source"], 0) + 1
        degrees[e["target"]] = degrees.get(e["target"], 0) + 1

    high_risk_list = []
    for p in persons:
        name = p.get("name", p["id"])
        deg = degrees.get(p["id"], degrees.get(name, 0))
        threat_score = min(98, 55 + deg * 12)
        high_risk_list.append({
            "id": p["id"],
            "name": name,
            "aliases": p.get("aliases", []),
            "role": p.get("role", "Suspect"),
            "threat_score": threat_score,
            "degree": deg,
            "risk_level": "CRITICAL" if threat_score >= 85 else ("HIGH" if threat_score >= 70 else "MEDIUM")
        })
    high_risk_list.sort(key=lambda x: x["threat_score"], reverse=True)

    return {
        "kpis": {
            "total_cases": len(firs) or 4,
            "total_entities": len(nodes) or 32,
            "persons_count": len(persons) or 10,
            "organizations_count": len(orgs) or 3,
            "vehicles_count": len(vehicles) or 5,
            "phones_count": len(phones) or 8,
            "locations_count": len(locations) or 6,
            "high_risk_count": len([h for h in high_risk_list if h["threat_score"] >= 80]) or 4,
            "pending_leads_count": 5,
            "cross_case_connections": 8
        },
        "crime_trends": [
            {"month": "Oct 2024", "incidents": 18, "resolved": 12},
            {"month": "Nov 2024", "incidents": 24, "resolved": 16},
            {"month": "Dec 2024", "incidents": 31, "resolved": 20},
            {"month": "Jan 2025", "incidents": 29, "resolved": 22},
            {"month": "Feb 2025", "incidents": 42, "resolved": 28},
            {"month": "Mar 2025", "incidents": 38, "resolved": 30}
        ],
        "crime_type_distribution": [
            {"type": "Armed Robbery & Extortion (IPC 392/384)", "count": 14, "percentage": 35},
            {"type": "Cyber Fraud & Hawala (IPC 420/IT Act 66D)", "count": 11, "percentage": 28},
            {"type": "Illegal Arms Smuggling (Arms Act 25)", "count": 8, "percentage": 20},
            {"type": "Contraband Logistics (NDPS Act)", "count": 5, "percentage": 12},
            {"type": "Homicide & Attempt (IPC 302/307)", "count": 2, "percentage": 5}
        ],
        "high_risk_entities": high_risk_list[:5],
        "recent_ai_discoveries": [
            {
                "title": "Cross-Case Bridge Discovered",
                "description": "Vikram Singh linked between Rohini Armed Robbery (FIR-101) and Bandra Cyber Ring (FIR-102).",
                "confidence": 0.94,
                "type": "BRIDGE_DISCOVERY",
                "timestamp": "10 mins ago"
            },
            {
                "title": "Unregistered Getaway Vehicle Linked",
                "description": "DL01AB1234 identified at two distinct crime scenes in Delhi and Gurgaon.",
                "confidence": 0.96,
                "type": "VEHICLE_CORRELATION",
                "timestamp": "25 mins ago"
            },
            {
                "title": "Hawala Remittance Route Mapped",
                "description": "Rs. 45,00,000 trace from Ravi Kumar to Meena Sharma for Kolkata Hawala routing.",
                "confidence": 0.95,
                "type": "FINANCIAL_LINK",
                "timestamp": "1 hour ago"
            }
        ],
        "recent_investigations": [
            {
                "case_id": "FIR-2025-ND-101",
                "title": "Rohini Outer Ring Road Syndicate Assault",
                "fir_number": "FIR-101/2025",
                "date": "2025-02-14",
                "location": "Rohini Sector 7, New Delhi",
                "crime_type": "Armed Robbery & Extortion",
                "status": "UNDER_INVESTIGATION",
                "risk_level": "CRITICAL",
                "linked_entities": 8
            },
            {
                "case_id": "FIR-2025-ND-102",
                "title": "Interstate Cyber Hawala & Extortion Ring",
                "fir_number": "FIR-102/2025",
                "date": "2025-02-20",
                "location": "Bandra West, Mumbai",
                "crime_type": "Cyber Fraud & Laundering",
                "status": "EVIDENCE_REVIEW",
                "risk_level": "HIGH",
                "linked_entities": 7
            },
            {
                "case_id": "FIR-2025-HR-203",
                "title": "Gurgaon High-Speed Vehicle Smuggling Corridor",
                "fir_number": "FIR-203/2025",
                "date": "2025-02-28",
                "location": "MG Road, Gurgaon",
                "crime_type": "Vehicle Theft & Smuggling",
                "status": "LEADS_PENDING",
                "risk_level": "MEDIUM",
                "linked_entities": 5
            }
        ]
    }
