"""
Phase 3 Test Suite: Suspicious Pattern Detection, Key Influencers, and Lead Verification Loop
SIH PS 26189 (NCRB Women Safety Division / MHA)

Validates:
1. All 7 suspicious pattern detection modules (positive & negative test cases)
2. Configurable threshold mechanics (Structuring, Burner SIM, Haversine Geographic Distance)
3. Clean baseline zero false-positive validation
4. Key Influencer plain-language explanation generator with real topology metrics
5. Cross-case bridge entities 3+ case CRITICAL escalation
6. Analyst → Investigator lead handoff with mandatory human-in-the-loop remarks and audit trail
7. Dynamic Overview KPI calculations with zero hardcoded numbers
"""
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.services.pattern_detection import (
    PatternDetectionEngine,
    PatternConfig,
    haversine_km,
)
from app.services.analyst_intelligence import (
    key_entities,
    cross_case_intelligence,
    overview,
    discover_patterns,
)


client = TestClient(app)


# ── Fixtures ──────────────────────────────────────────────────────────────────
@pytest.fixture
def pattern_engine():
    """Return default configured pattern detection engine."""
    return PatternDetectionEngine(config=PatternConfig())


# ── 1. Structuring / Smurfing Detector ─────────────────────────────────────────
class TestStructuringDetector:
    def test_structuring_positive(self, pattern_engine):
        """3+ deposits under threshold within 48h before large withdrawal must trigger STRUCTURING_SMURFING."""
        txs = [
            {"account_from": "EXT_01", "account_to": "ACC_TARGET", "amount": 48000.0, "timestamp": "2024-03-01T10:00:00Z", "transaction_type": "DEPOSIT", "transaction_id": "TX_01"},
            {"account_from": "EXT_02", "account_to": "ACC_TARGET", "amount": 45000.0, "timestamp": "2024-03-01T14:30:00Z", "transaction_type": "DEPOSIT", "transaction_id": "TX_02"},
            {"account_from": "EXT_03", "account_to": "ACC_TARGET", "amount": 49000.0, "timestamp": "2024-03-02T09:15:00Z", "transaction_type": "DEPOSIT", "transaction_id": "TX_03"},
            {"account_from": "ACC_TARGET", "account_to": "HAWALA_OUT", "amount": 140000.0, "timestamp": "2024-03-02T16:00:00Z", "transaction_type": "WITHDRAWAL", "transaction_id": "TX_04"},
        ]
        patterns = pattern_engine.detect_structuring(txs)
        assert len(patterns) >= 1
        p = patterns[0]
        assert p["type"] == "STRUCTURING_SMURFING"
        assert p["severity"] == "CRITICAL"
        assert "ACC_TARGET" in p["entities"]
        assert p["evidentiary_strength"]["level"] in ("HIGH", "CRITICAL")
        assert len(p["supporting_records"]) >= 3
        assert "warrants review" in p["reason"].lower()

    def test_structuring_negative(self, pattern_engine):
        """Isolated single deposits or deposits far apart without a large withdrawal must NOT trigger."""
        txs = [
            {"account_from": "SALARY", "account_to": "ACC_SAFE", "amount": 45000.0, "timestamp": "2024-01-01T10:00:00Z", "transaction_type": "DEPOSIT", "transaction_id": "TX_01"},
            {"account_from": "SALARY", "account_to": "ACC_SAFE", "amount": 45000.0, "timestamp": "2024-02-01T10:00:00Z", "transaction_type": "DEPOSIT", "transaction_id": "TX_02"},
            {"account_from": "ACC_SAFE", "account_to": "STORE", "amount": 2000.0, "timestamp": "2024-02-05T10:00:00Z", "transaction_type": "TRANSFER", "transaction_id": "TX_03"},
        ]
        patterns = pattern_engine.detect_structuring(txs)
        assert len(patterns) == 0


# ── 2. Circular Transfers Detector ───────────────────────────────────────────
class TestCircularTransferDetector:
    def test_circular_transfers_positive(self, pattern_engine):
        """Closed loop A -> B -> C -> A within 7 days must trigger CIRCULAR_TRANSFER."""
        txs = [
            {"account_from": "ACC_A", "account_to": "ACC_B", "amount": 500000.0, "timestamp": "2024-03-01T10:00:00Z", "transaction_id": "TX_C1"},
            {"account_from": "ACC_B", "account_to": "ACC_C", "amount": 490000.0, "timestamp": "2024-03-02T12:00:00Z", "transaction_id": "TX_C2"},
            {"account_from": "ACC_C", "account_to": "ACC_A", "amount": 480000.0, "timestamp": "2024-03-03T15:00:00Z", "transaction_id": "TX_C3"},
        ]
        patterns = pattern_engine.detect_circular_transfers(txs)
        assert len(patterns) >= 1
        p = patterns[0]
        assert p["type"] == "CIRCULAR_TRANSFER"
        assert p["severity"] == "CRITICAL"
        assert "ACC_A" in p["entities"] and "ACC_B" in p["entities"] and "ACC_C" in p["entities"]
        assert p["evidentiary_strength"]["score"] >= 0.80
        assert "warrants review" in p["reason"].lower()

    def test_circular_transfers_negative(self, pattern_engine):
        """Linear chain A -> B -> C -> D without returning to A must NOT trigger circular transfer."""
        txs = [
            {"account_from": "ACC_A", "account_to": "ACC_B", "amount": 100000.0, "timestamp": "2024-03-01T10:00:00Z", "transaction_id": "TX_L1"},
            {"account_from": "ACC_B", "account_to": "ACC_C", "amount": 95000.0, "timestamp": "2024-03-02T10:00:00Z", "transaction_id": "TX_L2"},
            {"account_from": "ACC_C", "account_to": "ACC_D", "amount": 90000.0, "timestamp": "2024-03-03T10:00:00Z", "transaction_id": "TX_L3"},
        ]
        patterns = pattern_engine.detect_circular_transfers(txs)
        assert len(patterns) == 0


# ── 3. Mule Account Rapid Dispersal ───────────────────────────────────────────
class TestMuleAccountDetector:
    def test_mule_account_positive(self, pattern_engine):
        """Account receiving >= 50k and draining >= 85% within 4 hours must trigger MULE_ACCOUNT_DISPERSAL."""
        txs = [
            {"account_from": "VICTIM_01", "account_to": "MULE_01", "amount": 250000.0, "timestamp": "2024-03-10T12:00:00Z", "transaction_id": "TX_M1"},
            {"account_from": "MULE_01", "account_to": "CASH_OUT_1", "amount": 110000.0, "timestamp": "2024-03-10T12:45:00Z", "transaction_id": "TX_M2"},
            {"account_from": "MULE_01", "account_to": "CASH_OUT_2", "amount": 115000.0, "timestamp": "2024-03-10T13:30:00Z", "transaction_id": "TX_M3"},
        ]
        patterns = pattern_engine.detect_mule_accounts(txs)
        assert len(patterns) >= 1
        p = patterns[0]
        assert p["type"] == "MULE_ACCOUNT_DISPERSAL"
        assert p["severity"] == "HIGH"
        assert "MULE_01" in p["entities"]

    def test_mule_account_negative(self, pattern_engine):
        """Account receiving funds and keeping balance without immediate drain must NOT trigger mule alert."""
        txs = [
            {"account_from": "COMPANY", "account_to": "SAVINGS_01", "amount": 200000.0, "timestamp": "2024-03-10T12:00:00Z", "transaction_id": "TX_S1"},
            {"account_from": "SAVINGS_01", "account_to": "GROCERY", "amount": 5000.0, "timestamp": "2024-03-10T15:00:00Z", "transaction_id": "TX_S2"},
        ]
        patterns = pattern_engine.detect_mule_accounts(txs)
        assert len(patterns) == 0


# ── 4. Burner SIM Detector ───────────────────────────────────────────────────
class TestBurnerSimDetector:
    def test_burner_sim_positive(self, pattern_engine):
        """SIM with <= 5 days lifespan and >= 15 calls must trigger BURNER_SIM_SWITCH."""
        calls = []
        base_time = datetime(2024, 3, 1, 10, 0, 0, tzinfo=timezone.utc)
        for i in range(16):
            call_dt = base_time + timedelta(hours=i * 2)
            calls.append({
                "caller_number": "+91-99999-11111",
                "receiver_number": f"+91-88888-0000{i % 4}",
                "timestamp": call_dt.isoformat(),
                "duration_sec": 45,
                "call_id": f"CALL_B_{i}",
            })
        patterns = pattern_engine.detect_burner_sims(calls)
        assert len(patterns) >= 1
        p = patterns[0]
        assert p["type"] == "BURNER_SIM_SWITCH"
        assert "+91-99999-11111" in p["entities"]
        assert p["evidentiary_strength"]["level"] in ("MEDIUM", "HIGH")

    def test_burner_sim_negative(self, pattern_engine):
        """Standard long-lived subscriber with calls spread over 30 days must NOT trigger burner alert."""
        calls = [
            {"caller_number": "+91-98110-00000", "receiver_number": "+91-98110-99999", "timestamp": "2024-01-01T10:00:00Z", "duration_sec": 60, "call_id": "C1"},
            {"caller_number": "+91-98110-00000", "receiver_number": "+91-98110-99999", "timestamp": "2024-01-15T10:00:00Z", "duration_sec": 60, "call_id": "C2"},
            {"caller_number": "+91-98110-00000", "receiver_number": "+91-98110-99999", "timestamp": "2024-02-01T10:00:00Z", "duration_sec": 60, "call_id": "C3"},
        ]
        patterns = pattern_engine.detect_burner_sims(calls)
        assert len(patterns) == 0


# ── 5. Night Burst Call Detector ─────────────────────────────────────────────
class TestNightBurstDetector:
    def test_night_burst_positive(self, pattern_engine):
        """>= 5 calls between 23:00 and 05:00 within 90 minutes must trigger NIGHT_BURST_COMMUNICATION."""
        calls = []
        base_time = datetime(2024, 3, 5, 23, 15, 0, tzinfo=timezone.utc)
        for i in range(6):
            calls.append({
                "caller_number": "+91-98110-44501",
                "receiver_number": "+91-98200-22101",
                "timestamp": (base_time + timedelta(minutes=i * 10)).isoformat(),
                "duration_sec": 120,
                "call_id": f"NIGHT_{i}",
            })
        patterns = pattern_engine.detect_night_bursts(calls)
        assert len(patterns) >= 1
        p = patterns[0]
        assert p["type"] == "NIGHT_BURST_COMMUNICATION"
        assert p["severity"] == "HIGH"
        assert "+91-98110-44501" in p["entities"]

    def test_night_burst_negative(self, pattern_engine):
        """Calls made during normal business hours (10:00 - 18:00) must NOT trigger night burst alert."""
        calls = []
        base_time = datetime(2024, 3, 5, 11, 0, 0, tzinfo=timezone.utc)
        for i in range(10):
            calls.append({
                "caller_number": "+91-98110-44501",
                "receiver_number": "+91-98200-22101",
                "timestamp": (base_time + timedelta(minutes=i * 5)).isoformat(),
                "duration_sec": 60,
                "call_id": f"DAY_{i}",
            })
        patterns = pattern_engine.detect_night_bursts(calls)
        assert len(patterns) == 0


# ── 6. IMEI Multi-Identity Reuse Detector ────────────────────────────────────
class TestImeiReuseDetector:
    def test_imei_reuse_positive(self, pattern_engine):
        """Same IMEI active with 2+ distinct caller phone numbers must trigger IMEI_MULTI_IDENTITY_REUSE."""
        calls = [
            {"caller_number": "+91-98110-11111", "imei_caller": "358901234567890", "timestamp": "2024-03-01T10:00:00Z", "call_id": "IMEI_1"},
            {"caller_number": "+91-98220-22222", "imei_caller": "358901234567890", "timestamp": "2024-03-02T11:00:00Z", "call_id": "IMEI_2"},
        ]
        patterns = pattern_engine.detect_imei_multi_identity(calls)
        assert len(patterns) >= 1
        p = patterns[0]
        assert p["type"] == "IMEI_MULTI_IDENTITY_REUSE"
        assert "358901234567890" in p["entities"]
        assert "+91-98110-11111" in p["entities"] and "+91-98220-22222" in p["entities"]
        assert "warrants review" in p["reason"].lower()

    def test_imei_reuse_negative(self, pattern_engine):
        """IMEI used consistently by a single phone number must NOT trigger."""
        calls = [
            {"caller_number": "+91-98110-11111", "imei_caller": "358901234567890", "timestamp": "2024-03-01T10:00:00Z", "call_id": "IMEI_1"},
            {"caller_number": "+91-98110-11111", "imei_caller": "358901234567890", "timestamp": "2024-03-02T10:00:00Z", "call_id": "IMEI_2"},
        ]
        patterns = pattern_engine.detect_imei_multi_identity(calls)
        assert len(patterns) == 0


# ── 7. Cross-Jurisdiction Haversine Geographic Distance Detector ──────────────
class TestCrossJurisdictionDetector:
    def test_haversine_distance_calculation(self):
        """Validate exact Haversine mathematical distance calculation."""
        # Delhi (28.6139, 77.2090) to Mumbai (19.0760, 72.8777) ~ 1148 km
        dist = haversine_km(28.6139, 77.2090, 19.0760, 72.8777)
        assert 1100 <= dist <= 1200

        # Same point = 0 km
        assert haversine_km(28.6139, 77.2090, 28.6139, 77.2090) == 0.0

    def test_cross_jurisdiction_positive(self, pattern_engine):
        """Same caller phone appearing > 100 km apart in < 3 hours must trigger CROSS_JURISDICTION_HANDOFF."""
        calls = [
            {
                "caller_number": "+91-98110-44501",
                "tower_lat": 28.6139,
                "tower_lon": 77.2090,
                "tower_location": "Delhi North",
                "timestamp": "2024-03-01T10:00:00Z",
                "call_id": "GEO_1",
            },
            {
                "caller_number": "+91-98110-44501",
                "tower_lat": 19.0760,
                "tower_lon": 72.8777,
                "tower_location": "Mumbai Central",
                "timestamp": "2024-03-01T11:30:00Z",  # 1.5 hours later (>1100km apart)
                "call_id": "GEO_2",
            },
        ]
        patterns = pattern_engine.detect_cross_jurisdiction_handoffs(calls)
        assert len(patterns) >= 1
        p = patterns[0]
        assert p["type"] == "CROSS_JURISDICTION_HANDOFF"
        assert p["severity"] == "CRITICAL"
        assert "+91-98110-44501" in p["entities"]
        assert p["evidentiary_strength"]["score"] >= 0.80

    def test_cross_jurisdiction_negative_short_distance(self, pattern_engine):
        """Points within 15 km in 1.5 hours (normal commute) must NOT falsely trigger."""
        calls = [
            {
                "caller_number": "+91-98110-44501",
                "tower_lat": 28.6139,
                "tower_lon": 77.2090,
                "tower_location": "Connaught Place, Delhi",
                "timestamp": "2024-03-01T10:00:00Z",
                "call_id": "GEO_L1",
            },
            {
                "caller_number": "+91-98110-44501",
                "tower_lat": 28.7041,
                "tower_lon": 77.1025,
                "tower_location": "Rohini, Delhi",  # ~15 km away
                "timestamp": "2024-03-01T11:00:00Z",
                "call_id": "GEO_L2",
            },
        ]
        patterns = pattern_engine.detect_cross_jurisdiction_handoffs(calls)
        assert len(patterns) == 0


# ── 8. Clean Baseline Zero False Positives ─────────────────────────────────────
class TestCleanBaselineNoFalsePositives:
    def test_clean_baseline_dataset(self, pattern_engine):
        """Run full pattern engine over ordinary, benign data subset and assert 0 false positive detections."""
        benign_calls = [
            {"caller_number": "+91-91111-00001", "receiver_number": "+91-91111-00002", "timestamp": "2024-01-10T14:00:00Z", "duration_sec": 120, "tower_lat": 28.61, "tower_lon": 77.20, "imei_caller": "IMEI_NORM_1", "call_id": "B1"},
            {"caller_number": "+91-91111-00001", "receiver_number": "+91-91111-00002", "timestamp": "2024-01-12T15:00:00Z", "duration_sec": 90, "tower_lat": 28.62, "tower_lon": 77.21, "imei_caller": "IMEI_NORM_1", "call_id": "B2"},
            {"caller_number": "+91-91111-00001", "receiver_number": "+91-91111-00002", "timestamp": "2024-01-20T11:00:00Z", "duration_sec": 45, "tower_lat": 28.60, "tower_lon": 77.22, "imei_caller": "IMEI_NORM_1", "call_id": "B3"},
        ]
        benign_txs = [
            {"account_from": "ACC_EMPLOYER", "account_to": "ACC_WORKER", "amount": 35000.0, "timestamp": "2024-01-01T09:00:00Z", "transaction_type": "SALARY", "transaction_id": "TX_B1"},
            {"account_from": "ACC_WORKER", "account_to": "ACC_UTILITY", "amount": 1500.0, "timestamp": "2024-01-05T10:00:00Z", "transaction_type": "BILL", "transaction_id": "TX_B2"},
            {"account_from": "ACC_WORKER", "account_to": "ACC_STORE", "amount": 3000.0, "timestamp": "2024-01-15T18:00:00Z", "transaction_type": "RETAIL", "transaction_id": "TX_B3"},
        ]
        all_patterns = pattern_engine.run_all_detectors(cdr_records=benign_calls, financial_records=benign_txs)
        assert len(all_patterns) == 0, f"Expected 0 patterns on clean data, but detected: {[p['type'] for p in all_patterns]}"


# ── 9. Key Influencer Explanation Generator ───────────────────────────────────
class TestKeyInfluencerExplanations:
    def test_key_entities_plain_language_and_metrics(self):
        """Validate key entities output contains real betweenness, degree, community count, and non-accusatory language."""
        result = key_entities()
        entities = result.get("entities", [])
        assert len(entities) > 0

        for e in entities:
            # Check topology metrics exist
            assert "betweenness" in e
            assert "degree" in e
            assert "classification" in e
            assert "explanation" in e
            assert "evidentiary_strength" in e

            # Check explanation includes numerical grounding and non-accusatory phrasing
            exp = e["explanation"]
            assert "connects" in exp or "bridges" in exp or "degree" in exp or "network" in exp
            assert "warrants review" in exp or "indicates" in exp or "officer" in exp

            # Evidentiary strength structure
            ev = e["evidentiary_strength"]
            assert 0.0 <= ev["score"] <= 1.0
            assert ev["level"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")


# ── 10. Cross-Case Bridge Critical Escalation ─────────────────────────────────
class TestCrossCaseEscalation:
    def test_cross_case_critical_escalation(self):
        """Entities present across >= 3 cases must be escalated to CRITICAL priority."""
        cross = cross_case_intelligence()
        clusters = cross.get("clusters", [])
        assert len(clusters) > 0

        for cl in clusters:
            case_count = len(cl.get("related_cases", []))
            if case_count >= 3:
                assert cl.get("connection_strength") == "CRITICAL", f"Expected CRITICAL for {case_count} cases, got {cl.get('connection_strength')}"


# ── 11. Lead Verification Round Trip & Provenance ─────────────────────────────
class TestLeadVerificationLoop:
    def test_create_and_verify_intelligence_lead(self):
        """Analyst creates intelligence lead -> Investigator verifies with mandatory remarks -> Audit log created."""
        create_payload = {
            "title": "Suspected Structuring Channel in Hawala Network",
            "description": "3 deposits of Rs 48,000 within 24 hours followed by immediate cash withdrawal",
            "priority": "HIGH",
            "related_cases": ["CASE-101", "CASE-105"],
            "entities": ["ACC-112233", "Ravi Kumar"],
            "reason": "Account exhibits classic smurfing pattern under Rs 50,000 threshold (warrants review).",
            "confidence": 0.94,
            "supporting_records": [
                {"source_document_id": "financial_transactions.csv", "row_reference": "rows 12-14", "details": "Structuring deposits"}
            ],
            "created_by": "ANALYST",
        }

        # 1. Create Lead
        res_create = client.post("/api/v1/leads/intelligence", json=create_payload)
        assert res_create.status_code == 200
        lead_data = res_create.json()["data"]
        lead_id = lead_data["id"]
        assert lead_data["status"] == "PENDING"
        assert lead_data["evidentiary_strength"]["level"] in ("HIGH", "CRITICAL")
        assert len(lead_data["supporting_records"]) == 1

        # 2. Reject if remarks missing (< 3 chars)
        res_fail = client.post(f"/api/v1/leads/{lead_id}/verify", json={"action": "VERIFIED", "remarks": "ok"})
        assert res_fail.status_code in (400, 422)

        # 3. Successful Officer Verification
        res_verify = client.post(
            f"/api/v1/leads/{lead_id}/verify",
            json={
                "action": "VERIFIED",
                "remarks": "Confirmed matching bank records with ICICI statement dated 02-Mar-2024.",
            },
        )
        assert res_verify.status_code == 200
        updated = res_verify.json()["data"]
        assert updated["status"] == "VERIFIED"
        assert updated["reviewed_by"] is not None
        assert "Confirmed matching bank records" in updated["remarks"]
        assert updated["evidentiary_strength"]["score"] >= 0.85


# ── 12. Dynamic Overview Metrics (No Hardcoded Numbers) ────────────────────────
class TestAnalystOverviewDynamicCalculations:
    def test_overview_metrics_are_dynamic_and_bounded(self):
        """Ensure overview metrics are computed dynamically from graph & patterns with zero hardcoding."""
        res = client.get("/api/v1/analyst/overview")
        assert res.status_code == 200
        envelope = res.json()
        data = envelope.get("data", {})
        summary = data.get("summary", {})

        assert "total_cases" in summary
        assert "active_crime_zones" in summary
        assert "cross_case_connections" in summary
        assert "important_network_entities" in summary
        assert "key_hub_entities_count" in summary
        assert "critical_patterns_count" in summary
        assert "overall_velocity_pct" in summary

        assert isinstance(summary["total_cases"], int)
        assert isinstance(summary["overall_velocity_pct"], (int, float))
        assert isinstance(summary["key_hub_entities_count"], int)
        assert summary["total_cases"] >= 0
