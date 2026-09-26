"""
Analyst Intelligence Engine
===========================
Derives geographic density, trends, patterns, communities, and
cross-case signals from case metadata + ground-truth entities/graph + CDR/Financial forensic datasets.

Integrates with PatternDetectionEngine and GraphStore for explainable centrality and multi-source patterns.
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
from app.services.graph_store import get_graph_store, compute_evidentiary_strength
from app.services.pattern_detection import PatternDetectionEngine

logger = logging.getLogger(__name__)

_MEMGRAPH_CACHE: Optional[Tuple[float, bool]] = None
_MEMGRAPH_TTL_SEC = 15.0

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
        for c in cases:
            if geo_q in (c.get("jurisdiction") or "").lower():
                matched_cases.add(c["case_number"])
        cases = [c for c in cases if c["case_number"] in matched_cases]
        case_ids = _case_ids(cases)
        locations = _locations_for_cases(entities, case_ids)

    prev_cases, curr_cases, prev_label, curr_label = _split_periods(cases)
    prev_ids, curr_ids = _case_ids(prev_cases), _case_ids(curr_cases)

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

    # Real mode count statistics for frontend radar pills
    mode_counts = {
        "density": len(regions),
        "increasing": sum(1 for r in regions if r["trend"] == "increasing"),
        "decreasing": sum(1 for r in regions if r["trend"] == "decreasing"),
        "repeated": sum(1 for r in regions if r["repeated"] and r["case_count"] >= 2),
    }

    dm = data_mode()
    return {
        **dm,
        "mode": mode,
        "mode_counts": mode_counts,
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
    """Compute complete intelligence overview metrics dynamically with zero hardcoded values."""
    heat = build_heatmap(mode="density", **filters)
    trends = crime_trends(**filters)
    cross = cross_case_intelligence()
    patterns = discover_patterns(**filters)
    centrality = key_entities()

    increasing = sum(1 for r in heat["regions"] if r["trend"] == "increasing")
    decreasing = sum(1 for r in heat["regions"] if r["trend"] == "decreasing")
    repeated = sum(1 for r in heat["regions"] if r["repeated"] and r["case_count"] >= 2)

    # Key Hub Entities: entities appearing across 2+ cases or betweenness > 0.05
    key_nodes = [
        e for e in centrality.get("entities", [])
        if e.get("cross_case", 0) > 1 or e.get("betweenness", 0) > 0.05
    ]

    # Critical pattern alerts
    critical_pats = [p for p in patterns.get("patterns", []) if p.get("severity") == "CRITICAL"]

    # Period Velocity calculation
    prev_n = heat["period"]["previous_case_count"]
    curr_n = heat["period"]["current_case_count"]
    if prev_n > 0:
        overall_velocity_pct = round(((curr_n - prev_n) / prev_n) * 100, 1)
    elif curr_n > 0:
        overall_velocity_pct = 100.0
    else:
        overall_velocity_pct = 0.0

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
            "key_hub_entities_count": len(key_nodes),
            "critical_patterns_count": len(critical_pats),
            "active_patterns_count": len(patterns.get("patterns", [])),
            "overall_velocity_pct": overall_velocity_pct,
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
        "key_patterns": patterns.get("patterns", [])[:6],
        "cross_case_signals": cross.get("clusters", [])[:6],
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
    axis = (axis or "period").lower()
    cases = _load_cases()

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
    """Identify cross-case bridge entities and flag 3+ case presence as CRITICAL priority."""
    entities = _load_entities()
    clusters = []

    def add_cluster(entity_type, entity_id, name, cases, evidence):
        if len(cases) < 2:
            return
        is_crit = len(cases) >= 3
        strength_label = "CRITICAL" if is_crit else "HIGH"
        ev_strength = compute_evidentiary_strength(
            confidence=0.95 if is_crit else 0.88,
            verification_status="AI_SUGGESTED",
            evidence_snippet=f"Entity {name} active across cases {', '.join(sorted(cases))}",
            source_document_id=evidence,
            distinct_docs_count=len(cases),
        )

        clusters.append({
            "cluster_id": f"{entity_type}-{entity_id}",
            "shared_entity": {"id": entity_id, "name": name, "type": entity_type},
            "related_cases": sorted(cases),
            "connection_strength": strength_label,
            "evidence": evidence,
            "evidentiary_strength": ev_strength,
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

    person_by_id = {p["id"]: p for p in entities.get("persons", [])}
    for ph in entities.get("phone_numbers", []):
        person = person_by_id.get(ph.get("person_id"))
        if not person:
            continue
        cases = person.get("cases") or []
        if len(cases) > 1:
            add_cluster("Phone", ph["number"], ph["number"], cases, "CDR / phone registry")

    for cl in clusters:
        case_set = set(cl["related_cases"])
        cl["shared"]["people"] = [
            {"id": p["id"], "name": p["name"]}
            for p in entities.get("persons", [])
            if len(set(p.get("cases") or []) & case_set) >= 2
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

    clusters.sort(key=lambda c: (c["connection_strength"] == "CRITICAL", len(c["related_cases"])), reverse=True)

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
    store = get_graph_store()
    comm_list = store.get_communities()
    return {
        **data_mode(),
        "total": len(comm_list),
        "communities": comm_list[:20],
    }


def key_entities() -> Dict[str, Any]:
    """
    Identify key influencers and bridge nodes using exact Betweenness Centrality (Brandes algorithm),
    Degree Centrality, and Community Bridging metrics on real graph topology.
    Generates explainable, deterministic plain-language reasons with real numbers.
    """
    store = get_graph_store()
    cent_data = store.get_centrality()
    all_ranked = cent_data.get("all_ranked", [])
    comm_data = store.get_communities()

    node_communities = defaultdict(set)
    for c in comm_data:
        cid = c.get("community_id")
        for mem in c.get("members", []):
            node_communities[mem].add(cid)

    rows = []
    for item in all_ranked:
        nid = item["entity_id"]
        node = store._nodes.get(nid, {})
        name = node.get("name") or item.get("name") or nid
        etype = node.get("type") or "Person"
        cases = node.get("cases") or []
        deg = item.get("degree", 0)
        bw = item.get("betweenness_centrality", 0.0)
        comm_count = max(1, len(node_communities.get(nid, set()) | node_communities.get(name, set())))
        cross_count = len(cases)

        if cross_count >= 3 or (cross_count >= 2 and bw >= 0.08):
            classification = "CRITICAL BRIDGE ENTITY"
            priority_level = "CRITICAL"
        elif cross_count >= 2 or bw >= 0.05:
            classification = "BRIDGE ENTITY"
            priority_level = "HIGH"
        elif deg >= 4:
            classification = "HIGH-DEGREE HUB"
            priority_level = "MEDIUM"
        else:
            classification = "CONNECTED OPERATIVE"
            priority_level = "LOW"

        case_list_str = f"({', '.join(sorted(cases))})" if cases else ""
        explanation = (
            f"Bridges {comm_count} community cluster(s) across {cross_count} case(s) {case_list_str}, "
            f"connects to {deg} graph entities with betweenness centrality {bw:.4f} (warrants review)."
        )

        strength = compute_evidentiary_strength(
            confidence=0.92 if cross_count >= 2 else 0.80,
            verification_status=node.get("verification_status", "AI_SUGGESTED"),
            evidence_snippet=explanation,
            source_document_id=f"Case(s) {', '.join(cases)}" if cases else "Entity Graph",
            distinct_docs_count=max(1, cross_count),
        )

        rows.append({
            "entity_id": nid,
            "name": name,
            "type": etype,
            "cases": sorted(cases),
            "case_count": cross_count,
            "cross_case": cross_count,
            "connections": deg,
            "degree": deg,
            "betweenness": bw,
            "betweenness_centrality": bw,
            "community_count": comm_count,
            "priority_level": priority_level,
            "classification": classification,
            "explanation": explanation,
            "evidentiary_strength": strength,
            "disclaimer": "Centrality reflects network positioning; officer verification required.",
        })

    rows.sort(
        key=lambda r: (
            r["case_count"] >= 3,
            r["case_count"] >= 2,
            r["betweenness"],
            r["degree"],
        ),
        reverse=True,
    )
    return {**data_mode(), "entities": rows[:30]}


def discover_patterns(crime_type: Optional[str] = None, case_id: Optional[str] = None, **filters) -> Dict[str, Any]:
    """
    Comprehensive forensic pattern discovery scanning CDR records, financial transactions,
    and cross-case network topologies.
    """
    engine = PatternDetectionEngine()
    forensic_patterns = engine.run_all_detectors(case_id=case_id)

    heat = build_heatmap(mode="density", crime_type=crime_type, **filters)
    trends = crime_trends(crime_type=crime_type, **filters)
    cross = cross_case_intelligence()

    patterns = list(forensic_patterns)

    for r in heat["regions"]:
        if r["repeated"] and r["case_count"] >= 2:
            cases = r.get("cases", [])
            support = [
                {
                    "source_document_id": "FIR Incident Locations",
                    "row_reference": f"Region: {r['name']}",
                    "timestamp": " — ".join(r.get("months_covered") or []) or "Incident Registry",
                    "details": f"{r['case_count']} incidents recorded in {r['name']} across cases {', '.join(cases)}",
                }
            ]
            reason = f"Recidivist geographic hub: {r['case_count']} cases map to {r['name']} ({', '.join(cases)}). Warrants review."
            strength = compute_evidentiary_strength(
                confidence=round(min(0.95, 0.60 + 0.1 * r["case_count"]), 2),
                verification_status="AI_SUGGESTED",
                evidence_snippet=reason,
                source_document_id="FIR Location Registry",
                distinct_docs_count=len(cases),
            )
            patterns.append({
                "pattern_id": f"PAT-LOC-{r['id']}",
                "type": "REPEATED_LOCATION",
                "title": f"Repeated Jurisdiction Activity: {r['name']}",
                "severity": "HIGH" if r["case_count"] >= 3 else "MEDIUM",
                "confidence": round(min(0.95, 0.60 + 0.1 * r["case_count"]), 2),
                "evidentiary_strength": strength,
                "what": f"{r['case_count']} cases linked to {r['name']}",
                "where": r["name"],
                "when": " → ".join(r.get("months_covered") or []) or "Multi-period",
                "case_count": r["case_count"],
                "cases": cases,
                "entities": [{"id": r["name"], "name": r["name"], "type": "Location"}],
                "supporting_records": support,
                "reason": reason,
                "action_recommended": "Coordinate multi-jurisdiction task force across involved police stations.",
            })

    for cl in cross.get("clusters", [])[:10]:
        se = cl["shared_entity"]
        cases = cl.get("related_cases", [])
        is_crit = len(cases) >= 3
        reason = f"Cross-case bridge entity {se['name']} ({se['type']}) appears across {len(cases)} cases ({', '.join(cases)}). Inter-FIR coordination warrants review."
        strength = compute_evidentiary_strength(
            confidence=0.95 if is_crit else 0.88,
            verification_status="AI_SUGGESTED",
            evidence_snippet=reason,
            source_document_id=cl.get("evidence") or "FIR Registry",
            distinct_docs_count=len(cases),
        )
        patterns.append({
            "pattern_id": f"PAT-X-{cl['cluster_id']}",
            "type": "CROSS_CASE_ENTITY",
            "title": f"Cross-Case Conduit ({'CRITICAL' if is_crit else 'HIGH'}): {se['name']}",
            "severity": "CRITICAL" if is_crit else "HIGH",
            "confidence": 0.95 if is_crit else 0.88,
            "evidentiary_strength": strength,
            "what": f"{se['name']} connects cases {', '.join(cases)}",
            "case_count": len(cases),
            "cases": cases,
            "entities": [{"id": se["id"], "name": se["name"], "type": se["type"]}],
            "supporting_records": [
                {
                    "source_document_id": "FIR Entity Registry",
                    "row_reference": f"Cluster: {cl['cluster_id']}",
                    "timestamp": "Across FIR filing dates",
                    "details": f"Shared in cases {', '.join(cases)} with corroborating {cl.get('evidence', 'registry link')}",
                }
            ],
            "reason": reason,
            "action_recommended": "Issue inter-case intelligence notice and map all shared 1-hop associates in the Knowledge Graph.",
        })

    sev_order = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1}
    patterns.sort(
        key=lambda p: (sev_order.get(p.get("severity", "MEDIUM"), 1), p.get("confidence", 0.8)),
        reverse=True,
    )

    return {
        **data_mode(),
        "total": len(patterns),
        "patterns": patterns,
    }


def ask_analyst(question: str) -> Dict[str, Any]:
    """Rule-based analyst Q&A grounded exclusively in computed analytics."""
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
            "reason": "Ranked by cross-case membership and betweenness centrality. Not guilt.",
            "confidence": 0.8,
            "data_sources": ["ground_truth_graph", "ground_truth_entities.persons"],
        })

    if any(w in q for w in ("pattern", "investigate", "lead", "should")):
        findings.append({
            "finding": "Patterns for investigator follow-up",
            "evidence": pats.get("patterns", [])[:6],
            "reason": "Deterministic patterns from CDR records, financial ledgers, and multi-case links.",
            "confidence": 0.8,
            "data_sources": ["cases", "entities", "graph", "call_detail_records.csv", "financial_transactions.csv"],
        })

    if not findings:
        findings.append({
            "finding": "Overview summary",
            "evidence": overview().get("summary"),
            "reason": "No specific intent matched; returning computed overview counts.",
            "confidence": 0.7,
            "data_sources": ["cases", "entities", "graph"],
        })

    f0 = findings[0]
    answer = f"{f0['finding']}. Reason: {f0['reason']} Data mode: {data_mode()['label']}."

    return {
        **data_mode(),
        "question": question,
        "answer": answer,
        "findings": findings,
    }
