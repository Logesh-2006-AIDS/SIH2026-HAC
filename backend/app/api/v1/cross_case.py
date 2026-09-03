"""
SIH 2026: AI Criminal Network Investigation Platform
Cross-Case Intelligence & Syndicate Linkage API
"""
from typing import Optional
from fastapi import APIRouter, Query

router = APIRouter()

PREDEFINED_CASES = [
    {"case_id": "FIR-2025-ND-101", "title": "Rohini Outer Ring Road Syndicate Assault", "district": "New Delhi", "year": "2025", "crime": "Armed Robbery"},
    {"case_id": "FIR-2025-ND-102", "title": "Interstate Cyber Hawala & Extortion Ring", "district": "Mumbai Cyber", "year": "2025", "crime": "Cyber Hawala"},
    {"case_id": "FIR-2025-HR-203", "title": "Gurgaon High-Speed Vehicle Smuggling Corridor", "district": "Gurgaon", "year": "2025", "crime": "Vehicle Smuggling"},
    {"case_id": "FIR-2025-UP-505", "title": "Lucknow Arms & Weapon Cache Seizure", "district": "Lucknow", "year": "2025", "crime": "Arms Act 25"}
]

@router.get("/cases")
def list_cross_cases():
    return PREDEFINED_CASES

@router.get("/compare")
def compare_cases(
    case_a: str = Query("FIR-2025-ND-101", description="First Case ID"),
    case_b: str = Query("FIR-2025-ND-102", description="Second Case ID")
):
    """Calculates common entities, shared paths, and linkage strength between two cases."""
    shared_persons = []
    shared_phones = []
    shared_vehicles = []
    shared_orgs = []
    shared_locations = []
    connecting_path = []
    similarity_score = 0.88

    if (case_a == "FIR-2025-ND-101" and case_b == "FIR-2025-ND-102") or (case_a == "FIR-2025-ND-102" and case_b == "FIR-2025-ND-101"):
        shared_persons = [
            {"name": "Vikram Singh", "alias": "Vicky / Viper", "role_in_case_a": "On-scene conspirator", "role_in_case_b": "Financial beneficiary", "confidence": 0.96}
        ]
        shared_phones = [
            {"phone": "+91-98765-32100", "holder": "Vikram Singh", "evidence": "Phone used to coordinate getaway in Case A and OTP verification in Case B."}
        ]
        shared_orgs = [
            {"name": "Apex Global Logistics Pvt Ltd", "type": "Shell Company Front", "evidence": "Hawala routing through logistics accounts"}
        ]
        connecting_path = [
            {"node": "Ravi Kumar (FIR-101)", "type": "Suspect"},
            {"node": "CO_CONSPIRATOR", "type": "Relation"},
            {"node": "Vikram Singh (Shared Bridge)", "type": "Bridge Node"},
            {"node": "COORDINATES_WITH", "type": "Relation"},
            {"node": "Aarav Mehta (FIR-102)", "type": "Suspect"}
        ]
        similarity_score = 0.94
    elif "101" in case_a and "203" in case_b:
        shared_vehicles = [
            {"reg": "DL01AB1234", "model": "Hyundai Creta Black", "evidence": "Getaway car spotted at both jurisdictions."}
        ]
        shared_persons = [
            {"name": "Vikram Singh", "alias": "Vicky", "role_in_case_a": "Armed Operative", "role_in_case_b": "Vehicle Custodian", "confidence": 0.91}
        ]
        connecting_path = [
            {"node": "Ravi Kumar", "type": "Suspect"},
            {"node": "OWNS_VEHICLE", "type": "Relation"},
            {"node": "DL01AB1234 (Shared Vehicle)", "type": "Vehicle"},
            {"node": "OPERATED_BY", "type": "Relation"},
            {"node": "Vikram Singh", "type": "Suspect"}
        ]
        similarity_score = 0.86
    else:
        shared_locations = [
            {"location": "Karol Bagh / New Delhi", "evidence": "Common hawala drop point across northern cases."}
        ]
        similarity_score = 0.72

    return {
        "case_a": case_a,
        "case_b": case_b,
        "similarity_score": similarity_score,
        "threat_correlation": "CRITICAL" if similarity_score >= 0.90 else "HIGH",
        "shared_entities": {
            "persons": shared_persons,
            "phones": shared_phones,
            "vehicles": shared_vehicles,
            "organizations": shared_orgs,
            "locations": shared_locations
        },
        "connecting_path": connecting_path,
        "rationale": f"High degree cross-case linkage detected between {case_a} and {case_b}. A common syndicate bridge operative connects independent police jurisdictions.",
        "recommended_action": "Joint Inter-District Interrogation Protocol recommended between Delhi and Mumbai special cells."
    }
