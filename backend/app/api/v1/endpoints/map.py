"""
Crime Intelligence Map — Geographic Crime Analytics Endpoints
=============================================================
Delegates to analyst_intelligence for real density / trend calculations.
Keeps legacy paths used by the Vite map for compatibility.
"""
import logging
from fastapi import APIRouter, Query
from typing import Optional
from app.schemas.common import ResponseEnvelope
from app.services import analyst_intelligence as ai

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/crime-summary", response_model=ResponseEnvelope, summary="Geographic Crime Intelligence Summary")
def get_crime_summary(
    mode: str = Query("density"),
    crime_type: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    try:
        heat = ai.build_heatmap(mode=mode, crime_type=crime_type, start=start, end=end)
        # Shape compatible with existing CrimeIntelligenceMap.jsx
        locations = []
        states = {}
        for r in heat.get("regions", []):
            locations.append({
                "location_id": r["id"],
                "name": r["name"],
                "lat": r.get("lat"),
                "lon": r.get("lon"),
                "state": r.get("state"),
                "total_cases": r["case_count"],
                "entity_count": len(r.get("sub_locations") or []),
                "cases": r.get("cases") or [],
                "trend": r.get("trend"),
                "crime_growth_pct": r.get("change_pct") or 0,
                "density": r.get("density"),
                "visible": r.get("visible"),
            })
            st = r.get("state") or "Unknown"
            if st not in states:
                states[st] = {
                    "state": st,
                    "total_cases": 0,
                    "total_entities": 0,
                    "locations": [],
                    "cases": [],
                    "trend": "insufficient_data",
                }
            states[st]["total_cases"] += r["case_count"]
            states[st]["locations"].append(r["name"])
            states[st]["cases"].extend(r.get("cases") or [])
            if r.get("trend") == "increasing":
                states[st]["trend"] = "increasing"
            elif states[st]["trend"] != "increasing" and r.get("trend") == "decreasing":
                states[st]["trend"] = "decreasing"
            elif states[st]["trend"] == "insufficient_data" and r.get("trend") == "stable":
                states[st]["trend"] = "stable"

        for st in states.values():
            st["cases"] = list(set(st["cases"]))

        return ResponseEnvelope(
            success=True,
            message=f"Crime intelligence for {len(locations)} regions.",
            data={
                "locations": locations,
                "states": list(states.values()),
                "total_locations": len(locations),
                "total_states": len(states),
                "data_mode": heat.get("data_mode"),
                "label": heat.get("label"),
                "heatmap": heat,
            },
        )
    except Exception as e:
        logger.error("Crime summary failed: %s", e)
        return ResponseEnvelope(success=False, message=str(e), data={})


@router.get("/location/{location_id}", response_model=ResponseEnvelope, summary="Location Detail Intelligence")
def get_location_detail(location_id: str):
    try:
        data = ai.region_detail(location_id)
        if not data.get("found"):
            return ResponseEnvelope(success=False, message=data.get("message", "Not found"), data={})
        region = data["region"]
        return ResponseEnvelope(
            success=True,
            message="Location intelligence retrieved.",
            data={
                "location_id": region["id"],
                "name": region["name"],
                "total_cases": region["case_count"],
                "cases": region.get("cases") or [],
                "persons": [
                    {"id": e["id"], "name": e["name"]}
                    for e in data.get("important_entities", [])
                    if e.get("type") == "Person"
                ],
                "organizations": [],
                "vehicles": [],
                "total_entities": len(data.get("important_entities") or []),
                "detail": data,
            },
        )
    except Exception as e:
        logger.error("Location detail failed: %s", e)
        return ResponseEnvelope(success=False, message=str(e), data={})
