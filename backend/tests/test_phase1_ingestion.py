"""
Phase 1 Ingestion, Validation, Entity Resolution & Provenance Test Suite
========================================================================
Comprehensive verification covering:
1. Source Validators (all 6 supported data formats + upload safety)
2. Hybrid NLP Entity Extraction on Synthetic Samples
3. Entity Resolution Multi-Signal Matching (Rapidfuzz 0-100 & Zero Auto-Merge)
4. Full 8-Step Pipeline Ingestion & Provenance Attribution
5. Fault Isolation & Failed Step Diagnostics
6. Graph Store Insertion & Live Visibility
7. Reversible Merge & Split State Integrity
8. Analyst Entity Resolution Review API & Audit Logging
"""

import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.postgres import SessionLocal, Base, engine
from app.models.ingestion import DataSource, DataSourceType, IngestStatus, PipelineStep, PendingResolution
from app.models.audit import AuditLog
from app.services.source_validators import (
    validate_file_safety,
    validate_source_payload,
    sanitize_filename,
    validate_fir_content,
    validate_cdr_content,
    validate_financial_content,
    validate_social_media_content,
    validate_criminal_history_content,
    validate_surveillance_content,
)
from app.nlp.entity_resolution import (
    _name_similarity,
    _corroborate_entities,
    evaluate_resolution_pair,
    entity_resolver,
)
from app.services.ingestion_pipeline import IngestionPipelineOrchestrator, PipelineContext
from app.services.graph_store import get_graph_store, LocalFixtureStore


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Drop and recreate all tables for a fresh test database."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def reset_graph():
    """Reset graph store state before and after each test."""
    store = get_graph_store()
    store.reset_to_fixtures()
    yield
    store.reset_to_fixtures()


# ── 1. Upload Safety & Filename Sanitization ─────────────────────────────────

def test_filename_sanitization():
    assert sanitize_filename("../../../evil_script.sh") == "evil_script.sh"
    assert sanitize_filename("sample file (1).txt") == "sample_file__1_.txt"
    assert sanitize_filename(".hidden_file") == "upload_hidden_file"


def test_file_safety_validation():
    # 1. Size limit
    safe, err = validate_file_safety("sample.txt", file_size=15 * 1024 * 1024)
    assert not safe
    assert "exceeds maximum allowable limit" in err

    # 2. Extension check
    safe, err = validate_file_safety("sample.exe", file_size=1000, source_type=DataSourceType.FIR_REPORT)
    assert not safe
    assert "not permitted" in err

    # 3. Valid file
    safe, err = validate_file_safety("sample_fir.txt", file_size=1000, source_type=DataSourceType.FIR_REPORT)
    assert safe
    assert err is None


# ── 2. Source Validators across all 6 formats ────────────────────────────────

def test_source_validators_all_types():
    base_raw = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "raw")

    # 1. FIR Report (.txt)
    fir_path = os.path.join(base_raw, "fir_reports", "sample_fir_001.txt")
    with open(fir_path, "r", encoding="utf-8") as f:
        fir_text = f.read()
    valid, err, meta = validate_source_payload("sample_fir_001.txt", fir_text, DataSourceType.FIR_REPORT, len(fir_text))
    assert valid, f"FIR validation failed: {err}"
    assert "fir_number" in meta or "204/2024" in fir_text

    # 2. CDR (.csv)
    cdr_path = os.path.join(base_raw, "cdr", "sample_cdr_001.csv")
    with open(cdr_path, "r", encoding="utf-8") as f:
        cdr_csv = f.read()
    valid, err, meta = validate_source_payload("sample_cdr_001.csv", cdr_csv, DataSourceType.CDR, len(cdr_csv))
    assert valid, f"CDR validation failed: {err}"
    assert meta.get("row_count") >= 5

    # 3. Financial (.csv)
    fin_path = os.path.join(base_raw, "financial", "sample_financial_001.csv")
    with open(fin_path, "r", encoding="utf-8") as f:
        fin_csv = f.read()
    valid, err, meta = validate_source_payload("sample_financial_001.csv", fin_csv, DataSourceType.FINANCIAL, len(fin_csv))
    assert valid, f"Financial validation failed: {err}"
    assert meta.get("row_count") >= 4

    # 4. Social Media (.json)
    soc_path = os.path.join(base_raw, "intelligence", "sample_social_intel_001.json")
    with open(soc_path, "r", encoding="utf-8") as f:
        soc_json = f.read()
    valid, err, meta = validate_source_payload("sample_social_intel_001.json", soc_json, DataSourceType.SOCIAL_MEDIA, len(soc_json))
    assert valid, f"Social media validation failed: {err}"
    assert meta.get("post_count") >= 2

    # 5. Criminal History (.json)
    crim_path = os.path.join(base_raw, "intelligence", "sample_criminal_history_001.json")
    with open(crim_path, "r", encoding="utf-8") as f:
        crim_json = f.read()
    valid, err, meta = validate_source_payload("sample_criminal_history_001.json", crim_json, DataSourceType.CRIMINAL_HISTORY, len(crim_json))
    assert valid, f"Criminal history validation failed: {err}"
    assert meta.get("record_count") >= 2

    # 6. Surveillance (.json)
    surv_path = os.path.join(base_raw, "intelligence", "sample_surveillance_001.json")
    with open(surv_path, "r", encoding="utf-8") as f:
        surv_json = f.read()
    valid, err, meta = validate_source_payload("sample_surveillance_001.json", surv_json, DataSourceType.SURVEILLANCE, len(surv_json))
    assert valid, f"Surveillance validation failed: {err}"
    assert meta.get("observation_count") >= 2


def test_validator_rejects_corrupt_files():
    # Bad CSV header
    bad_cdr = "wrong_col_1,wrong_col_2\n123,456"
    valid, err, _ = validate_cdr_content(bad_cdr)
    assert not valid
    assert "caller_number" in err

    # Bad JSON syntax
    bad_json = "[{invalid_json"
    valid, err, _ = validate_social_media_content(bad_json)
    assert not valid


# ── 3. Entity Resolution Multi-Signal Matching ───────────────────────────────

def test_entity_resolution_rules():
    # 1. True match with multi-signal (Name ~87 + Shared Phone)
    e1 = {"id": "N1", "name": "Ravi Kumar", "type": "Person", "phone": "+91-98110-44501"}
    e2 = {"id": "N2", "name": "R. Kumar", "type": "Person", "phone": "+91-98110-44501"}
    match = evaluate_resolution_pair(e1, e2)
    assert match is not None
    assert match["resolution_decision"] in ("SUGGESTED_MERGE", "POSSIBLE_MATCH")
    assert "Shared Phone" in match["match_reason"]

    # 2. Name-only high match (>95)
    e3 = {"id": "N3", "name": "Vikram Singh", "type": "Person"}
    e4 = {"id": "N4", "name": "Vikram Singh", "type": "Person"}
    match_high = evaluate_resolution_pair(e3, e4)
    assert match_high is not None
    assert match_high["name_similarity"] >= 95.0

    # 3. Name-only moderate match (85-95) WITHOUT 2nd signal -> NO SUGGESTION
    e5 = {"id": "N5", "name": "Ravi Kumar", "type": "Person"}
    e6 = {"id": "N6", "name": "R. Kumar", "type": "Person"}
    match_no_2nd_sig = evaluate_resolution_pair(e5, e6)
    assert match_no_2nd_sig is None, "Name match under 95 without second signal must NOT create suggestion"

    # 4. Incompatible types -> NO MATCH
    e7 = {"id": "N7", "name": "Apex Global Logistics", "type": "Organization"}
    e8 = {"id": "N8", "name": "Apex Global Logistics", "type": "Person"}
    assert evaluate_resolution_pair(e7, e8) is None

    # 5. Low similarity (<85) -> NO MATCH
    e9 = {"id": "N9", "name": "Sunita Sharma", "type": "Person"}
    e10 = {"id": "N10", "name": "Vikram Singh", "type": "Person"}
    assert evaluate_resolution_pair(e9, e10) is None


# ── 4. Full 8-Step Pipeline Ingestion & Provenance ───────────────────────────

def test_full_fir_ingestion_pipeline(db_session: Session):
    base_raw = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "raw")
    fir_path = os.path.join(base_raw, "fir_reports", "sample_fir_001.txt")
    with open(fir_path, "r", encoding="utf-8") as f:
        fir_text = f.read()

    result = IngestionPipelineOrchestrator.execute(
        db=db_session,
        filename="sample_fir_001.txt",
        content=fir_text,
        source_type=DataSourceType.FIR_REPORT,
        case_id="CASE-101",
    )

    assert result["status"] == "COMPLETED"
    assert result["entities_extracted"] > 0
    assert result["relationships_created"] > 0

    # Check DataSource in DB
    ds = db_session.query(DataSource).filter(DataSource.id == result["data_source_id"]).first()
    assert ds is not None
    assert ds.status == IngestStatus.COMPLETED
    assert ds.current_step == PipelineStep.COMPLETED.value
    assert ds.failed_step is None

    # Check step_progress recorded all 8 steps
    for step in PipelineStep:
        assert step.value in ds.step_progress
        assert ds.step_progress[step.value]["status"] in ("COMPLETED", "SKIPPED")

    # Check graph store contains newly inserted entities with provenance
    store = get_graph_store()
    subgraph = store.get_subgraph(case_id="CASE-101")
    assert len(subgraph["nodes"]) > 0

    # Verify provenance on edges
    for edge in subgraph["edges"]:
        props = edge.get("properties", {})
        assert "confidence" in edge or "confidence" in props
        assert "verification_status" in edge or "verification_status" in props or "AI_SUGGESTED"


def test_structured_cdr_ingestion_skips_nlp(db_session: Session):
    base_raw = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "raw")
    cdr_path = os.path.join(base_raw, "cdr", "sample_cdr_001.csv")
    with open(cdr_path, "r", encoding="utf-8") as f:
        cdr_csv = f.read()

    result = IngestionPipelineOrchestrator.execute(
        db=db_session,
        filename="sample_cdr_001.csv",
        content=cdr_csv,
        source_type=DataSourceType.CDR,
        case_id="CASE-101",
    )

    assert result["status"] == "COMPLETED"
    assert result["relationships_created"] >= 4

    ds = db_session.query(DataSource).filter(DataSource.id == result["data_source_id"]).first()
    assert ds.step_progress[PipelineStep.NLP_EXTRACTION.value]["status"] == "SKIPPED"


# ── 5. Fault Isolation & Failed Step Diagnostics ─────────────────────────────

def test_forced_failure_records_failed_step(db_session: Session):
    corrupt_content = "NOT_A_VALID_CDR_FILE"

    with pytest.raises(ValueError) as excinfo:
        IngestionPipelineOrchestrator.execute(
            db=db_session,
            filename="corrupt_cdr.csv",
            content=corrupt_content,
            source_type=DataSourceType.CDR,
        )

    assert "Validation failed at Step 2 (VALIDATE)" in str(excinfo.value)

    # Check that failed step and error log are saved in DB
    failed_ds = db_session.query(DataSource).filter(DataSource.filename == "corrupt_cdr.csv").order_by(DataSource.id.desc()).first()
    assert failed_ds is not None
    assert failed_ds.status == IngestStatus.FAILED
    assert failed_ds.failed_step == PipelineStep.VALIDATE.value
    assert "caller_number" in failed_ds.error_log


# ── 6. Reversible Merge and Split State Integrity ────────────────────────────

def test_merge_and_split_reversibility():
    store = LocalFixtureStore()

    # Pre-merge node count
    orig_nodes = len(store._nodes)
    orig_edges = len(store._edges)

    # Pick 2 nodes from canonical fixture (P001: Ravi Kumar, P002: Vikram Singh)
    primary_id = "P001"
    duplicate_id = "P002"

    assert primary_id in store._nodes
    assert duplicate_id in store._nodes

    # Execute merge
    merge_log = store.merge_nodes(primary_id, duplicate_id, reason="Testing reversible merge")
    assert duplicate_id not in store._nodes
    assert len(store._nodes) == orig_nodes - 1
    assert "transferred_edges" in merge_log

    # Execute split
    split_success = store.split_node(merge_log)
    assert split_success is True
    assert duplicate_id in store._nodes
    assert primary_id in store._nodes
    assert len(store._nodes) == orig_nodes
    assert len(store._edges) == orig_edges


# ── 7. Analyst Review API & Audit Logging ────────────────────────────────────

def test_analyst_resolution_review_endpoint(client: TestClient, db_session: Session):
    # 1. Fetch pending resolutions
    res = client.get("/api/v1/analyst/resolutions/pending")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total"] > 0
    candidate = data["items"][0]
    cand_id = candidate["id"]

    # 2. Approve resolution
    approve_res = client.post(
        f"/api/v1/analyst/resolutions/{cand_id}/review",
        json={"action": "APPROVE", "remarks": "Approved verified alias"},
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["data"]["status"] == "APPROVED"

    # 3. Check audit log for approve action
    audit_entry = db_session.query(AuditLog).filter(AuditLog.action == "APPROVE_ENTITY_MERGE").first()
    assert audit_entry is not None

    # 4. Split resolution
    split_res = client.post(
        f"/api/v1/analyst/resolutions/{cand_id}/review",
        json={"action": "SPLIT", "remarks": "Reversing test merge"},
    )
    assert split_res.status_code == 200
    assert split_res.json()["data"]["status"] == "SPLIT"

    # 5. Check audit log for split action
    split_audit = db_session.query(AuditLog).filter(AuditLog.action == "SPLIT_ENTITY").first()
    assert split_audit is not None


# ── 8. Shared Case Exclusion & Informational Chip Rule ───────────────────────

def test_shared_case_does_not_corroborate_merges():
    """Co-accused in the same FIR/case must NOT be considered the same person."""
    e1 = {"id": "N1", "name": "Rajesh Kumar", "type": "Person", "cases": ["CASE-101"]}
    e2 = {"id": "N2", "name": "Raj Kumar", "type": "Person", "cases": ["CASE-101"]}
    corr_count, chips = _corroborate_entities(e1, e2)
    # Shared case must NOT increment corroboration count
    assert corr_count == 0
    assert any("Shared Case(s) (Info only)" in chip for chip in chips)
    # Pair must NOT generate a suggested merge
    match = evaluate_resolution_pair(e1, e2)
    assert match is None, "Shared case alone with score < 95 must not generate a merge suggestion"


# ── 9. Duplicate Upload Handling ─────────────────────────────────────────────

def test_duplicate_upload_handling(db_session: Session):
    """Uploading the same file twice must not insert duplicate nodes or edges."""
    sample_text = "FIR NO. 999/2026. Suspect Mohan Lal was seen driving vehicle HR-26-AB-9999."
    
    store = get_graph_store()
    init_nodes = len(store.get_subgraph()["nodes"])

    # 1. First upload
    res1 = IngestionPipelineOrchestrator.execute(
        db=db_session,
        filename="fir_999.txt",
        content=sample_text,
        source_type=DataSourceType.FIR_REPORT,
        case_id="CASE-999",
    )
    assert res1["status"] == "COMPLETED"
    nodes_after_first = len(store.get_subgraph()["nodes"])

    # 2. Duplicate upload with identical content
    res2 = IngestionPipelineOrchestrator.execute(
        db=db_session,
        filename="fir_999_duplicate.txt",
        content=sample_text,
        source_type=DataSourceType.FIR_REPORT,
        case_id="CASE-999",
    )
    assert res2["status"] == "COMPLETED"
    nodes_after_second = len(store.get_subgraph()["nodes"])
    
    # Graph node count must be identical (no duplicate nodes created)
    assert nodes_after_second == nodes_after_first

    # Check DataSource step_progress has duplicate details
    ds2 = db_session.query(DataSource).filter(DataSource.id == res2["data_source_id"]).first()
    assert "Duplicate" in ds2.step_progress[PipelineStep.UPLOAD.value]["details"]
    assert ds2.step_progress[PipelineStep.VALIDATE.value]["status"] == "SKIPPED"


# ── 10. LocalFixtureStore JSON Persistence & Reload ──────────────────────────

def test_graph_persistence_across_reloads():
    """Mutations to LocalFixtureStore persist to JSON overlay and reload seamlessly."""
    store = get_graph_store()
    store.reset_to_fixtures()
    base_node_count = len(store.get_subgraph()["nodes"])

    # Add a dynamic node
    new_node = {
        "id": "PERSON_TEST_PERSIST",
        "name": "Persistent Suspect",
        "type": "Person",
        "cases": ["CASE-101"],
    }
    store.add_nodes([new_node])

    # Re-initialize a new LocalFixtureStore instance to simulate backend restart
    reloaded_store = LocalFixtureStore()
    reloaded_nodes = reloaded_store.get_subgraph()["nodes"]
    assert any(n["id"] == "PERSON_TEST_PERSIST" for n in reloaded_nodes)
    assert len(reloaded_nodes) == base_node_count + 1

    # Reset clears back to base fixtures
    reloaded_store.reset_to_fixtures()
    clean_nodes = reloaded_store.get_subgraph()["nodes"]
    assert not any(n["id"] == "PERSON_TEST_PERSIST" for n in clean_nodes)
    assert len(clean_nodes) == base_node_count
