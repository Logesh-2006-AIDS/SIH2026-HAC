"""
Analyst Intelligence Engine
===========================
Derives geographic density, trends, patterns, communities, and
cross-case signals from case metadata + ground-truth entities/graph.

Uses Memgraph when available; otherwise JSON fallback with an
explicit data_mode flag (LIVE / FALLBACK).
"""
from __future__ import annotations

import json
import logging
import os
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

from app.db.graph_client import MemgraphClient
from app.services import graph_analytics

logger = logging.getLogger(__name__)

_MEMGRAPH_CACHE: Optional[Tuple[float, bool]] = None
_MEMGRAPH_TTL_SEC = 15.0

# Location text → administrative region.  Coordinates are deliberately not
# inferred here: the map only plots latitude/longitude recorded in the source
# location entities.  This keeps the visual precision honest when a case is
# known only at a jurisdiction/state level.
GEO_LOOKUP = {
    "delhi": {"state": "Delhi", "city": "Delhi", "lat": 28.6139, "lon": 77.2090},
    "new delhi": {"state": "Delhi", "city": "Delhi", "lat": 28.6139, "lon": 77.2090},
    "rohini": {"state": "Delhi", "city": "Delhi", "lat": 28.7041, "lon": 77.1025},
    "karol bagh": {"state": "Delhi", "city": "Delhi", "lat": 28.6511, "lon": 77.1907},
    "okhla": {"state": "Delhi", "city": "Delhi", "lat": 28.5355, "lon": 77.2710},
    "pahar ganj": {"state": "Delhi", "city": "Delhi", "lat": 28.6432, "lon": 77.2144},
    "noida": {"state": "Uttar Pradesh", "city": "Noida", "lat": 28.5355, "lon": 77.3910},
    "gurgaon": {"state": "Haryana", "city": "Gurugram", "lat": 28.4595, "lon": 77.0266},
    "gurugram": {"state": "Haryana", "city": "Gurugram", "lat": 28.4595, "lon": 77.0266},
    "meerut": {"state": "Uttar Pradesh", "city": "Meerut", "lat": 28.9845, "lon": 77.7064},
    "lucknow": {"state": "Uttar Pradesh", "city": "Lucknow", "lat": 26.8467, "lon": 80.9462},
    "kanpur": {"state": "Uttar Pradesh", "city": "Kanpur", "lat": 26.4499, "lon": 80.3319},
    "mumbai": {"state": "Maharashtra", "city": "Mumbai", "lat": 19.0760, "lon": 72.8777},
    "bandra": {"state": "Maharashtra", "city": "Mumbai", "lat": 19.0596, "lon": 72.8295},
    "andheri": {"state": "Maharashtra", "city": "Mumbai", "lat": 19.1136, "lon": 72.8697},
    "dharavi": {"state": "Maharashtra", "city": "Mumbai", "lat": 19.0434, "lon": 72.8567},
    "pune": {"state": "Maharashtra", "city": "Pune", "lat": 18.5204, "lon": 73.8567},
    "nagpur": {"state": "Maharashtra", "city": "Nagpur", "lat": 21.1458, "lon": 79.0882},
    "ahmedabad": {"state": "Gujarat", "city": "Ahmedabad", "lat": 23.0225, "lon": 72.5714},
    "surat": {"state": "Gujarat", "city": "Surat", "lat": 21.1702, "lon": 72.8311},
    "bengaluru": {"state": "Karnataka", "city": "Bengaluru", "lat": 12.9716, "lon": 77.5946},
    "bangalore": {"state": "Karnataka", "city": "Bengaluru", "lat": 12.9716, "lon": 77.5946},
    "hyderabad": {"state": "Telangana", "city": "Hyderabad", "lat": 17.3850, "lon": 78.4867},
    "chennai": {"state": "Tamil Nadu", "city": "Chennai", "lat": 13.0827, "lon": 80.2707},
    "kolkata": {"state": "West Bengal", "city": "Kolkata", "lat": 22.5726, "lon": 88.3639},
    "salt lake": {"state": "West Bengal", "city": "Kolkata", "lat": 22.5804, "lon": 88.4180},
    "patna": {"state": "Bihar", "city": "Patna", "lat": 25.5941, "lon": 85.1376},
    "jaipur": {"state": "Rajasthan", "city": "Jaipur", "lat": 26.9124, "lon": 75.7873},
    "chandigarh": {"state": "Punjab", "city": "Chandigarh", "lat": 30.7333, "lon": 76.7794},
    "amritsar": {"state": "Punjab", "city": "Amritsar", "lat": 31.6340, "lon": 74.8723},
    "bhopal": {"state": "Madhya Pradesh", "city": "Bhopal", "lat": 23.2599, "lon": 77.4126},
    "indore": {"state": "Madhya Pradesh", "city": "Indore", "lat": 22.7196, "lon": 75.8577},
    "guwahati": {"state": "Assam", "city": "Guwahati", "lat": 26.1445, "lon": 91.7362},
    "kochi": {"state": "Kerala", "city": "Kochi", "lat": 9.9312, "lon": 76.2673},
}


def _data_dir() -> str:
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    project_dir = os.path.dirname(backend_dir)
    return os.path.join(project_dir, "data", "metadata")


def _load_entities() -> Dict[str, Any]:
    path = os.path.join(_data_dir(), "ground_truth_entities.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_cases() -> List[Dict[str, Any]]:
    from app.api.v1.endpoints.cases import CASE_METADATA

    return list(CASE_METADATA)


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _crime_type(category: str) -> str:
    if not category:
        return "Unknown"
    return category.split("/")[0].strip()


def data_mode() -> Dict[str, Any]:
    global _MEMGRAPH_CACHE
    now = datetime.now(timezone.utc).timestamp()
    if _MEMGRAPH_CACHE and (now - _MEMGRAPH_CACHE[0]) < _MEMGRAPH_TTL_SEC:
        live = _MEMGRAPH_CACHE[1]
    else:
        live = MemgraphClient.verify_connectivity()
        _MEMGRAPH_CACHE = (now, live)
    return {
        "memgraph_live": live,
        "data_mode": "LIVE" if live else "FALLBACK",
        "label": "LIVE GRAPH" if live else "DEMO / FALLBACK DATA",
    }


def _resolve_geo(name: str, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
    lower = (name or "").lower()
    for key, meta in GEO_LOOKUP.items():
        if key in lower:
            return {**meta, "lat": lat, "lon": lon, "name": name}
    # jurisdiction text fallbacks
    if "delhi" in lower:
        return {**GEO_LOOKUP["delhi"], "lat": lat, "lon": lon, "name": name}
    if "meerut" in lower or "uttar pradesh" in lower or "up police" in lower:
        return {**GEO_LOOKUP["meerut"], "lat": lat, "lon": lon, "name": name}
    if "mumbai" in lower or "maharashtra" in lower:
        return {**GEO_LOOKUP["mumbai"], "lat": lat, "lon": lon, "name": name}
    if "kolkata" in lower or "west bengal" in lower:
        return {**GEO_LOOKUP["kolkata"], "lat": lat, "lon": lon, "name": name}
    if "enforcement" in lower or "eow" in lower or "economic offences" in lower:
        return {**GEO_LOOKUP["delhi"], "lat": lat, "lon": lon, "name": name}
    return {
        "state": "Unknown",
        "city": name or "Unknown",
        "lat": lat,
        "lon": lon,
        "name": name,
    }


def _filter_cases(
    cases: List[Dict[str, Any]],
    crime_type: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    status: Optional[str] = None,
    geography: Optional[str] = None,
) -> List[Dict[str, Any]]:
    start_dt = _parse_dt(start) if start else None
    end_dt = _parse_dt(end) if end else None
    geo_q = (geography or "").strip().lower()
    crime_q = (crime_type or "").strip().lower()
    status_q = (status or "").strip().upper()

    out = []
    for c in cases:
        if crime_q and crime_q not in ("all", "") and crime_q not in _crime_type(c.get("crime_category", "")).lower() and crime_q not in (c.get("crime_category") or "").lower():
            continue
        if status_q and status_q not in ("ALL", ""):
            st = (c.get("status") or "").upper()
            if status_q == "ACTIVE" and st not in ("UNDER_INVESTIGATION", "OPEN", "ACTIVE"):
                continue
            if status_q == "CLOSED" and st not in ("CLOSED", "RESOLVED"):
                continue
        dt = _parse_dt(c.get("incident_date"))
        if start_dt and dt and dt < start_dt:
            continue
        if end_dt and dt and dt > end_dt:
            continue
        if geo_q and geo_q not in ("all", ""):
            jur = (c.get("jurisdiction") or "").lower()
            if geo_q not in jur:
                continue
        out.append(c)
    return out


def _case_ids(cases: List[Dict[str, Any]]) -> Set[str]:
    return {c["case_number"] for c in cases}


def _locations_for_cases(entities: Dict[str, Any], case_ids: Set[str]) -> List[Dict[str, Any]]:
    rows = []
    for loc in entities.get("locations", []):
        loc_cases = [c for c in (loc.get("cases") or []) if c in case_ids]
        if not loc_cases:
            continue
        lat, lon = loc.get("lat"), loc.get("lon")
        has_coordinates = isinstance(lat, (int, float)) and isinstance(lon, (int, float)) and -90 <= lat <= 90 and -180 <= lon <= 180
        geo = _resolve_geo(loc.get("name", ""), lat, lon)
        rows.append({
            "location_id": loc.get("id"),
            "name": loc.get("name"),
            "lat": lat if has_coordinates else None,
            "lon": lon if has_coordinates else None,
            "state": geo.get("state"),
            "city": geo.get("city"),
            "coordinate_precision": "recorded" if has_coordinates else "region_only",
            "cases": loc_cases,
            "case_count": len(loc_cases),
        })
    return rows


def _split_periods(cases: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Optional[str], Optional[str]]:
    """Split filtered cases into previous / current by median incident date."""
    dated = [(c, _parse_dt(c.get("incident_date"))) for c in cases]
    dated = [(c, d) for c, d in dated if d]
    if len(dated) < 2:
        return [], cases, None, None
    dated.sort(key=lambda x: x[1])
    mid = len(dated) // 2
    prev = [c for c, _ in dated[:mid]]
    curr = [c for c, _ in dated[mid:]]
    prev_label = dated[0][1].date().isoformat() + " → " + dated[mid - 1][1].date().isoformat()
    curr_label = dated[mid][1].date().isoformat() + " → " + dated[-1][1].date().isoformat()
    return prev, curr, prev_label, curr_label


def _normalize_density(count: int, max_count: int) -> Dict[str, Any]:
    if max_count <= 0 or count <= 0:
        return {"intensity": 0.0, "band": "NONE", "label": "No data"}
    ratio = count / max_count
    if ratio >= 0.75:
        band, label = "VERY_HIGH", "Very High"
    elif ratio >= 0.5:
        band, label = "HIGH", "High"
    elif ratio >= 0.25:
        band, label = "MEDIUM", "Medium"
    else:
        band, label = "LOW", "Low"
    return {"intensity": round(ratio, 3), "band": band, "label": label}


def build_heatmap(
    crime_type: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    geography: Optional[str] = None,
    status: Optional[str] = None,
    mode: str = "density",
    geography_level: str = "city",
) -> Dict[str, Any]:
    mode = (mode or "density").lower()
    entities = _load_entities()
    all_cases = _load_cases()
    cases = _filter_cases(all_cases, crime_type, start, end, status)
    case_ids = _case_ids(cases)

    # Geography filter via jurisdiction or location names
    geo_q = (geography or "").strip().lower()
    locations = _locations_for_cases(entities, case_ids)
    if geo_q and geo_q not in ("all", ""):
        locations = [
            loc for loc in locations
            if geo_q in (loc.get("name") or "").lower()
            or geo_q in (loc.get("state") or "").lower()
            or geo_q in (loc.get("city") or "").lower()
        ]
        matched_cases = set()
        for loc in locations:
            matched_cases.update(loc["cases"])
        # also keep cases whose jurisdiction matches
        for c in cases:
            if geo_q in (c.get("jurisdiction") or "").lower():
                matched_cases.add(c["case_number"])
        cases = [c for c in cases if c["case_number"] in matched_cases]
        case_ids = _case_ids(cases)
        locations = _locations_for_cases(entities, case_ids)

    prev_cases, curr_cases, prev_label, curr_label = _split_periods(cases)
    prev_ids, curr_ids = _case_ids(prev_cases), _case_ids(curr_cases)

    # Aggregate by geography level
    buckets: Dict[str, Dict[str, Any]] = {}
    for loc in locations:
        if geography_level == "state":
            key = loc["state"]
        elif geography_level == "district":
            key = loc["name"]
        else:
            key = loc["city"] or loc["name"]

        if key not in buckets:
            buckets[key] = {
                "id": key.lower().replace(" ", "_"),
                "name": key,
                "state": loc["state"],
                "city": loc["city"],
                "lat": loc["lat"],
                "lon": loc["lon"],
                "cases": set(),
                "locations": [],
                "prev_cases": set(),
                "curr_cases": set(),
            }
        b = buckets[key]
        b["cases"].update(loc["cases"])
        b["prev_cases"].update([c for c in loc["cases"] if c in prev_ids])
        b["curr_cases"].update([c for c in loc["cases"] if c in curr_ids])
        b["locations"].append({
            "id": loc["location_id"],
            "name": loc["name"],
            "case_count": loc["case_count"],
            "cases": loc["cases"],
        })

    # Also include jurisdiction-only cases without location nodes
    for c in cases:
        geo = _resolve_geo(c.get("jurisdiction", ""))
        key = geo["state"] if geography_level == "state" else geo["city"]
        if key not in buckets:
            buckets[key] = {
                "id": key.lower().replace(" ", "_"),
                "name": key,
                "state": geo["state"],
                "city": geo["city"],
                "lat": geo["lat"],
                "lon": geo["lon"],
                "cases": set(),
                "locations": [],
                "prev_cases": set(),
                "curr_cases": set(),
            }
        buckets[key]["cases"].add(c["case_number"])
        if c["case_number"] in prev_ids:
            buckets[key]["prev_cases"].add(c["case_number"])
        if c["case_number"] in curr_ids:
            buckets[key]["curr_cases"].add(c["case_number"])

    max_count = max((len(b["cases"]) for b in buckets.values()), default=0)
    regions = []
    for b in buckets.values():
        cases_list = sorted(b["cases"])
        prev_n, curr_n = len(b["prev_cases"]), len(b["curr_cases"])
        if prev_n == 0 and curr_n == 0:
            change_pct = None
            trend = "insufficient_data"
        elif prev_n == 0 and curr_n > 0:
            change_pct = None
            trend = "increasing"
        else:
            change_pct = round(((curr_n - prev_n) / prev_n) * 100, 1)
            if change_pct > 5:
                trend = "increasing"
            elif change_pct < -5:
                trend = "decreasing"
            else:
                trend = "stable"

        density = _normalize_density(len(cases_list), max_count)
        repeated = len(cases_list) >= 2 or len({loc["name"] for loc in b["locations"]}) >= 2

        # months covered from case dates
        months = set()
        for cn in cases_list:
            case = next((x for x in cases if x["case_number"] == cn), None)
            dt = _parse_dt((case or {}).get("incident_date"))
            if dt:
                months.add(dt.strftime("%Y-%m"))

        regions.append({
            "id": b["id"],
            "name": b["name"],
            "state": b["state"],
            "city": b["city"],
            "lat": b["lat"],
            "lon": b["lon"],
            "case_count": len(cases_list),
            "cases": cases_list,
            "prev_count": prev_n,
            "curr_count": curr_n,
            "change_pct": change_pct,
            "trend": trend,
            "density": density,
            "repeated": repeated,
            "months_covered": sorted(months),
            "sub_locations": b["locations"],
            "visible": True,
        })

    # Mode visibility
    for r in regions:
        if mode == "increasing":
            r["visible"] = r["trend"] == "increasing"
            r["display_value"] = r["change_pct"] if r["change_pct"] is not None else r["curr_count"]
            r["display_band"] = "INCREASING" if r["visible"] else "HIDDEN"
        elif mode == "decreasing":
            r["visible"] = r["trend"] == "decreasing"
            r["display_value"] = r["change_pct"]
            r["display_band"] = "DECREASING" if r["visible"] else "HIDDEN"
        elif mode in ("repeated", "repeated_zones"):
            r["visible"] = r["repeated"] and r["case_count"] >= 2
            r["display_value"] = r["case_count"]
            r["display_band"] = r["density"]["band"] if r["visible"] else "HIDDEN"
        else:
            r["visible"] = r["case_count"] > 0
            r["display_value"] = r["case_count"]
            r["display_band"] = r["density"]["band"]

    visible = [r for r in regions if r["visible"]]
    cases_by_id = {case["case_number"]: case for case in cases}
    # Each item is a recorded location entity, never a generated city/state
    # coordinate.  Leaflet consumes these directly for the point heat layer.
    points = []
    for loc in locations:
        if loc["coordinate_precision"] != "recorded":
            continue
        matched = [cases_by_id[case_id] for case_id in loc["cases"] if case_id in cases_by_id]
        if not matched:
            continue
        points.append({
            "id": loc["location_id"],
            "name": loc["name"],
            "state": loc["state"],
            "city": loc["city"],
            "lat": loc["lat"],
            "lon": loc["lon"],
            "case_count": len(matched),
            "cases": [
                {
                    "case_number": case["case_number"],
                    "title": case["title"],
                    "crime_category": case["crime_category"],
                    "incident_date": case["incident_date"],
                    "status": case["status"],
                }
                for case in matched
            ],
        })
    mode_meta = {
        "density": {
            "title": "Crime Density",
            "legend": ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
            "explanation": "Intensity = region case count / max region case count in the filtered set.",
        },
        "increasing": {
            "title": "Increasing Zones",
            "legend": ["DECREASING", "STABLE", "INCREASING"],
            "explanation": "Compares case counts in the earlier half vs later half of the filtered date range.",
        },
        "decreasing": {
            "title": "Decreasing Zones",
            "legend": ["DECREASING", "STABLE", "INCREASING"],
            "explanation": "Regions where later-period case count is lower than earlier-period count.",
        },
        "repeated": {
            "title": "Repeated Crime Zones",
            "legend": ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
            "explanation": "Regions with multiple cases or multiple distinct incident locations.",
        },
    }
    key = mode if mode in mode_meta else "density"
    if mode == "repeated_zones":
        key = "repeated"

    dm = data_mode()
    return {
        **dm,
        "mode": mode,
        "mode_meta": mode_meta[key],
        "filters": {
            "crime_type": crime_type or "All",
            "start": start,
            "end": end,
            "geography": geography or "All",
            "status": status or "All",
            "geography_level": geography_level,
        },
        "period": {
            "previous": prev_label,
            "current": curr_label,
            "previous_case_count": len(prev_cases),
            "current_case_count": len(curr_cases),
        },
        "totals": {
            "regions": len(regions),
            "visible_regions": len(visible),
            "cases": len(cases),
            "max_density": max_count,
            "recorded_coordinate_points": len(points),
        },
        "spatial_precision": {
            "primary_mode": "point_heatmap" if points else "region_density",
            "recorded_coordinate_points": len(points),
            "unlocated_cases": max(0, len(cases) - len({case["case_number"] for point in points for case in point["cases"]})),
            "description": "Point heatmap uses only latitude/longitude recorded on source location entities. Region density aggregates state labels from case and location data.",
        },
        "regions": sorted(regions, key=lambda r: r["case_count"], reverse=True),
        "points": points,
        "crime_types": sorted({_crime_type(c.get("crime_category", "")) for c in all_cases}),
        "geographies": sorted({r["state"] for r in regions if r["state"] != "Unknown"}),
    }


def region_detail(region_id: str, **filters) -> Dict[str, Any]:
    heat = build_heatmap(**filters)
    region = next(
        (r for r in heat["regions"] if r["id"] == region_id or r["name"].lower() == region_id.lower()),
        None,
    )
    if not region:
        return {"found": False, "message": f"Region '{region_id}' not found in filtered set."}

    entities = _load_entities()
    cases = [c for c in _load_cases() if c["case_number"] in set(region["cases"])]
    crime_counts = Counter(_crime_type(c.get("crime_category", "")) for c in cases)

    # Important entities in these cases
    important = []
    for person in entities.get("persons", []):
        shared = sorted(set(person.get("cases") or []) & set(region["cases"]))
        if shared:
            important.append({
                "id": person["id"],
                "name": person["name"],
                "type": "Person",
                "cases": shared,
                "cross_case": len(person.get("cases") or []) > 1,
            })
    important.sort(key=lambda x: (x["cross_case"], len(x["cases"])), reverse=True)

    # Cross-case links among region cases
    cross = 0
    for person in entities.get("persons", []):
        overlap = set(person.get("cases") or []) & set(region["cases"])
        if len(overlap) > 1:
            cross += 1

    return {
        "found": True,
        **data_mode(),
        "region": region,
        "crime_activity": {
            "cases": region["case_count"],
            "trend": region["trend"],
            "change_pct": region["change_pct"],
            "prev_count": region["prev_count"],
            "curr_count": region["curr_count"],
        },
        "top_crime_types": [{"type": t, "count": n} for t, n in crime_counts.most_common()],
        "repeated_zones": [
            {"name": loc["name"], "cases": loc["case_count"], "case_ids": loc["cases"]}
            for loc in region.get("sub_locations", [])
            if loc["case_count"] >= 1
        ],
        "cross_case_connections": cross,
        "important_entities": important[:8],
        "case_dossiers": [
            {
                "case_number": c["case_number"],
                "title": c["title"],
                "crime_category": c["crime_category"],
                "incident_date": c["incident_date"],
                "status": c["status"],
            }
            for c in cases
        ],
    }


def overview(**filters) -> Dict[str, Any]:
    heat = build_heatmap(mode="density", **filters)
    trends = crime_trends(**filters)
    cross = cross_case_intelligence()
    patterns = discover_patterns(**filters)
    centrality = key_entities()

    increasing = sum(1 for r in heat["regions"] if r["trend"] == "increasing")
    decreasing = sum(1 for r in heat["regions"] if r["trend"] == "decreasing")
    repeated = sum(1 for r in heat["regions"] if r["repeated"] and r["case_count"] >= 2)

    return {
        **data_mode(),
        "summary": {
            "total_cases": heat["totals"]["cases"],
            "active_crime_zones": heat["totals"]["visible_regions"],
            "increasing_zones": increasing,
            "decreasing_zones": decreasing,
            "repeated_crime_zones": repeated,
            "cross_case_connections": cross.get("total_links", 0),
            "important_network_entities": len(centrality.get("entities", [])),
        },
        "crime_trend_snapshot": trends.get("by_type", [])[:6],
        "geographic_intelligence": [
            {
                "name": r["name"],
                "cases": r["case_count"],
                "trend": r["trend"],
                "band": r["density"]["band"],
            }
            for r in heat["regions"][:5]
            if r["case_count"] > 0
        ],
        "key_patterns": patterns.get("patterns", [])[:5],
        "cross_case_signals": cross.get("clusters", [])[:4],
        "period": heat.get("period"),
        "filters": heat.get("filters"),
        "crime_types": heat.get("crime_types"),
        "geographies": heat.get("geographies"),
    }


def crime_trends(
    crime_type: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    status: Optional[str] = None,
    geography: Optional[str] = None,
) -> Dict[str, Any]:
    all_cases = _load_cases()
    cases = _filter_cases(all_cases, crime_type, start, end, status)
    if geography and geography.lower() not in ("all", ""):
        gq = geography.lower()
        cases = [c for c in cases if gq in (c.get("jurisdiction") or "").lower()]

    # Monthly volume
    monthly: Dict[str, int] = defaultdict(int)
    type_monthly: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for c in cases:
        dt = _parse_dt(c.get("incident_date"))
        if not dt:
            continue
        key = dt.strftime("%Y-%m")
        monthly[key] += 1
        type_monthly[_crime_type(c.get("crime_category", ""))][key] += 1

    months_sorted = sorted(monthly.keys())
    series = [{"month": m, "count": monthly[m]} for m in months_sorted]

    # Per-type trend via period split
    by_type = []
    for ctype, month_map in type_monthly.items():
        type_cases = [c for c in cases if _crime_type(c.get("crime_category", "")) == ctype]
        prev, curr, _, _ = _split_periods(type_cases)
        prev_n, curr_n = len(prev), len(curr)
        if prev_n == 0 and curr_n == 0:
            direction, change = "insufficient_data", None
        elif prev_n == 0:
            direction, change = "increasing", None
        else:
            change = round(((curr_n - prev_n) / prev_n) * 100, 1)
            direction = "increasing" if change > 5 else "decreasing" if change < -5 else "stable"
        by_type.append({
            "crime_type": ctype,
            "total": len(type_cases),
            "previous": prev_n,
            "current": curr_n,
            "change_pct": change,
            "direction": direction,
            "monthly": [{"month": m, "count": month_map[m]} for m in sorted(month_map.keys())],
        })
    by_type.sort(key=lambda x: x["total"], reverse=True)

    selected = None
    if crime_type and crime_type.lower() not in ("all", ""):
        selected = next((t for t in by_type if crime_type.lower() in t["crime_type"].lower()), None)

    # Top regions for selected / overall
    heat = build_heatmap(crime_type=crime_type, start=start, end=end, status=status, geography=geography)
    top_regions = [
        {"name": r["name"], "cases": r["case_count"], "trend": r["trend"]}
        for r in heat["regions"][:5]
        if r["case_count"] > 0
    ]

    return {
        **data_mode(),
        "series": series,
        "by_type": by_type,
        "selected_type": selected,
        "top_regions": top_regions,
        "increasing": [t for t in by_type if t["direction"] == "increasing"],
        "decreasing": [t for t in by_type if t["direction"] == "decreasing"],
        "stable": [t for t in by_type if t["direction"] == "stable"],
    }


def compare(
    axis: str = "period",
    left: Optional[str] = None,
    right: Optional[str] = None,
) -> Dict[str, Any]:
    """Compare crime types, regions, or periods using real counts."""
    axis = (axis or "period").lower()
    cases = _load_cases()
    entities = _load_entities()

    if axis == "crime_type":
        left = left or "Cyber Fraud"
        right = right or "Extortion"
        left_cases = [c for c in cases if left.lower() in (c.get("crime_category") or "").lower()]
        right_cases = [c for c in cases if right.lower() in (c.get("crime_category") or "").lower()]
        return _compare_payload("crime_type", left, len(left_cases), right, len(right_cases), left_cases, right_cases)

    if axis == "region":
        left = left or "Delhi"
        right = right or "Mumbai"
        heat = build_heatmap()
        l = next((r for r in heat["regions"] if left.lower() in r["name"].lower()), None)
        r = next((r for r in heat["regions"] if right.lower() in r["name"].lower()), None)
        if not l or not r:
            return {**data_mode(), "insufficient_data": True, "message": "One or both regions lack data."}
        return _compare_payload("region", l["name"], l["case_count"], r["name"], r["case_count"])

    # period: first half vs second half
    prev, curr, prev_label, curr_label = _split_periods(cases)
    return {
        **data_mode(),
        "axis": "period",
        "left": {"label": prev_label or "Previous", "count": len(prev)},
        "right": {"label": curr_label or "Current", "count": len(curr)},
        "change_pct": round(((len(curr) - len(prev)) / max(len(prev), 1)) * 100, 1) if prev else None,
        "insufficient_data": len(prev) == 0,
    }


def _compare_payload(axis, left_label, left_n, right_label, right_n, left_cases=None, right_cases=None):
    change = None
    if left_n > 0:
        change = round(((right_n - left_n) / left_n) * 100, 1)
    return {
        **data_mode(),
        "axis": axis,
        "left": {"label": left_label, "count": left_n},
        "right": {"label": right_label, "count": right_n},
        "change_pct": change,
        "insufficient_data": left_n == 0 and right_n == 0,
    }


def cross_case_intelligence() -> Dict[str, Any]:
    entities = _load_entities()
    clusters = []

    def add_cluster(entity_type, entity_id, name, cases, evidence):
        if len(cases) < 2:
            return
        clusters.append({
            "cluster_id": f"{entity_type}-{entity_id}",
            "shared_entity": {"id": entity_id, "name": name, "type": entity_type},
            "related_cases": sorted(cases),
            "connection_strength": "HIGH" if len(cases) >= 3 else "MEDIUM",
            "evidence": evidence,
            "shared": {
                "people": [],
                "phones": [],
                "vehicles": [],
                "organizations": [],
                "locations": [],
            },
        })

    for p in entities.get("persons", []):
        cases = p.get("cases") or []
        if len(cases) > 1:
            add_cluster("Person", p["id"], p["name"], cases, "FIR / entity registry")

    for o in entities.get("organizations", []):
        cases = o.get("cases") or []
        if len(cases) > 1:
            add_cluster("Organization", o["id"], o["name"], cases, "Company / shell registry")

    for v in entities.get("vehicles", []):
        cases = v.get("cases") or []
        if len(cases) > 1:
            add_cluster("Vehicle", v["id"], v.get("plate") or v["id"], cases, "Vehicle registry")

    for loc in entities.get("locations", []):
        cases = loc.get("cases") or []
        if len(cases) > 1:
            add_cluster("Location", loc["id"], loc["name"], cases, "Incident location")

    # Phones via person linkage
    person_by_id = {p["id"]: p for p in entities.get("persons", [])}
    for ph in entities.get("phone_numbers", []):
        person = person_by_id.get(ph.get("person_id"))
        if not person:
            continue
        cases = person.get("cases") or []
        if len(cases) > 1:
            add_cluster("Phone", ph["number"], ph["number"], cases, "CDR / phone registry")

    # Enrich shared buckets per cluster by intersecting entity sets
    for cl in clusters:
        case_set = set(cl["related_cases"])
        cl["shared"]["people"] = [
            {"id": p["id"], "name": p["name"]}
            for p in entities.get("persons", [])
            if len(set(p.get("cases") or []) & case_set) >= 1 and len(set(p.get("cases") or []) & case_set) == len(set(p.get("cases") or []) & case_set)
            and len(set(p.get("cases") or []) & case_set) >= 1
            and len([c for c in (p.get("cases") or []) if c in case_set]) >= 1
            and len(set(p.get("cases") or []) & case_set) >= 2
        ][:6]
        cl["shared"]["organizations"] = [
            {"id": o["id"], "name": o["name"]}
            for o in entities.get("organizations", [])
            if len(set(o.get("cases") or []) & case_set) >= 2
        ][:6]
        cl["shared"]["vehicles"] = [
            {"id": v["id"], "name": v.get("plate") or v["id"]}
            for v in entities.get("vehicles", [])
            if len(set(v.get("cases") or []) & case_set) >= 2
        ][:6]
        cl["shared"]["locations"] = [
            {"id": loc["id"], "name": loc["name"]}
            for loc in entities.get("locations", [])
            if len(set(loc.get("cases") or []) & case_set) >= 2
        ][:6]
        cl["shared"]["phones"] = [
            {"id": ph["number"], "name": ph["number"]}
            for ph in entities.get("phone_numbers", [])
            if person_by_id.get(ph.get("person_id"))
            and len(set(person_by_id[ph["person_id"]].get("cases") or []) & case_set) >= 2
        ][:6]

    # Deduplicate similar clusters by case set + primary entity
    clusters.sort(key=lambda c: (len(c["related_cases"]), c["connection_strength"] == "HIGH"), reverse=True)

    return {
        **data_mode(),
        "total_links": len(clusters),
        "clusters": clusters[:40],
        "shared_people_count": sum(1 for p in entities.get("persons", []) if len(p.get("cases") or []) > 1),
        "shared_org_count": sum(1 for o in entities.get("organizations", []) if len(o.get("cases") or []) > 1),
        "shared_phone_count": sum(
            1
            for ph in entities.get("phone_numbers", [])
            if person_by_id.get(ph.get("person_id"))
            and len(person_by_id[ph["person_id"]].get("cases") or []) > 1
        ),
    }


def network_overview(
    case_id: Optional[str] = None,
    crime_type: Optional[str] = None,
    entity_type: Optional[str] = None,
) -> Dict[str, Any]:
    fb = graph_analytics._load_fallback_graph()
    nodes = fb.get("nodes", [])
    edges = fb.get("edges", [])

    if case_id:
        nodes = [n for n in nodes if case_id in (n.get("cases") or [])]
        ids = {n["id"] for n in nodes}
        edges = [e for e in edges if e.get("source") in ids and e.get("target") in ids]

    if crime_type and crime_type.lower() not in ("all", ""):
        allowed_cases = {
            c["case_number"]
            for c in _load_cases()
            if crime_type.lower() in (c.get("crime_category") or "").lower()
        }
        nodes = [n for n in nodes if set(n.get("cases") or []) & allowed_cases]
        ids = {n["id"] for n in nodes}
        edges = [e for e in edges if e.get("source") in ids and e.get("target") in ids]

    if entity_type and entity_type.lower() not in ("all", ""):
        et = entity_type.lower()
        nodes = [n for n in nodes if et in graph_analytics._infer_entity_type(n).lower()]
        ids = {n["id"] for n in nodes}
        edges = [e for e in edges if e.get("source") in ids and e.get("target") in ids]

    n_nodes, n_edges = len(nodes), len(edges)
    density = round((2 * n_edges) / (n_nodes * (n_nodes - 1)), 4) if n_nodes > 1 else 0.0

    # Degree scores
    degree: Dict[str, int] = defaultdict(int)
    for e in edges:
        degree[e["source"]] += 1
        degree[e["target"]] += 1

    node_map = {n["id"]: n for n in nodes}
    top_connected = sorted(
        (
            {
                "id": nid,
                "name": node_map.get(nid, {}).get("name") or nid,
                "degree": deg,
                "type": graph_analytics._infer_entity_type(node_map.get(nid, {})),
                "cases": node_map.get(nid, {}).get("cases") or [],
            }
            for nid, deg in degree.items()
            if nid in node_map
        ),
        key=lambda x: x["degree"],
        reverse=True,
    )[:12]

    bridges = [
        e for e in top_connected
        if len(e.get("cases") or []) > 1
    ][:8]

    # Aggregated preview graph (top nodes only)
    keep = {e["id"] for e in top_connected[:20]}
    preview_nodes = [
        {
            "id": n["id"],
            "label": n.get("name") or n["id"],
            "type": graph_analytics._infer_entity_type(n),
            "degree": degree.get(n["id"], 0),
            "cases": n.get("cases") or [],
        }
        for n in nodes
        if n["id"] in keep
    ]
    preview_edges = [
        {"source": e["source"], "target": e["target"], "type": e.get("type")}
        for e in edges
        if e.get("source") in keep and e.get("target") in keep
    ]

    return {
        **data_mode(),
        "stats": {
            "nodes": n_nodes,
            "edges": n_edges,
            "density": density,
            "bridge_entities": len(bridges),
            "cross_case_entities": sum(1 for n in nodes if len(n.get("cases") or []) > 1),
        },
        "highly_connected": top_connected,
        "bridge_entities": bridges,
        "preview": {"nodes": preview_nodes, "edges": preview_edges},
        "note": "Macro overview — filtered/aggregated. Not a full unfiltered dump.",
    }


def communities() -> Dict[str, Any]:
    """Connected components over the entity graph, labeled as network communities."""
    fb = graph_analytics._load_fallback_graph()
    nodes = fb.get("nodes", [])
    edges = fb.get("edges", [])
    adj = graph_analytics._build_adjacency(edges)
    node_map = {n["id"]: n for n in nodes}

    visited: Set[str] = set()
    communities_out = []
    idx = 1

    for nid in list(node_map.keys()):
        if nid in visited:
            continue
        stack = [nid]
        comp: List[str] = []
        while stack:
            cur = stack.pop()
            if cur in visited:
                continue
            visited.add(cur)
            if cur not in node_map:
                continue
            comp.append(cur)
            for nb in adj.get(cur, set()):
                if nb not in visited:
                    stack.append(nb)
        if len(comp) < 2:
            continue

        case_set: Set[str] = set()
        loc_set: Set[str] = set()
        degrees = []
        for cid in comp:
            n = node_map[cid]
            case_set.update(n.get("cases") or [])
            if graph_analytics._infer_entity_type(n) == "Location":
                loc_set.add(n.get("name") or cid)
            degrees.append((cid, len(adj.get(cid, set()))))
        degrees.sort(key=lambda x: x[1], reverse=True)
        key_id = degrees[0][0] if degrees else comp[0]
        key_node = node_map.get(key_id, {})

        cross = sum(1 for cid in comp if len(node_map[cid].get("cases") or []) > 1)

        communities_out.append({
            "community_id": f"COMMUNITY-{idx:02d}",
            "label": "NETWORK COMMUNITY",
            "entities": len(comp),
            "entity_ids": comp[:40],
            "cases": sorted(case_set),
            "case_count": len(case_set),
            "locations": sorted(loc_set)[:8],
            "location_count": len(loc_set),
            "key_entity": {
                "id": key_id,
                "name": key_node.get("name") or key_id,
                "degree": degrees[0][1] if degrees else 0,
            },
            "cross_case_links": cross,
        })
        idx += 1

    communities_out.sort(key=lambda c: (c["case_count"], c["entities"]), reverse=True)
    return {
        **data_mode(),
        "total": len(communities_out),
        "communities": communities_out[:20],
    }


def key_entities() -> Dict[str, Any]:
    entities = _load_entities()
    fb = graph_analytics._load_fallback_graph()
    edges = fb.get("edges", [])
    degree: Dict[str, int] = defaultdict(int)
    for e in edges:
        degree[e.get("source")] += 1
        degree[e.get("target")] += 1

    rows = []
    for p in entities.get("persons", []):
        cases = p.get("cases") or []
        deg = degree.get(p["id"], 0)
        cross = len(cases)
        classification = "BRIDGE ENTITY" if cross > 1 else "CONNECTED ENTITY"
        explanation = (
            f"Appears across {cross} case(s) and has {deg} graph connection(s). "
            + (
                "Connects otherwise separated case clusters."
                if cross > 1
                else "Degree reflects local connectivity within known cases."
            )
        )
        # Betweenness proxy: cross-case degree (honest about being a proxy)
        betweenness = "High" if cross >= 3 else "Medium" if cross == 2 else "Low"
        rows.append({
            "entity_id": p["id"],
            "name": p["name"],
            "type": "Person",
            "cases": cases,
            "case_count": len(cases),
            "connections": deg,
            "degree": deg,
            "betweenness": betweenness,
            "betweenness_note": "Proxy from cross-case degree (not full pairwise betweenness).",
            "cross_case": cross,
            "classification": classification,
            "explanation": explanation,
            "disclaimer": "Centrality is not proof of criminal activity.",
        })

    rows.sort(key=lambda r: (r["cross_case"], r["degree"]), reverse=True)
    return {**data_mode(), "entities": rows[:20]}


def discover_patterns(**filters) -> Dict[str, Any]:
    entities = _load_entities()
    heat = build_heatmap(mode="density", **filters)
    trends = crime_trends(**filters)
    cross = cross_case_intelligence()
    patterns = []

    for r in heat["regions"]:
        if r["repeated"] and r["case_count"] >= 2:
            patterns.append({
                "pattern_id": f"PAT-LOC-{r['id']}",
                "type": "Repeated Location",
                "title": f"Repeated activity in {r['name']}",
                "what": f"{r['case_count']} cases linked to {r['name']}",
                "where": r["name"],
                "when": " → ".join(r.get("months_covered") or []) or "Insufficient date coverage",
                "case_count": r["case_count"],
                "cases": r["cases"],
                "entities": [],
                "trend": r["trend"],
                "why": "Multiple cases map to the same geographic region/location nodes in the dataset.",
                "evidence": ["Location registry", "FIR jurisdiction / incident locations"],
                "confidence": round(min(0.95, 0.55 + 0.1 * r["case_count"]), 2),
                "confidence_reason": "Based on count of linked cases at this location (not a model score).",
            })

    for t in trends.get("by_type", []):
        if t["direction"] in ("increasing", "decreasing") and t["total"] >= 1:
            patterns.append({
                "pattern_id": f"PAT-TREND-{t['crime_type'][:12].replace(' ', '_')}",
                "type": "Crime Trend",
                "title": f"{t['crime_type']} is {t['direction']}",
                "what": f"{t['crime_type']}: {t['previous']} → {t['current']} cases across comparison periods",
                "where": "Filtered geography",
                "when": "Period split of filtered incident dates",
                "case_count": t["total"],
                "cases": [],
                "entities": [],
                "trend": t["direction"],
                "why": f"Period comparison change_pct={t['change_pct']}",
                "evidence": ["Case incident_date", "crime_category"],
                "confidence": 0.7 if t["change_pct"] is not None else 0.5,
                "confidence_reason": "Derived from period case counts only.",
            })

    for cl in cross.get("clusters", [])[:12]:
        se = cl["shared_entity"]
        patterns.append({
            "pattern_id": f"PAT-X-{cl['cluster_id']}",
            "type": "Cross-Case Entity",
            "title": f"Recurring {se['type'].lower()}: {se['name']}",
            "what": f"{se['name']} appears in cases {', '.join(cl['related_cases'])}",
            "where": "Cross-jurisdiction",
            "when": "Across registered case dates",
            "case_count": len(cl["related_cases"]),
            "cases": cl["related_cases"],
            "entities": [se["name"]],
            "trend": "recurring",
            "why": f"Same {se['type'].lower()} entity is linked to multiple case numbers in ground-truth data.",
            "evidence": [cl.get("evidence") or "Entity registry"],
            "confidence": 0.85 if cl["connection_strength"] == "HIGH" else 0.7,
            "confidence_reason": "Deterministic multi-case membership; not ML confidence.",
        })

    return {
        **data_mode(),
        "total": len(patterns),
        "patterns": patterns,
    }


def ask_analyst(question: str) -> Dict[str, Any]:
    """Rule-based analyst Q&A over computed intelligence (no invented stats)."""
    q = (question or "").lower().strip()
    if not q:
        return {**data_mode(), "answer": "Ask a question about crime geography, trends, entities, or patterns.", "evidence": []}

    heat = build_heatmap()
    trends = crime_trends()
    cross = cross_case_intelligence()
    pats = discover_patterns()
    keys = key_entities()
    comm = communities()

    findings = []

    if any(w in q for w in ("increasing", "rise", "grew", "growth")):
        zones = [r for r in heat["regions"] if r["trend"] == "increasing"]
        types = trends.get("increasing", [])
        findings.append({
            "finding": "Increasing activity (period comparison)",
            "evidence": {
                "zones": [{"name": z["name"], "prev": z["prev_count"], "curr": z["curr_count"], "change_pct": z["change_pct"]} for z in zones],
                "crime_types": types,
            },
            "reason": "Later half of incident dates has more cases than earlier half for listed items.",
            "confidence": 0.75,
            "data_sources": ["CASE_METADATA.incident_date", "location registry"],
        })

    if any(w in q for w in ("decreasing", "decline", "drop", "fell")):
        zones = [r for r in heat["regions"] if r["trend"] == "decreasing"]
        findings.append({
            "finding": "Decreasing zones",
            "evidence": [{"name": z["name"], "prev": z["prev_count"], "curr": z["curr_count"]} for z in zones],
            "reason": "Later-period counts are lower than earlier-period counts.",
            "confidence": 0.75 if zones else 0.4,
            "data_sources": ["CASE_METADATA.incident_date"],
        })

    if any(w in q for w in ("repeated", "recurring", "location")):
        findings.append({
            "finding": "Repeated locations",
            "evidence": [
                {"name": r["name"], "cases": r["cases"]}
                for r in heat["regions"]
                if r["repeated"] and r["case_count"] >= 2
            ],
            "reason": "Locations/regions linked to multiple case IDs.",
            "confidence": 0.9,
            "data_sources": ["ground_truth_entities.locations"],
        })

    if any(w in q for w in ("cross", "connected case", "shared", "multi-case", "across")):
        findings.append({
            "finding": "Cross-case connections",
            "evidence": cross.get("clusters", [])[:8],
            "reason": "Entities whose cases array contains more than one case number.",
            "confidence": 0.9,
            "data_sources": ["ground_truth_entities"],
        })

    if any(w in q for w in ("communit", "cluster")):
        findings.append({
            "finding": "Network communities",
            "evidence": comm.get("communities", [])[:5],
            "reason": "Connected components of the entity relationship graph.",
            "confidence": 0.8,
            "data_sources": ["ground_truth_graph"],
        })

    if any(w in q for w in ("important", "central", "bridge", "key entit")):
        findings.append({
            "finding": "Key / bridge entities",
            "evidence": keys.get("entities", [])[:6],
            "reason": "Ranked by cross-case membership and graph degree. Not guilt.",
            "confidence": 0.8,
            "data_sources": ["ground_truth_graph", "ground_truth_entities.persons"],
        })

    if any(w in q for w in ("pattern", "investigate", "lead", "should")):
        findings.append({
            "finding": "Patterns for investigator follow-up",
            "evidence": pats.get("patterns", [])[:6],
            "reason": "Deterministic patterns from geography, trends, and multi-case entities.",
            "confidence": 0.8,
            "data_sources": ["cases", "entities", "graph"],
        })

    if any(w in q for w in ("crime type", "which crime", "most")):
        findings.append({
            "finding": "Crime type volumes / period changes",
            "evidence": trends.get("by_type", []),
            "reason": "Counts grouped by crime_category prefix and period split.",
            "confidence": 0.85,
            "data_sources": ["CASE_METADATA"],
        })

    if not findings:
        findings.append({
            "finding": "Overview summary",
            "evidence": overview().get("summary"),
            "reason": "No specific intent matched; returning computed overview counts.",
            "confidence": 0.7,
            "data_sources": ["cases", "entities", "graph"],
        })

    # Build plain-language answer from first finding
    f0 = findings[0]
    answer = f"{f0['finding']}. Reason: {f0['reason']} Data mode: {data_mode()['label']}."

    return {
        **data_mode(),
        "question": question,
        "answer": answer,
        "findings": findings,
    }
