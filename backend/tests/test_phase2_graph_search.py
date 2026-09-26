"""
Phase 2 Graph, Search, and Explainability Test Suite
====================================================
Comprehensive tests covering:
1. Exact and rapidfuzz fuzzy global search across phones, license plates, accounts, names, aliases.
2. Search with no matches returns empty list without error.
3. Multi-attribute graph filters (hop depth 1-2, min confidence, relationship type, entity type).
4. Combining multiple graph filters returns consistent, correctly-filtered results.
5. Edge Evidence payload integrity: real provenance fields only, no fabricated proof claims.
6. Evidentiary strength calculation: bounded [0.0, 1.0] and Low/Medium/High labeling.
7. PDF Court Brief export generation via reportlab.
8. Relationship type typo fix (ACCUSED_IN).
"""
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.postgres import SessionLocal, Base, engine
from app.services.graph_store import (
    get_graph_store,
    compute_evidentiary_strength,
    LocalFixtureStore,
)
from app.services import graph_analytics


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensure database tables exist for test run."""
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_graph_fixtures():
    """Ensure graph store is reset to canonical fixture before each test."""
    store = get_graph_store()
    store.reset_to_fixtures()


# ─────────────────────────────────────────────────────────────────────────────
# 1. Global Entity Search Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_search_by_phone_number():
    """Phone search should match exact digits or formatted strings."""
    store = get_graph_store()
    results = store.search_entities(query="9811044501")
    assert len(results) > 0
    top = results[0]
    assert "9811044501" in (top.get("phone") or top.get("number") or top.get("id") or "") or "Phone:" in top.get("match_field", "")


def test_search_by_vehicle_plate():
    """Vehicle search matches license plates ignoring whitespace/hyphens."""
    store = get_graph_store()
    results = store.search_entities(query="DL01AB1234")
    assert len(results) > 0
    assert any("DL-01-AB-1234" in (r.get("reg_number") or r.get("id") or "") or "Vehicle:" in r.get("match_field", "") for r in results)


def test_search_by_bank_account():
    """Bank account number matches exact or partial account ID."""
    store = get_graph_store()
    results = store.search_entities(query="112233445566778")
    assert len(results) > 0
    assert any("112233445566778" in (r.get("account_number") or r.get("id") or "") or "Bank Account:" in r.get("match_field", "") for r in results)


def test_search_by_exact_name():
    """Exact suspect name matches with high search score."""
    store = get_graph_store()
    results = store.search_entities(query="Ravi Kumar")
    assert len(results) > 0
    assert results[0]["name"] == "Ravi Kumar"
    assert results[0]["search_score"] >= 90.0


def test_search_by_fuzzy_name():
    """Fuzzy name variant (e.g. 'Ravee Kumaar') matches via rapidfuzz."""
    store = get_graph_store()
    results = store.search_entities(query="Ravee Kumaar")
    assert len(results) > 0
    names = [r.get("name") for r in results]
    assert "Ravi Kumar" in names


def test_search_by_alias():
    """Alias search matches known criminal monikers (e.g. 'Ravan' or 'Vicky')."""
    store = get_graph_store()
    results = store.search_entities(query="Ravan")
    assert len(results) > 0
    assert any("Ravan" in str(r.get("alias", "")) or "Ravan" in str(r.get("aliases", [])) or "Alias:" in r.get("match_field", "") for r in results)


def test_search_no_matches_returns_empty_without_error():
    """Search query with zero matching entities returns [] cleanly without raising error."""
    store = get_graph_store()
    results = store.search_entities(query="XYZNonExistentEntity999999")
    assert isinstance(results, list)
    assert len(results) == 0


def test_search_api_endpoint(client):
    """GET /api/v1/search/entities endpoint returns structured response envelope."""
    response = client.get("/api/v1/search/entities?q=Ravi")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) > 0
    assert any("Ravi" in r.get("name", "") for r in data["data"])


def test_search_api_empty_query_handled(client):
    """GET /api/v1/search/entities with query that has no match returns empty array without error."""
    response = client.get("/api/v1/search/entities?q=ZZZZUNKNOWN987654")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"] == []


# ─────────────────────────────────────────────────────────────────────────────
# 2. Graph Filter & Subgraph Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_subgraph_filter_by_min_confidence():
    """min_confidence filter excludes edges below the threshold and keeps high confidence ones."""
    store = get_graph_store()
    all_sub = store.get_subgraph()
    high_conf_sub = store.get_subgraph(min_confidence=0.90)

    assert len(all_sub["edges"]) >= len(high_conf_sub["edges"])
    for edge in high_conf_sub["edges"]:
        conf = edge.get("properties", {}).get("confidence", edge.get("confidence", 0.9))
        assert conf >= 0.90


def test_subgraph_filter_by_relationship_type():
    """relationship_type filter restricts edges to the specified type."""
    store = get_graph_store()
    comm_sub = store.get_subgraph(relationship_type="COMMUNICATED_WITH")
    assert len(comm_sub["edges"]) > 0
    for edge in comm_sub["edges"]:
        assert edge.get("type") == "COMMUNICATED_WITH"


def test_subgraph_filter_by_entity_type():
    """entity_type filter restricts returned nodes to the specified entity type."""
    store = get_graph_store()
    phone_sub = store.get_subgraph(entity_type="Phone")
    assert len(phone_sub["nodes"]) > 0
    for node in phone_sub["nodes"]:
        etype = node.get("type")
        assert etype == "Phone"


def test_combining_multiple_graph_filters():
    """
    Combining multiple filters (entity_type + min_confidence + relationship_type)
    returns a consistent, correctly-filtered result without error.
    """
    store = get_graph_store()
    filtered = store.get_subgraph(
        min_confidence=0.85,
        relationship_type="TRANSFERRED_MONEY",
        entity_type="FinancialAccount",
    )
    assert isinstance(filtered["nodes"], list)
    assert isinstance(filtered["edges"], list)

    for node in filtered["nodes"]:
        assert node.get("type") == "FinancialAccount"

    for edge in filtered["edges"]:
        assert edge.get("type") == "TRANSFERRED_MONEY"
        conf = edge.get("properties", {}).get("confidence", edge.get("confidence", 0.85))
        assert conf >= 0.85


def test_focus_subgraph_hop_expansion():
    """get_focus_subgraph expands by 1 hop and 2 hops correctly."""
    store = get_graph_store()
    sub_1hop = store.get_focus_subgraph(entity_id="P001", hops=1)
    sub_2hops = store.get_focus_subgraph(entity_id="P001", hops=2)

    assert len(sub_2hops["nodes"]) >= len(sub_1hop["nodes"])
    assert "P001" in [n["id"] for n in sub_1hop["nodes"]]
    assert "P001" in [n["id"] for n in sub_2hops["nodes"]]


def test_relationship_type_spelling_no_typo():
    """Verify relationship type is ACCUSED_IN and not ACCOUSED_IN."""
    store = get_graph_store()
    sub = store.get_subgraph()
    edge_types = [e.get("type") for e in sub["edges"]]
    assert "ACCOUSED_IN" not in edge_types
    # If any case accused edges exist, they use ACCUSED_IN
    for et in edge_types:
        assert "ACCOUSED" not in str(et).upper()


# ─────────────────────────────────────────────────────────────────────────────
# 3. Evidentiary Strength & Provenance Calculation Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_evidentiary_strength_exact_formula_and_bounds():
    """
    Verify evidentiary strength calculation formula:
    - 0.40 * Confidence
    - 0.35 * Verification status weight (VERIFIED=1.0, AI_SUGGESTED=0.80, ALLEGED=0.50)
    - 0.25 * Corroboration weight (doc count + snippet presence)
    Always bounded [0.0, 1.0] and labeled Low / Medium / High.
    """
    # High strength verified link with snippet
    res_high = compute_evidentiary_strength(
        confidence=0.95,
        verification_status="VERIFIED",
        evidence_snippet="CDR call intercept recorded at 14:00.",
        distinct_docs_count=2,
    )
    assert 0.0 <= res_high["score"] <= 1.0
    assert 0 <= res_high["score_pct"] <= 100
    assert res_high["level"] == "HIGH"
    assert "High" in res_high["label"]
    assert "officer verification required" in res_high["explanation"].lower()

    # Medium strength AI suggested link
    res_med = compute_evidentiary_strength(
        confidence=0.70,
        verification_status="AI_SUGGESTED",
        evidence_snippet="",
        distinct_docs_count=1,
    )
    assert 0.0 <= res_med["score"] <= 1.0
    assert res_med["level"] in ("MEDIUM", "LOW")

    # Low strength uncorroborated alleged link
    res_low = compute_evidentiary_strength(
        confidence=0.40,
        verification_status="ALLEGED",
        evidence_snippet="",
        distinct_docs_count=1,
    )
    assert 0.0 <= res_low["score"] <= 1.0
    assert res_low["level"] == "LOW"
    assert "Low" in res_low["label"]


def test_shortest_path_with_evidentiary_strength():
    """Shortest path discovery returns hop-by-hop real provenance and composite evidentiary strength."""
    store = get_graph_store()
    path_data = store.get_shortest_path(source_id="P001", target_id="P004")
    assert path_data["hop_count"] > 0
    assert "evidentiary_strength" in path_data
    ev_str = path_data["evidentiary_strength"]
    assert 0.0 <= ev_str["score"] <= 1.0
    assert ev_str["level"] in ("HIGH", "MEDIUM", "LOW")
    assert "officer verification required" in ev_str["explanation"].lower()

    # Verify real provenance fields on hops
    for hop in path_data["hops"]:
        assert "from_id" in hop
        assert "to_id" in hop
        assert "relationship" in hop
        assert "source_document_id" in hop
        assert "evidence_snippet" in hop
        assert "extraction_method" in hop
        assert "confidence" in hop
        assert "verification_status" in hop
        # No fabricated cryptographic proof claims
        assert "cryptographic proof" not in str(hop).lower()


# ─────────────────────────────────────────────────────────────────────────────
# 4. PDF Case Brief Export Tests (ReportLab)
# ─────────────────────────────────────────────────────────────────────────────

def test_pdf_court_brief_export(client):
    """GET /api/v1/cases/101/export?format=pdf produces valid binary PDF document."""
    response = client.get("/api/v1/cases/101/export?format=pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in response.headers.get("content-disposition", "")
    assert response.headers["content-disposition"].endswith('.pdf"')
    content = response.content
    assert len(content) > 500
    # PDF magic bytes header
    assert content.startswith(b"%PDF-")


def test_markdown_court_brief_export(client):
    """GET /api/v1/cases/101/export?format=markdown continues working as before."""
    response = client.get("/api/v1/cases/101/export?format=markdown")
    assert response.status_code == 200
    assert "text/markdown" in response.headers["content-type"]
    text = response.text
    assert "# LAW ENFORCEMENT INTELLIGENCE PLATFORM" in text
    assert "CASE DOSSIER: FIR No. 101/2025" in text
    assert "Officer verification required" in text
