"""
Crime Intelligence Map — Geographic Crime Analytics Endpoints
=============================================================
GET /api/v1/map/crime-summary     — Aggregated location crime data from Neo4j
GET /api/v1/map/location/{loc_id} — Detailed intelligence for a specific location
"""
import logging
from typing import Optional
from fastapi import APIRouter, Query
from app.db.neo4j_client import Neo4jClient
from app.schemas.common import ResponseEnvelope

router = APIRouter()
logger = logging.getLogger(__name__)

# Indian state coordinate mapping for SVG map rendering
INDIA_STATE_COORDS = {
    "Delhi": {"lat": 28.6139, "lon": 77.2090, "state": "Delhi"},
    "Delhi NCR": {"lat": 28.6139, "lon": 77.2090, "state": "Delhi"},
    "Mumbai": {"lat": 19.0760, "lon": 72.8777, "state": "Maharashtra"},
    "Bengaluru": {"lat": 12.9716, "lon": 77.5946, "state": "Karnataka"},
    "Chennai": {"lat": 13.0827, "lon": 80.2707, "state": "Tamil Nadu"},
    "Kolkata": {"lat": 22.5726, "lon": 88.3639, "state": "West Bengal"},
    "Hyderabad": {"lat": 17.3850, "lon": 78.4867, "state": "Telangana"},
    "Lucknow": {"lat": 26.8467, "lon": 80.9462, "state": "Uttar Pradesh"},
    "Meerut": {"lat": 28.9845, "lon": 77.7064, "state": "Uttar Pradesh"},
    "Chandigarh": {"lat": 30.7333, "lon": 76.7794, "state": "Chandigarh"},
    "Jaipur": {"lat": 26.9124, "lon": 75.7873, "state": "Rajasthan"},
    "Pune": {"lat": 18.5204, "lon": 73.8567, "state": "Maharashtra"},
}


@router.get("/crime-summary", response_model=ResponseEnvelope, summary="Geographic Crime Intelligence Summary")
def get_crime_summary():
    """
    Aggregates location data from Neo4j: counts cases per location,
    identifies linked entities, and calculates crime concentration.
    """
    try:
        # Get all Location nodes and their connections
        query = """
        MATCH (loc:Entity)
        WHERE loc.lat IS NOT NULL OR any(label IN labels(loc) WHERE label = 'Location')
        WITH loc
        OPTIONAL MATCH (loc)<-[:LOCATED_AT|OPERATES_FROM|TRANSITS_VIA]-(e:Entity)
        WITH loc, collect(DISTINCT e) AS connected_entities
        OPTIONAL MATCH (e2:Entity)-[:INVOLVED_IN|ASSOCIATED_WITH]->(:Entity)
        WHERE e2 IN connected_entities
        RETURN loc.id AS location_id, loc.name AS name,
               loc.lat AS lat, loc.lon AS lon,
               size(connected_entities) AS entity_count,
               loc.cases AS cases
        """
        results = Neo4jClient.run_query(query)

        # Also get case jurisdiction data to extract locations
        case_query = """
        MATCH (n:Entity)
        UNWIND n.cases AS case_id
        WITH case_id, collect(DISTINCT n) AS entities
        RETURN case_id, size(entities) AS entity_count
        """
        case_results = Neo4jClient.run_query(case_query)

        # Build location summaries from graph data
        location_summaries = {}

        # Process graph location nodes
        for r in (results or []):
            name = r.get("name") or r.get("location_id") or "Unknown"
            loc_data = INDIA_STATE_COORDS.get(name, {})
            cases = r.get("cases") or []
            location_summaries[name] = {
                "location_id": r.get("location_id"),
                "name": name,
                "lat": r.get("lat") or loc_data.get("lat"),
                "lon": r.get("lon") or loc_data.get("lon"),
                "state": loc_data.get("state", name),
                "total_cases": len(cases) if cases else 0,
                "entity_count": r.get("entity_count", 0),
                "cases": cases,
                "trend": "stable",
                "crime_growth_pct": 0,
            }

        # Extract locations from case metadata (jurisdictions)
        from app.api.v1.endpoints.cases import CASE_METADATA
        jurisdiction_counts = {}
        for case in CASE_METADATA:
            jurisdiction = case.get("jurisdiction", "")
            # Extract city/state from jurisdiction
            for city, coords in INDIA_STATE_COORDS.items():
                if city.lower() in jurisdiction.lower() or coords["state"].lower() in jurisdiction.lower():
                    if city not in location_summaries:
                        location_summaries[city] = {
                            "location_id": city.lower().replace(" ", "_"),
                            "name": city,
                            "lat": coords["lat"],
                            "lon": coords["lon"],
                            "state": coords["state"],
                            "total_cases": 0,
                            "entity_count": 0,
                            "cases": [],
                            "trend": "stable",
                            "crime_growth_pct": 0,
                        }
                    location_summaries[city]["total_cases"] += 1
                    location_summaries[city]["cases"].append(case["case_number"])
                    break

        # Calculate trends based on case counts
        for name, loc in location_summaries.items():
            case_count = loc["total_cases"]
            if case_count >= 3:
                loc["trend"] = "increasing"
                loc["crime_growth_pct"] = round((case_count - 1) / 1 * 100, 1)
            elif case_count == 2:
                loc["trend"] = "moderate"
                loc["crime_growth_pct"] = 50.0
            elif case_count == 1:
                loc["trend"] = "stable"
                loc["crime_growth_pct"] = 0
            else:
                loc["trend"] = "insufficient_data"

        # Aggregate by state
        state_data = {}
        for loc in location_summaries.values():
            state = loc.get("state", "Unknown")
            if state not in state_data:
                state_data[state] = {
                    "state": state,
                    "total_cases": 0,
                    "total_entities": 0,
                    "locations": [],
                    "cases": [],
                    "trend": "insufficient_data",
                }
            state_data[state]["total_cases"] += loc["total_cases"]
            state_data[state]["total_entities"] += loc.get("entity_count", 0)
            state_data[state]["locations"].append(loc["name"])
            state_data[state]["cases"].extend(loc.get("cases", []))

        for state, data in state_data.items():
            data["cases"] = list(set(data["cases"]))
            tc = data["total_cases"]
            if tc >= 3:
                data["trend"] = "increasing"
            elif tc == 2:
                data["trend"] = "moderate"
            elif tc == 1:
                data["trend"] = "stable"

        return ResponseEnvelope(
            success=True,
            message=f"Crime intelligence for {len(location_summaries)} locations across {len(state_data)} states.",
            data={
                "locations": list(location_summaries.values()),
                "states": list(state_data.values()),
                "total_locations": len(location_summaries),
                "total_states": len(state_data),
            }
        )
    except Exception as e:
        logger.error(f"Crime summary failed: {e}")
        return ResponseEnvelope(success=False, message=str(e), data={})


@router.get("/location/{location_id}", response_model=ResponseEnvelope, summary="Location Detail Intelligence")
def get_location_detail(location_id: str):
    """Detailed crime intelligence for a specific location."""
    try:
        # Find entities associated with this location
        query = """
        MATCH (loc:Entity)
        WHERE toLower(loc.id) = toLower($loc_id) OR toLower(loc.name) CONTAINS toLower($loc_id)
        WITH loc
        OPTIONAL MATCH (loc)<-[r]-(e:Entity)
        RETURN loc.id AS location_id, loc.name AS name, loc.cases AS loc_cases,
               collect(DISTINCT {id: e.id, name: e.name, type: labels(e)[0], cases: e.cases, rel: type(r)}) AS connected
        """
        results = Neo4jClient.run_query(query, {"loc_id": location_id})

        if not results:
            return ResponseEnvelope(success=False, message=f"Location '{location_id}' not found.", data={})

        r = results[0]
        connected = r.get("connected") or []
        loc_cases = r.get("loc_cases") or []

        # Classify entities
        persons = [e for e in connected if e.get("type") == "Person"]
        orgs = [e for e in connected if e.get("type") == "Organization"]
        vehicles = [e for e in connected if e.get("type") == "Vehicle"]

        # Gather all cases from connected entities
        all_cases = set(loc_cases)
        for e in connected:
            for c in (e.get("cases") or []):
                all_cases.add(c)

        return ResponseEnvelope(
            success=True,
            message="Location intelligence retrieved.",
            data={
                "location_id": r.get("location_id"),
                "name": r.get("name"),
                "total_cases": len(all_cases),
                "cases": list(all_cases),
                "persons": [{"id": p.get("id"), "name": p.get("name")} for p in persons],
                "organizations": [{"id": o.get("id"), "name": o.get("name")} for o in orgs],
                "vehicles": [{"id": v.get("id"), "name": v.get("name")} for v in vehicles],
                "total_entities": len(connected),
            }
        )
    except Exception as e:
        logger.error(f"Location detail failed: {e}")
        return ResponseEnvelope(success=False, message=str(e), data={})
