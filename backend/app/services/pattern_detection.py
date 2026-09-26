"""
Suspicious Pattern Detection Engine
===================================
Forensic detection modules analyzing CDR records, financial transactions, and graph topologies.
All detection rules use configurable thresholds and generate objective, explainable findings
with full provenance citations (source_document_id, row references, timestamps).

Key Modules:
1. CDR Patterns:
   - Burner SIM detection (short active lifespan + high-frequency suspect contact)
   - Night-time call bursts (unusual call volume between 23:00 and 05:00)
   - Multi-Identity IMEI Reuse (single handset linked to multiple distinct SIMs)
2. Financial Patterns:
   - Structuring / Smurfing (multiple small deposits followed by rapid large withdrawal)
   - Circular Transfers (cycles of funds A -> B -> C -> A or A -> B -> A)
   - Mule Accounts (high-velocity pass-through with rapid fund drainage)
3. Temporal & Geographic:
   - Cross-Jurisdiction Handoffs (rapid geographic movement > 100 km in < 3 hours verified via Haversine)
"""
from __future__ import annotations

import csv
import io
import math
import os
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

from app.services.graph_store import compute_evidentiary_strength, get_graph_store

# Geographic coordinates for cell tower / location hubs
CITY_COORDINATES: Dict[str, Tuple[float, float]] = {
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "rohini": (28.7041, 77.1025),
    "karol bagh": (28.6511, 77.1907),
    "okhla": (28.5355, 77.2710),
    "pahar ganj": (28.6432, 77.2144),
    "noida": (28.5355, 77.3910),
    "gurgaon": (28.4595, 77.0266),
    "gurugram": (28.4595, 77.0266),
    "meerut": (28.9845, 77.7064),
    "lucknow": (26.8467, 80.9462),
    "kanpur": (26.4499, 80.3319),
    "mumbai": (19.0760, 72.8777),
    "bandra": (19.0596, 72.8295),
    "andheri": (19.1136, 72.8697),
    "dharavi": (19.0434, 72.8567),
    "pune": (18.5204, 73.8567),
    "nagpur": (21.1458, 79.0882),
    "ahmedabad": (23.0225, 72.5714),
    "surat": (21.1702, 72.8311),
    "bengaluru": (12.9716, 77.5946),
    "bangalore": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "salt lake": (22.5804, 88.4180),
    "patna": (25.5941, 85.1376),
    "jaipur": (26.9124, 75.7873),
    "chandigarh": (30.7333, 76.7794),
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(radius_km * c, 2)


def resolve_coordinates(location_str: str) -> Optional[Tuple[float, float]]:
    """Resolve latitude/longitude coordinates from location description."""
    if not location_str:
        return None
    loc_lower = str(location_str).lower()
    for key, coords in CITY_COORDINATES.items():
        if key in loc_lower:
            return coords
    return None


@dataclass
class PatternConfig:
    """Configurable thresholds for all suspicious pattern detection rules."""
    # Financial Structuring
    structuring_min_deposits: int = 3
    structuring_max_deposit_amount: float = 100000.0  # INR 1,00,000 per deposit
    structuring_window_hours: float = 48.0
    structuring_min_large_withdrawal: float = 100000.0

    # Financial Circular Transfers
    circular_window_days: float = 7.0
    circular_min_cycle_length: int = 2
    circular_max_cycle_length: int = 5

    # Financial Mule Accounts
    mule_min_inbound_count: int = 1
    mule_drain_ratio: float = 0.75  # 75%+ funds drained
    mule_drain_window_hours: float = 24.0

    # CDR Burner SIMs
    burner_sim_max_active_days: float = 5.0
    burner_sim_min_suspect_calls: int = 4

    # CDR Night-Time Bursts
    night_burst_min_calls: int = 3
    night_start_hour: int = 23
    night_end_hour: int = 5
    night_burst_window_hours: float = 4.0

    # CDR IMEI Multi-Identity Reuse
    imei_multi_identity_min_phones: int = 2

    # Cross-Jurisdiction Handoffs
    cross_jurisdiction_min_km: float = 100.0
    cross_jurisdiction_max_hours: float = 3.0


DEFAULT_CONFIG = PatternConfig()


def _get_project_data_path(*subpaths: str) -> str:
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    project_dir = os.path.dirname(backend_dir)
    return os.path.join(project_dir, "data", *subpaths)


def parse_timestamp(ts_str: Optional[Any]) -> Optional[datetime]:
    if not ts_str:
        return None
    if isinstance(ts_str, datetime):
        return ts_str if ts_str.tzinfo else ts_str.replace(tzinfo=timezone.utc)
    clean = str(ts_str).strip().replace("Z", "+00:00")
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d",
    ):
        try:
            dt = datetime.strptime(clean, fmt)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            continue
    try:
        dt = datetime.fromisoformat(clean)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _normalize_cdr(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Ensure records have consistent keys regardless of whether they come from CSV or test fixtures."""
    norm = []
    for idx, r in enumerate(records, start=1):
        ts = parse_timestamp(r.get("timestamp") or r.get("timestamp_raw"))
        norm.append({
            "row_number": r.get("row_number", idx),
            "source_document_id": r.get("source_document_id", "call_detail_records.csv"),
            "call_id": r.get("call_id") or r.get("id") or f"CDR-{idx}",
            "caller_number": str(r.get("caller_number") or r.get("caller") or "").strip(),
            "receiver_number": str(r.get("receiver_number") or r.get("receiver") or "").strip(),
            "timestamp": ts,
            "timestamp_raw": str(r.get("timestamp_raw") or r.get("timestamp") or ""),
            "duration_seconds": int(r.get("duration_seconds") or r.get("duration_sec") or 0),
            "cell_tower_id": str(r.get("cell_tower_id") or "").strip(),
            "tower_location": str(r.get("tower_location") or "").strip(),
            "tower_lat": r.get("tower_lat"),
            "tower_lon": r.get("tower_lon"),
            "imei_caller": str(r.get("imei_caller") or r.get("imei") or "").strip(),
            "imei_receiver": str(r.get("imei_receiver") or "").strip(),
            "source_case_id": str(r.get("source_case_id") or "").strip(),
            "flagged_suspicious": bool(r.get("flagged_suspicious", False)),
        })
    return norm


def _normalize_financial(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Ensure financial transactions have uniform keys."""
    norm = []
    for idx, r in enumerate(records, start=1):
        ts = parse_timestamp(r.get("timestamp") or r.get("timestamp_raw"))
        amt_raw = r.get("amount") or r.get("amount_inr") or 0
        try:
            amount = float(str(amt_raw).replace(",", "").strip())
        except Exception:
            amount = 0.0

        norm.append({
            "row_number": r.get("row_number", idx),
            "source_document_id": r.get("source_document_id", "financial_transactions.csv"),
            "txn_id": r.get("txn_id") or r.get("transaction_id") or r.get("id") or f"TXN-{idx}",
            "timestamp": ts,
            "timestamp_raw": str(r.get("timestamp_raw") or r.get("timestamp") or ""),
            "sender_account": str(r.get("sender_account") or r.get("account_from") or r.get("from_account") or "").strip(),
            "sender_name": str(r.get("sender_name") or "").strip(),
            "sender_bank": str(r.get("sender_bank") or "").strip(),
            "receiver_account": str(r.get("receiver_account") or r.get("account_to") or r.get("to_account") or "").strip(),
            "receiver_name": str(r.get("receiver_name") or "").strip(),
            "receiver_bank": str(r.get("receiver_bank") or "").strip(),
            "amount": amount,
            "txn_type": str(r.get("txn_type") or r.get("transaction_type") or "TRANSFER").strip(),
            "source_case_id": str(r.get("source_case_id") or "").strip(),
            "flagged_suspicious": bool(r.get("flagged_suspicious", False)),
            "remarks": str(r.get("remarks") or "").strip(),
        })
    return norm


# ── Canonical Loaders ─────────────────────────────────────────────────────────

def load_canonical_cdr_records() -> List[Dict[str, Any]]:
    """Load canonical CDR records from call_detail_records.csv."""
    path = _get_project_data_path("raw", "cdr", "call_detail_records.csv")
    if not os.path.exists(path):
        return []
    records = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, start=2):
            records.append({
                "row_number": idx,
                "source_document_id": "call_detail_records.csv",
                "call_id": row.get("call_id") or f"CDR-{idx}",
                "caller_number": row.get("caller_number", "").strip(),
                "receiver_number": row.get("receiver_number", "").strip(),
                "timestamp": parse_timestamp(row.get("timestamp")),
                "timestamp_raw": row.get("timestamp", ""),
                "duration_seconds": int(row.get("duration_seconds") or row.get("duration_sec") or 0),
                "cell_tower_id": row.get("cell_tower_id", "").strip(),
                "tower_location": row.get("tower_location", "").strip(),
                "imei_caller": row.get("imei_caller", "").strip(),
                "imei_receiver": row.get("imei_receiver", "").strip(),
                "source_case_id": row.get("source_case_id", "").strip(),
                "flagged_suspicious": str(row.get("flagged_suspicious", "")).upper() in ("TRUE", "YES", "1"),
            })
    return records


def load_canonical_financial_records() -> List[Dict[str, Any]]:
    """Load canonical financial transaction records from financial_transactions.csv."""
    path = _get_project_data_path("raw", "financial", "financial_transactions.csv")
    if not os.path.exists(path):
        return []
    records = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, start=2):
            amt_raw = row.get("amount_inr") or row.get("amount") or "0"
            try:
                amount = float(str(amt_raw).replace(",", "").strip())
            except Exception:
                amount = 0.0

            records.append({
                "row_number": idx,
                "source_document_id": "financial_transactions.csv",
                "txn_id": row.get("txn_id") or f"TXN-{idx}",
                "timestamp": parse_timestamp(row.get("timestamp")),
                "timestamp_raw": row.get("timestamp", ""),
                "sender_account": row.get("sender_account", "").strip(),
                "sender_name": row.get("sender_name", "").strip(),
                "sender_bank": row.get("sender_bank", "").strip(),
                "receiver_account": row.get("receiver_account", "").strip(),
                "receiver_name": row.get("receiver_name", "").strip(),
                "receiver_bank": row.get("receiver_bank", "").strip(),
                "amount": amount,
                "txn_type": row.get("txn_type", "TRANSFER").strip(),
                "source_case_id": row.get("source_case_id", "").strip(),
                "flagged_suspicious": str(row.get("flagged_suspicious", "")).upper() in ("TRUE", "YES", "1"),
                "remarks": row.get("remarks", "").strip(),
            })
    return records


# ── Pattern Detection Engine Class ────────────────────────────────────────────

class PatternDetectionEngine:
    """Core analytical pattern engine executing forensic detector modules."""

    def __init__(self, config: Optional[PatternConfig] = None):
        self.config = config or DEFAULT_CONFIG

    # 1. CDR: Burner SIM Detection
    def detect_burner_sims(
        self,
        cdr_records: List[Dict[str, Any]],
        known_suspect_numbers: Optional[Set[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Detect burner SIM indicators:
        - Number active for short duration (<= burner_sim_max_active_days)
        - High-frequency calls (>= burner_sim_min_suspect_calls).
        """
        records = _normalize_cdr(cdr_records)
        patterns = []
        if not records:
            return patterns

        caller_calls: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for r in records:
            if r["caller_number"] and r["timestamp"]:
                caller_calls[r["caller_number"]].append(r)

        for number, calls in caller_calls.items():
            if len(calls) < self.config.burner_sim_min_suspect_calls:
                continue

            timestamps = sorted([c["timestamp"] for c in calls if c["timestamp"]])
            if not timestamps:
                continue

            active_days = (timestamps[-1] - timestamps[0]).total_seconds() / 86400.0

            targets = {c["receiver_number"] for c in calls if c["receiver_number"]}
            suspect_contacts = (
                len([c for c in calls if c["receiver_number"] in known_suspect_numbers])
                if known_suspect_numbers
                else len(calls)
            )

            if active_days <= self.config.burner_sim_max_active_days and suspect_contacts >= self.config.burner_sim_min_suspect_calls:
                support = [
                    {
                        "source_document_id": c["source_document_id"],
                        "row_reference": f"row {c['row_number']}",
                        "timestamp": c["timestamp_raw"],
                        "details": f"Call to {c['receiver_number']} (duration {c['duration_seconds']}s, tower {c['cell_tower_id']})",
                    }
                    for c in calls[:6]
                ]
                cases = sorted(list({c["source_case_id"] for c in calls if c["source_case_id"]}))
                reason = (
                    f"Number {number} exhibits burner-SIM characteristics: active for only {active_days:.1f} day(s) "
                    f"with {len(calls)} calls to {len(targets)} recipient(s). Pattern warrants review."
                )
                strength = compute_evidentiary_strength(
                    confidence=0.88,
                    verification_status="AI_SUGGESTED",
                    evidence_snippet=reason,
                    source_document_id=calls[0]["source_document_id"],
                    distinct_docs_count=max(1, len(set(c["source_document_id"] for c in calls))),
                )

                patterns.append({
                    "pattern_id": f"PAT-CDR-BURNER-{abs(hash(number)) % 10000:04d}",
                    "type": "BURNER_SIM_SWITCH",
                    "pattern_name": "Burner SIM Switch / Short Lifespan",
                    "title": f"Short-Lived Burner SIM Activity: {number}",
                    "severity": "HIGH",
                    "confidence": 0.88,
                    "evidentiary_strength": strength,
                    "cases": cases,
                    "entities": [number],
                    "supporting_records": support,
                    "reason": reason,
                    "rule_id": "TEL-04",
                    "rule": "Rule TEL-04: Short active duration (<=5 days) with concentrated call frequency",
                    "action_recommended": "Execute Section 91 CrPC notice for Customer Acquisition Form (CAF) and cell tower trace.",
                })

        return patterns

    # 2. CDR: Night-Time Call Bursts
    def detect_night_bursts(self, cdr_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect unusual night-time call bursts (>= night_burst_min_calls between 23:00 and 05:00)."""
        records = _normalize_cdr(cdr_records)
        patterns = []
        if not records:
            return patterns

        night_calls: Dict[Tuple[str, str, str], List[Dict[str, Any]]] = defaultdict(list)
        for r in records:
            dt = r["timestamp"]
            if not dt:
                continue
            hour = dt.hour
            if hour >= self.config.night_start_hour or hour < self.config.night_end_hour:
                date_key = dt.strftime("%Y-%m-%d")
                pair_key = (r["caller_number"], r["receiver_number"], date_key)
                night_calls[pair_key].append(r)

        for (caller, receiver, date_key), calls in night_calls.items():
            if len(calls) >= self.config.night_burst_min_calls:
                cases = sorted(list({c["source_case_id"] for c in calls if c["source_case_id"]}))
                support = [
                    {
                        "source_document_id": c["source_document_id"],
                        "row_reference": f"row {c['row_number']}",
                        "timestamp": c["timestamp_raw"],
                        "details": f"Night call from {caller} to {receiver} ({c['duration_seconds']}s, tower {c['cell_tower_id']})",
                    }
                    for c in calls
                ]
                reason = (
                    f"Unusual communication burst: {len(calls)} calls exchanged between {caller} and {receiver} "
                    f"during late night hours ({self.config.night_start_hour}:00 - {self.config.night_end_hour}:00) on {date_key}. Warrants review."
                )
                strength = compute_evidentiary_strength(
                    confidence=0.85,
                    verification_status="AI_SUGGESTED",
                    evidence_snippet=reason,
                    source_document_id=calls[0]["source_document_id"],
                    distinct_docs_count=1,
                )

                patterns.append({
                    "pattern_id": f"PAT-CDR-NIGHT-{abs(hash((caller, receiver, date_key))) % 10000:04d}",
                    "type": "NIGHT_BURST_COMMUNICATION",
                    "pattern_name": "Night-Time Call Burst",
                    "title": f"Night-Time Call Burst: {caller} ⇄ {receiver}",
                    "severity": "HIGH",
                    "confidence": 0.85,
                    "evidentiary_strength": strength,
                    "cases": cases,
                    "entities": [caller, receiver],
                    "supporting_records": support,
                    "reason": reason,
                    "rule_id": "CDR-02",
                    "rule": "Rule CDR-02: Concentrated off-hours communication burst (23:00-05:00)",
                    "action_recommended": "Cross-reference call tower coordinate dump with known incident locations for the specified timeframe.",
                })

        return patterns

    # 3. CDR: Multi-Identity Device (IMEI Reuse)
    def detect_imei_multi_identity(self, cdr_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect single physical handset IMEI linked to multiple distinct phone identities."""
        records = _normalize_cdr(cdr_records)
        patterns = []
        if not records:
            return patterns

        imei_to_numbers: Dict[str, Set[str]] = defaultdict(set)
        imei_to_records: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        for r in records:
            imei = r.get("imei_caller")
            if imei and len(imei) >= 8 and r.get("caller_number"):
                imei_to_numbers[imei].add(r["caller_number"])
                imei_to_records[imei].append(r)

        for imei, numbers in imei_to_numbers.items():
            if len(numbers) >= self.config.imei_multi_identity_min_phones:
                calls = imei_to_records[imei]
                cases = sorted(list({c["source_case_id"] for c in calls if c["source_case_id"]}))
                support = [
                    {
                        "source_document_id": c["source_document_id"],
                        "row_reference": f"row {c['row_number']}",
                        "timestamp": c["timestamp_raw"],
                        "details": f"Handset IMEI {imei} used with SIM {c['caller_number']}",
                    }
                    for c in calls[:6]
                ]
                reason = (
                    f"Physical handset IMEI {imei} was operated with {len(numbers)} distinct SIM numbers "
                    f"({', '.join(sorted(numbers))}). Multi-identity hardware reuse warrants review."
                )
                strength = compute_evidentiary_strength(
                    confidence=0.92,
                    verification_status="AI_SUGGESTED",
                    evidence_snippet=reason,
                    source_document_id=calls[0]["source_document_id"],
                    distinct_docs_count=max(1, len(set(c["source_document_id"] for c in calls))),
                )

                patterns.append({
                    "pattern_id": f"PAT-CDR-IMEI-{abs(hash(imei)) % 10000:04d}",
                    "type": "IMEI_MULTI_IDENTITY_REUSE",
                    "pattern_name": "Multi-Identity IMEI Reuse",
                    "title": f"Multi-SIM Handset Hardware Reuse: IMEI {imei}",
                    "severity": "CRITICAL",
                    "confidence": 0.92,
                    "evidentiary_strength": strength,
                    "cases": cases,
                    "entities": sorted(list(numbers)) + [imei],
                    "supporting_records": support,
                    "reason": reason,
                    "rule_id": "TEL-05",
                    "rule": "Rule TEL-05: Single hardware IMEI mapped to 2+ distinct MSISDN subscriber lines",
                    "action_recommended": "Request handset hardware history and trace all associated SIM cards across telecom operators.",
                })

        return patterns

    # 4. Financial: Structuring / Smurfing
    def detect_structuring(self, financial_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detect structuring:
        - 3+ deposits under structuring_max_deposit_amount
        - within structuring_window_hours (48h)
        - followed by a large withdrawal / outbound transfer >= structuring_min_large_withdrawal.
        """
        records = _normalize_financial(financial_records)
        patterns = []
        if not records:
            return patterns

        acc_inbound: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        acc_outbound: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        for r in records:
            if r["timestamp"]:
                if r["receiver_account"]:
                    acc_inbound[r["receiver_account"]].append(r)
                if r["sender_account"]:
                    acc_outbound[r["sender_account"]].append(r)

        for acc, in_txns in acc_inbound.items():
            in_sorted = sorted(in_txns, key=lambda x: x["timestamp"])
            out_txns = sorted(acc_outbound.get(acc, []), key=lambda x: x["timestamp"])

            # Find sequences of 3+ small deposits
            small_deposits = [t for t in in_sorted if 0 < t["amount"] <= self.config.structuring_max_deposit_amount]
            if len(small_deposits) < self.config.structuring_min_deposits:
                continue

            for i in range(len(small_deposits) - self.config.structuring_min_deposits + 1):
                window_deposits = small_deposits[i : i + self.config.structuring_min_deposits]
                t_first = window_deposits[0]["timestamp"]
                t_last = window_deposits[-1]["timestamp"]
                span_hours = (t_last - t_first).total_seconds() / 3600.0

                if span_hours <= self.config.structuring_window_hours:
                    total_in = sum(t["amount"] for t in window_deposits)
                    subsequent_out = [
                        t for t in out_txns
                        if t["timestamp"] >= t_first
                        and (t["timestamp"] - t_last).total_seconds() / 3600.0 <= self.config.structuring_window_hours
                        and t["amount"] >= self.config.structuring_min_large_withdrawal
                    ]

                    if subsequent_out:
                        large_out = subsequent_out[0]
                        cases = sorted(list({t["source_case_id"] for t in window_deposits + [large_out] if t["source_case_id"]}))
                        support = [
                            {
                                "source_document_id": t["source_document_id"],
                                "row_reference": f"row {t['row_number']}",
                                "timestamp": t["timestamp_raw"],
                                "details": f"Deposit of Rs {t['amount']:,.0f} from {t['sender_name'] or t['sender_account']}",
                            }
                            for t in window_deposits
                        ]
                        support.append({
                            "source_document_id": large_out["source_document_id"],
                            "row_reference": f"row {large_out['row_number']}",
                            "timestamp": large_out["timestamp_raw"],
                            "details": f"Large outbound transfer/withdrawal of Rs {large_out['amount']:,.0f} to {large_out['receiver_name'] or large_out['receiver_account']}",
                        })

                        acc_holder = window_deposits[0].get("receiver_name") or acc
                        reason = (
                            f"Structuring / Smurfing sequence detected on Account {acc} ({acc_holder}): "
                            f"{len(window_deposits)} small deposits totaling Rs {total_in:,.0f} received within {span_hours:.1f} hours, "
                            f"followed by a rapid large transfer of Rs {large_out['amount']:,.0f}. Warrants review."
                        )
                        strength = compute_evidentiary_strength(
                            confidence=0.94,
                            verification_status="AI_SUGGESTED",
                            evidence_snippet=reason,
                            source_document_id=window_deposits[0]["source_document_id"],
                            distinct_docs_count=1,
                        )

                        patterns.append({
                            "pattern_id": f"PAT-FIN-STRUCT-{abs(hash((acc, t_first.isoformat()))) % 10000:04d}",
                            "type": "STRUCTURING_SMURFING",
                            "pattern_name": "Structuring / Smurfing",
                            "title": f"Structuring / Smurfing Layering: Account {acc}",
                            "severity": "CRITICAL",
                            "confidence": 0.94,
                            "evidentiary_strength": strength,
                            "cases": cases,
                            "entities": [acc],
                            "supporting_records": support,
                            "reason": reason,
                            "rule_id": "FIN-01",
                            "rule": f"Rule FIN-01: {self.config.structuring_min_deposits}+ deposits under Rs {self.config.structuring_max_deposit_amount:,.0f} within {self.config.structuring_window_hours:.0f}h before large withdrawal",
                            "action_recommended": "Submit urgent PMLA STR (Suspicious Transaction Report) to FIU-IND and request Section 91 CrPC account ledger dump.",
                        })

        return patterns

    # 5. Financial: Circular Transfers
    def detect_circular_transfers(self, financial_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect circular fund flows (cycles A -> B -> C -> A within circular_window_days)."""
        records = _normalize_financial(financial_records)
        patterns = []
        if not records:
            return patterns

        edge_txns: Dict[Tuple[str, str], List[Dict[str, Any]]] = defaultdict(list)
        adj: Dict[str, Set[str]] = defaultdict(set)
        for r in records:
            if r["sender_account"] and r["receiver_account"] and r["timestamp"]:
                u, v = r["sender_account"], r["receiver_account"]
                if u != v:
                    edge_txns[(u, v)].append(r)
                    adj[u].add(v)

        detected_cycles: Set[Tuple[str, ...]] = set()

        for start_node in list(adj.keys()):
            stack: List[Tuple[str, List[str]]] = [(start_node, [start_node])]
            while stack:
                curr, path = stack.pop()
                if len(path) > (self.config.circular_max_cycle_length + 1):
                    continue

                for nxt in adj.get(curr, set()):
                    if nxt == start_node and (len(path) >= self.config.circular_min_cycle_length):
                        cycle_nodes = tuple(path)
                        min_idx = cycle_nodes.index(min(cycle_nodes))
                        canonical = cycle_nodes[min_idx:] + cycle_nodes[:min_idx]

                        if canonical not in detected_cycles:
                            legs = list(zip(canonical, canonical[1:] + (canonical[0],)))
                            full_cycle_txns = []
                            for u, v in legs:
                                txs = edge_txns.get((u, v), [])
                                if txs:
                                    full_cycle_txns.append(txs[0])

                            if len(full_cycle_txns) == len(legs):
                                t_min = min(t["timestamp"] for t in full_cycle_txns)
                                t_max = max(t["timestamp"] for t in full_cycle_txns)
                                span_days = (t_max - t_min).total_seconds() / 86400.0

                                if span_days <= self.config.circular_window_days:
                                    detected_cycles.add(canonical)
                                    cases = sorted(list({t["source_case_id"] for t in full_cycle_txns if t["source_case_id"]}))
                                    total_routed = sum(t["amount"] for t in full_cycle_txns)
                                    support = [
                                        {
                                            "source_document_id": t["source_document_id"],
                                            "row_reference": f"row {t['row_number']}",
                                            "timestamp": t["timestamp_raw"],
                                            "details": f"Transfer of Rs {t['amount']:,.0f} from {t['sender_name'] or t['sender_account']} to {t['receiver_name'] or t['receiver_account']}",
                                        }
                                        for t in full_cycle_txns
                                    ]
                                    chain_str = " ➔ ".join(cycle_nodes + (start_node,))
                                    reason = (
                                        f"Circular fund routing loop identified across {len(cycle_nodes)} accounts ({chain_str}) "
                                        f"routing Rs {total_routed:,.0f} within {span_days:.1f} day(s). Round-tripping indicates hawala/layering and warrants review."
                                    )
                                    strength = compute_evidentiary_strength(
                                        confidence=0.95,
                                        verification_status="AI_SUGGESTED",
                                        evidence_snippet=reason,
                                        source_document_id=full_cycle_txns[0]["source_document_id"],
                                        distinct_docs_count=1,
                                    )

                                    patterns.append({
                                        "pattern_id": f"PAT-FIN-CIRC-{abs(hash(canonical)) % 10000:04d}",
                                        "type": "CIRCULAR_TRANSFER",
                                        "pattern_name": "Circular Layering Transfer",
                                        "title": f"Circular Layering Loop: {len(cycle_nodes)}-Account Cycle",
                                        "severity": "CRITICAL",
                                        "confidence": 0.95,
                                        "evidentiary_strength": strength,
                                        "cases": cases,
                                        "entities": list(cycle_nodes),
                                        "supporting_records": support,
                                        "reason": reason,
                                        "rule_id": "FIN-03",
                                        "rule": f"Rule FIN-03: Closed loop transaction cycle (length 2-5) completed within {self.config.circular_window_days:.0f} days",
                                        "action_recommended": "Issue formal freezing order under Section 102 CrPC for participating accounts in the cycle.",
                                    })
                    elif nxt not in path:
                        stack.append((nxt, path + [nxt]))

        return patterns

    # 6. Financial: Mule Account Indicators
    def detect_mule_accounts(self, financial_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect mule accounts: Multiple inbound credits rapidly drained by outbound debits."""
        records = _normalize_financial(financial_records)
        patterns = []
        if not records:
            return patterns

        acc_in: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        acc_out: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        for r in records:
            if r["timestamp"]:
                if r["receiver_account"]:
                    acc_in[r["receiver_account"]].append(r)
                if r["sender_account"]:
                    acc_out[r["sender_account"]].append(r)

        for acc, in_txns in acc_in.items():
            if len(in_txns) < self.config.mule_min_inbound_count:
                continue

            out_txns = acc_out.get(acc, [])
            if not out_txns:
                continue

            total_in = sum(t["amount"] for t in in_txns)
            total_out = sum(t["amount"] for t in out_txns)
            if total_in <= 0:
                continue

            drain_ratio = total_out / total_in
            if drain_ratio >= self.config.mule_drain_ratio:
                all_txns = sorted(in_txns + out_txns, key=lambda x: x["timestamp"])
                span_hours = (all_txns[-1]["timestamp"] - all_txns[0]["timestamp"]).total_seconds() / 3600.0

                if span_hours <= (self.config.mule_drain_window_hours * max(1, len(all_txns) // 2)):
                    cases = sorted(list({t["source_case_id"] for t in all_txns if t["source_case_id"]}))
                    holder = in_txns[0].get("receiver_name") or acc
                    support = [
                        {
                            "source_document_id": t["source_document_id"],
                            "row_reference": f"row {t['row_number']}",
                            "timestamp": t["timestamp_raw"],
                            "details": f"{'Received' if t['receiver_account'] == acc else 'Sent'} Rs {t['amount']:,.0f} ({t['txn_type']})",
                        }
                        for t in all_txns[:6]
                    ]
                    reason = (
                        f"Account {acc} ({holder}) functions as a high-velocity pass-through mule: "
                        f"received Rs {total_in:,.0f} across {len(in_txns)} credits and quickly transferred out Rs {total_out:,.0f} "
                        f"({drain_ratio*100:.0f}% drained within {span_hours:.1f} hours). Warrants review."
                    )
                    strength = compute_evidentiary_strength(
                        confidence=0.91,
                        verification_status="AI_SUGGESTED",
                        evidence_snippet=reason,
                        source_document_id=all_txns[0]["source_document_id"],
                        distinct_docs_count=1,
                    )

                    patterns.append({
                        "pattern_id": f"PAT-FIN-MULE-{abs(hash(acc)) % 10000:04d}",
                        "type": "MULE_ACCOUNT_DISPERSAL",
                        "pattern_name": "Mule Account Pass-Through",
                        "title": f"Mule Account Pass-Through: Account {acc}",
                        "severity": "HIGH",
                        "confidence": 0.91,
                        "evidentiary_strength": strength,
                        "cases": cases,
                        "entities": [acc],
                        "supporting_records": support,
                        "reason": reason,
                        "rule_id": "FIN-02",
                        "rule": f"Rule FIN-02: Rapid dispersal (>={self.config.mule_drain_ratio*100:.0f}% drained in <{self.config.mule_drain_window_hours:.0f}h)",
                        "action_recommended": "Request account beneficiary KYC documents and execute provisional freeze on associated UPI/NetBanking channels.",
                    })

        return patterns

    # 7. Temporal & Geographic: Cross-Jurisdiction Handoffs
    def detect_cross_jurisdiction_handoffs(self, cdr_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detect cross-jurisdiction handoffs using Haversine geographic distance:
        A phone/IMEI active at tower A and tower B where distance >= cross_jurisdiction_min_km (100 km)
        in time <= cross_jurisdiction_max_hours (3 hours).
        """
        records = _normalize_cdr(cdr_records)
        patterns = []
        if not records:
            return patterns

        entity_records: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for r in records:
            if r["caller_number"] and r["timestamp"]:
                entity_records[r["caller_number"]].append(r)

        for entity_id, recs in entity_records.items():
            sorted_recs = sorted(recs, key=lambda x: x["timestamp"])
            for i in range(len(sorted_recs) - 1):
                r1, r2 = sorted_recs[i], sorted_recs[i + 1]
                loc1_str, loc2_str = r1["tower_location"], r2["tower_location"]

                coords1 = (r1["tower_lat"], r1["tower_lon"]) if isinstance(r1.get("tower_lat"), (int, float)) and isinstance(r1.get("tower_lon"), (int, float)) else resolve_coordinates(loc1_str)
                coords2 = (r2["tower_lat"], r2["tower_lon"]) if isinstance(r2.get("tower_lat"), (int, float)) and isinstance(r2.get("tower_lon"), (int, float)) else resolve_coordinates(loc2_str)

                if coords1 and coords2 and coords1 != coords2:
                    dist_km = haversine_km(coords1[0], coords1[1], coords2[0], coords2[1])
                    hours_diff = abs((r2["timestamp"] - r1["timestamp"]).total_seconds()) / 3600.0

                    if dist_km >= self.config.cross_jurisdiction_min_km and 0 < hours_diff <= self.config.cross_jurisdiction_max_hours:
                        cases = sorted(list({r["source_case_id"] for r in (r1, r2) if r["source_case_id"]}))
                        support = [
                            {
                                "source_document_id": r1["source_document_id"],
                                "row_reference": f"row {r1['row_number']}",
                                "timestamp": r1["timestamp_raw"],
                                "details": f"Ping at {loc1_str or coords1} (Tower {r1['cell_tower_id']})",
                            },
                            {
                                "source_document_id": r2["source_document_id"],
                                "row_reference": f"row {r2['row_number']}",
                                "timestamp": r2["timestamp_raw"],
                                "details": f"Ping at {loc2_str or coords2} (Tower {r2['cell_tower_id']})",
                            },
                        ]
                        speed_kmh = dist_km / max(0.1, hours_diff)
                        reason = (
                            f"Rapid cross-jurisdiction movement detected for {entity_id}: moved {dist_km:.1f} km "
                            f"from {loc1_str or 'origin'} to {loc2_str or 'destination'} in {hours_diff:.2f} hours (~{speed_kmh:.0f} km/h). "
                            f"Corroborated via Haversine geographic calculation across cell towers. Warrants review."
                        )
                        strength = compute_evidentiary_strength(
                            confidence=0.89,
                            verification_status="AI_SUGGESTED",
                            evidence_snippet=reason,
                            source_document_id=r1["source_document_id"],
                            distinct_docs_count=1,
                        )

                        patterns.append({
                            "pattern_id": f"PAT-GEO-CROSS-{abs(hash((entity_id, r1['timestamp_raw']))) % 10000:04d}",
                            "type": "CROSS_JURISDICTION_HANDOFF",
                            "pattern_name": "Cross-Jurisdiction Geographic Handoff",
                            "title": f"High-Velocity Geographic Handoff: {entity_id}",
                            "severity": "CRITICAL",
                            "confidence": 0.89,
                            "evidentiary_strength": strength,
                            "cases": cases,
                            "entities": [entity_id],
                            "supporting_records": support,
                            "reason": reason,
                            "rule_id": "GEO-01",
                            "rule": f"Rule GEO-01: Haversine distance >={self.config.cross_jurisdiction_min_km:.0f}km within <={self.config.cross_jurisdiction_max_hours:.0f}h",
                            "action_recommended": "Request toll FASTag sensor logs along the transit corridor and correlate with highway CCTV surveillance.",
                        })

        return patterns

    # Full Pipeline Execution
    def run_all_detectors(
        self,
        cdr_records: Optional[List[Dict[str, Any]]] = None,
        financial_records: Optional[List[Dict[str, Any]]] = None,
        case_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Run all detection modules over datasets and filter optionally by case_id."""
        if cdr_records is None:
            cdr_records = load_canonical_cdr_records()
        if financial_records is None:
            financial_records = load_canonical_financial_records()

        if case_id and case_id.lower() not in ("all", ""):
            cid_clean = case_id.upper().replace("CASE-", "").replace("CASE_", "")
            cdr_records = [c for c in cdr_records if cid_clean in str(c.get("source_case_id", "")).upper()]
            financial_records = [f for f in financial_records if cid_clean in str(f.get("source_case_id", "")).upper()]

        all_patterns = []
        all_patterns.extend(self.detect_structuring(financial_records))
        all_patterns.extend(self.detect_circular_transfers(financial_records))
        all_patterns.extend(self.detect_mule_accounts(financial_records))
        all_patterns.extend(self.detect_burner_sims(cdr_records))
        all_patterns.extend(self.detect_night_bursts(cdr_records))
        all_patterns.extend(self.detect_imei_multi_identity(cdr_records))
        all_patterns.extend(self.detect_cross_jurisdiction_handoffs(cdr_records))

        # Sort by severity (CRITICAL -> HIGH -> MEDIUM) and confidence
        severity_rank = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1}
        all_patterns.sort(
            key=lambda p: (severity_rank.get(p.get("severity", "MEDIUM"), 1), p.get("confidence", 0.8)),
            reverse=True,
        )
        return all_patterns
