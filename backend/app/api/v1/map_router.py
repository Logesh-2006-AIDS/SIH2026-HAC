"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Geospatial Intelligence & Map API Endpoints
"""
from fastapi import APIRouter

router = APIRouter()

# High-precision Indian state & city crime intelligence data
INDIA_CRIME_HEATMAP = {
    "states": [
        {"state": "Delhi", "code": "DL", "incident_count": 42, "trend": "increasing", "high_risk_gangs": ["Viper Syndicate", "Rohini Ring"], "cx": 390, "cy": 210},
        {"state": "Haryana", "code": "HR", "incident_count": 28, "trend": "moderate", "high_risk_gangs": ["Gurgaon Extortion Cell"], "cx": 370, "cy": 195},
        {"state": "Uttar Pradesh", "code": "UP", "incident_count": 65, "trend": "increasing", "high_risk_gangs": ["Eastern Arms Corridor"], "cx": 430, "cy": 240},
        {"state": "Maharashtra", "code": "MH", "incident_count": 34, "trend": "moderate", "high_risk_gangs": ["Bandra Cyber & Hawala Ring"], "cx": 340, "cy": 370},
        {"state": "Karnataka", "code": "KA", "incident_count": 18, "trend": "stable", "high_risk_gangs": ["Koramangala Crypto Mule Cell"], "cx": 330, "cy": 440},
        {"state": "West Bengal", "code": "WB", "incident_count": 22, "trend": "stable", "high_risk_gangs": ["Salt Lake Hawala Desk"], "cx": 520, "cy": 280},
        {"state": "Gujarat", "code": "GJ", "incident_count": 14, "trend": "decreasing", "high_risk_gangs": ["Satellite Safehouse Logistics"], "cx": 270, "cy": 290}
    ],
    "hotspots": [
        {"id": "HS01", "name": "Rohini Sector 7", "city": "New Delhi", "state": "Delhi", "type": "Armed Robbery & Syndicate Hub", "risk": "CRITICAL", "lat": 28.7145, "lng": 77.1142},
        {"id": "HS02", "name": "MG Road", "city": "Gurgaon", "state": "Haryana", "type": "Interstate Bridge & Vehicle Transit", "risk": "HIGH", "lat": 28.4794, "lng": 77.0801},
        {"id": "HS03", "name": "Bandra West", "city": "Mumbai", "state": "Maharashtra", "type": "Financial Hawala & Cyber Extortion", "risk": "HIGH", "lat": 19.0596, "lng": 72.8295},
        {"id": "HS04", "name": "Karol Bagh", "city": "New Delhi", "state": "Delhi", "type": "Cash Laundering Desk", "risk": "MEDIUM", "lat": 28.6514, "lng": 77.1907},
        {"id": "HS05", "name": "Gomti Nagar", "city": "Lucknow", "state": "Uttar Pradesh", "type": "Illegal Arms Warehouse", "risk": "HIGH", "lat": 26.8524, "lng": 80.9992},
        {"id": "HS06", "name": "Koramangala", "city": "Bengaluru", "state": "Karnataka", "type": "Crypto Mule Node", "risk": "MEDIUM", "lat": 12.9352, "lng": 77.6245}
    ],
    "interstate_corridors": [
        {"from": "New Delhi", "to": "Gurgaon", "activity": "Frequent Getaway & Phone Swapping", "threat": "HIGH"},
        {"from": "New Delhi", "to": "Mumbai", "activity": "Hawala Routing & Crypto Remittance", "threat": "CRITICAL"},
        {"from": "New Delhi", "to": "Lucknow", "activity": "Country-Made Arms Procurement", "threat": "HIGH"}
    ]
}

@router.get("/crime-summary")
def get_crime_map_summary():
    """Returns geospatial crime density, state heatmaps, and movement corridors."""
    return INDIA_CRIME_HEATMAP
