"""
Phase 4 Test Suite: Security Hardening & Cryptographic Integrity
================================================================
Verifies:
1. Session & Credential Security: SECRET_KEY handling & JWT verification
2. RBAC Enforcement: Role restrictions (Admin, Investigator, Analyst)
3. Demo-user fallback behavior: Confirms fallback INVESTIGATOR cannot access ADMIN or ANALYST-only endpoints
4. Hash-chained audit logs: Genesis anchor, SHA-256 links, tamper detection
5. Local Integrity Ledger: Binary Merkle tree computation & anchor verification
6. System Integrity Endpoints: Verify, Anchor Now, and Tamper Simulation
7. Legal Authorization Tracking: Mandatory authorization_reference on CDR/FINANCIAL uploads
8. Case Export Integrity: Court evidence brief includes file hashes, authorization refs, and Merkle root
"""
import io
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import Settings, _DEFAULT_INSECURE_KEY
from app.core.security import create_access_token, get_password_hash
from app.db.postgres import SessionLocal
from app.models.audit import AuditLog
from app.models.ingestion import DataSource, DataSourceType, IngestStatus
from app.models.integrity import CustodyEvent, IntegrityAnchor
from app.models.user import User, UserRole
from app.services.integrity import (
    GENESIS_HASH,
    anchor_all_unanchored,
    compute_entry_hash,
    compute_merkle_root,
    log_audit_action_with_chain,
    log_custody_event,
    simulate_tamper_audit,
    simulate_tamper_evidence,
    verify_audit_chain,
    verify_evidence_hashes,
    verify_full_system_integrity,
    verify_merkle_anchors,
)

client = TestClient(app)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def db_session():
    """Provide a database session for direct model verification."""
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture(scope="module")
def admin_token(db_session):
    """Create or fetch an ADMIN user and return their Bearer token header."""
    user = db_session.query(User).filter(User.email == "admin_test@police.gov.in").first()
    if not user:
        user = User(
            email="admin_test@police.gov.in",
            badge_number="ADMIN-TEST-01",
            full_name="Administrator Test",
            department="HQ",
            hashed_password=get_password_hash("adminpassword123"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def investigator_token(db_session):
    """Create or fetch an INVESTIGATOR user and return their Bearer token header."""
    user = db_session.query(User).filter(User.email == "investigator_test@police.gov.in").first()
    if not user:
        user = User(
            email="investigator_test@police.gov.in",
            badge_number="INV-TEST-02",
            full_name="Investigator Test",
            department="Crime Branch",
            hashed_password=get_password_hash("investigatorpass123"),
            role=UserRole.INVESTIGATOR,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def analyst_token(db_session):
    """Create or fetch an ANALYST user and return their Bearer token header."""
    user = db_session.query(User).filter(User.email == "analyst_test@police.gov.in").first()
    if not user:
        user = User(
            email="analyst_test@police.gov.in",
            badge_number="ANL-TEST-03",
            full_name="Analyst Test",
            department="Crime Intelligence",
            hashed_password=get_password_hash("analystpass123"),
            role=UserRole.ANALYST,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}


# ── 1. Session & Credential Security ──────────────────────────────────────────

def test_secret_key_random_generation_when_default():
    """Verify that when SECRET_KEY equals the default insecure string, a secure random key is generated."""
    s = Settings(SECRET_KEY=_DEFAULT_INSECURE_KEY)
    assert s.SECRET_KEY != _DEFAULT_INSECURE_KEY
    assert len(s.SECRET_KEY) >= 32


def test_secret_key_retained_when_explicitly_set():
    """Verify that an explicitly provided SECRET_KEY is preserved."""
    custom_key = "my_custom_production_secret_key_12345"
    s = Settings(SECRET_KEY=custom_key)
    assert s.SECRET_KEY == custom_key


def test_auth_demo_password_bypass_works_when_demo_mode_true(monkeypatch, db_session):
    """
    Verify that when DEMO_MODE=True, the default demo password bypass succeeds.
    """
    from app.core.config import settings
    monkeypatch.setattr(settings, "DEMO_MODE", True)

    # Use investigator login with demo password
    login_data = {
        "username": "investigator@police.gov.in",
        "password": "investigator123",
    }
    res = client.post("/api/v1/auth/login", data=login_data)
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert "access_token" in res.json()["data"]


def test_auth_demo_password_bypass_rejected_when_demo_mode_false(monkeypatch, db_session):
    """
    Verify that when DEMO_MODE=False, default demo passwords are NOT bypassed.
    If the database user has a different password, dev passwords return 401.
    """
    from app.core.config import settings
    # Create user with a strict non-demo password
    user = db_session.query(User).filter(User.email == "strict_officer@police.gov.in").first()
    if not user:
        user = User(
            email="strict_officer@police.gov.in",
            badge_number="STRICT-999",
            full_name="Strict Officer",
            department="HQ",
            hashed_password=get_password_hash("SuperSecretComplexPassword#2026"),
            role=UserRole.INVESTIGATOR,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

    # When DEMO_MODE is False
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    # Attempting to login using the dev bypass password "investigator123" must fail with 401
    login_data = {
        "username": "strict_officer@police.gov.in",
        "password": "investigator123",
    }
    res = client.post("/api/v1/auth/login", data=login_data)
    assert res.status_code == 401
    assert "Incorrect badge number/email or password" in res.json()["detail"]

    # Attempting login with the correct complex password succeeds
    login_data_correct = {
        "username": "strict_officer@police.gov.in",
        "password": "SuperSecretComplexPassword#2026",
    }
    res_ok = client.post("/api/v1/auth/login", data=login_data_correct)
    assert res_ok.status_code == 200
    assert res_ok.json()["success"] is True


def test_auth_demo_autoseed_disabled_when_demo_mode_false(monkeypatch, db_session):
    """
    Verify that when DEMO_MODE=False, unseeded demo identities are NOT auto-created.
    """
    from app.core.config import settings
    # Ensure test identity is not in DB
    db_session.query(User).filter(User.email == "unseeded_demo@police.gov.in").delete()
    db_session.commit()

    monkeypatch.setattr(settings, "DEMO_MODE", False)

    login_data = {
        "username": "unseeded_demo@police.gov.in",
        "password": "somepassword",
    }
    res = client.post("/api/v1/auth/login", data=login_data)
    assert res.status_code == 401


# ── 2. Demo-User Fallback & RBAC Verification ─────────────────────────────────

def test_unauthenticated_fallback_cannot_reach_admin_endpoints():
    """
    Verify that unauthenticated requests (which fallback to demo INVESTIGATOR)
    are strictly rejected with 403 on ADMIN-only endpoints.
    """
    res = client.get("/api/v1/admin/overview")
    assert res.status_code == 403
    assert "Operation not permitted" in res.json()["detail"]


def test_unauthenticated_fallback_cannot_reach_analyst_intelligence_endpoints():
    """
    Verify that unauthenticated requests (fallback INVESTIGATOR)
    are strictly rejected with 403 on ANALYST-only intelligence creation.
    """
    payload = {
        "title": "Unauthorized Intel Lead",
        "description": "Attempted by unauthenticated user",
        "related_cases": ["101"],
    }
    res = client.post("/api/v1/leads/intelligence", json=payload)
    assert res.status_code == 403


def test_rbac_investigator_cannot_access_admin_overview(investigator_token):
    """Verify that an authenticated INVESTIGATOR cannot access admin overview (403)."""
    res = client.get("/api/v1/admin/overview", headers=investigator_token)
    assert res.status_code == 403


def test_rbac_investigator_cannot_trigger_integrity_anchor(investigator_token):
    """Verify that an INVESTIGATOR cannot trigger admin integrity anchoring (403)."""
    res = client.post("/api/v1/admin/integrity/anchor", headers=investigator_token)
    assert res.status_code == 403


def test_rbac_analyst_cannot_verify_lead(analyst_token):
    """
    Verify that an ANALYST cannot verify/approve a lead (403).
    Only INVESTIGATOR or ADMIN can verify leads.
    """
    payload = {"action": "VERIFIED", "remarks": "Analyst trying to verify"}
    res = client.post("/api/v1/leads/LEAD-001/verify", json=payload, headers=analyst_token)
    assert res.status_code == 403


def test_rbac_analyst_cannot_ingest_file(analyst_token):
    """
    Verify that an ANALYST cannot ingest files (403).
    Only INVESTIGATOR or ADMIN can upload evidence.
    """
    files = {"file": ("fir_test.txt", io.BytesIO(b"FIR incident text content"), "text/plain")}
    res = client.post("/api/v1/ingest/file", files=files, headers=analyst_token)
    assert res.status_code == 403


def test_rbac_admin_has_full_access(admin_token):
    """Verify that an ADMIN can access admin overview and role permissions."""
    res = client.get("/api/v1/admin/overview", headers=admin_token)
    assert res.status_code == 200
    assert res.json()["success"] is True

    res_roles = client.get("/api/v1/admin/roles", headers=admin_token)
    assert res_roles.status_code == 200
    roles = [r["role"] for r in res_roles.json()["data"]["roles"]]
    assert "ADMIN" in roles
    assert "INVESTIGATOR" in roles
    assert "ANALYST" in roles
    assert "VIEWER" not in roles  # Confirm VIEWER was cleaned up


# ── 3. Hash-Chained Audit Log Tests ───────────────────────────────────────────

def test_audit_hash_chain_genesis_and_linking(db_session):
    """Verify that audit entries form a continuous cryptographic hash chain."""
    e1 = log_audit_action_with_chain(
        db=db_session,
        action="TEST_ACTION_1",
        resource_type="CASE",
        resource_id="TEST-101",
        details={"note": "first entry in sub-test"},
    )
    assert e1 is not None
    assert e1.entry_hash is not None
    assert len(e1.entry_hash) == 64

    e2 = log_audit_action_with_chain(
        db=db_session,
        action="TEST_ACTION_2",
        resource_type="CASE",
        resource_id="TEST-102",
        details={"note": "second entry"},
    )
    assert e2 is not None
    assert e2.previous_hash == e1.entry_hash
    assert e2.entry_hash is not None


def test_audit_hash_chain_verification_passes_on_clean_chain(db_session):
    """Verify that verify_audit_chain reports PASS on untampered data."""
    report = verify_audit_chain(db_session)
    assert report["status"] == "PASS"
    assert len(report["mismatches"]) == 0


def test_audit_hash_chain_tamper_detection(db_session):
    """Verify that directly altering an audit row causes verify_audit_chain to detect the tamper."""
    # Create an entry to tamper with
    entry = log_audit_action_with_chain(
        db=db_session,
        action="TAMPER_TARGET_ACTION",
        resource_type="CASE",
        resource_id="TAMPER-01",
    )
    assert entry is not None
    entry_id = entry.id

    # Tamper with the record directly bypassing chain computation
    tamper_res = simulate_tamper_audit(db=db_session, record_id=entry_id)
    assert tamper_res["success"] is True

    # Verify chain now fails
    report = verify_audit_chain(db_session)
    assert report["status"] == "FAIL"
    assert any(m["id"] == entry_id for m in report["mismatches"])

    # Restore the entry action for subsequent tests
    target = db_session.query(AuditLog).filter(AuditLog.id == entry_id).first()
    target.action = tamper_res["original_action"]
    db_session.commit()


# ── 4. Local Cryptographic Integrity Ledger (Merkle Tree) ────────────────────

def test_merkle_root_computation_deterministic():
    """Verify that compute_merkle_root is deterministic and handles various leaf counts."""
    leaves = [
        "a" * 64,
        "b" * 64,
        "c" * 64,
        "d" * 64,
    ]
    root1 = compute_merkle_root(leaves)
    root2 = compute_merkle_root(leaves)
    assert root1 == root2
    assert len(root1) == 64

    # Single leaf
    single_root = compute_merkle_root(["e" * 64])
    assert single_root == "e" * 64

    # Empty list
    empty_root = compute_merkle_root([])
    assert len(empty_root) == 64


def test_merkle_anchor_creation_and_verification(db_session):
    """Verify anchoring audit & evidence entries and verifying stored Merkle roots."""
    anchor_res = anchor_all_unanchored(db=db_session, user_id=None)
    assert "anchors_created" in anchor_res

    # Check anchors in database
    anchors = db_session.query(IntegrityAnchor).all()
    assert len(anchors) >= 0

    # Verify all anchors pass
    merkle_report = verify_merkle_anchors(db_session)
    assert merkle_report["status"] in ("PASS", "EMPTY")


# ── 5. System Integrity Endpoints & Tamper Simulation ─────────────────────────

def test_admin_integrity_verify_endpoint(admin_token):
    """Verify the POST /admin/integrity/verify endpoint returns structured PASS report."""
    res = client.post("/api/v1/admin/integrity/verify", headers=admin_token)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "status" in data
    assert "audit_chain" in data
    assert "evidence_hashes" in data
    assert "merkle_anchors" in data


def test_admin_integrity_anchor_endpoint(admin_token):
    """Verify the POST /admin/integrity/anchor endpoint batches entries into Merkle anchors."""
    res = client.post("/api/v1/admin/integrity/anchor", headers=admin_token)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "anchors_created" in data


def test_admin_integrity_anchors_list_endpoint(admin_token):
    """Verify GET /admin/integrity/anchors returns local ledger anchors."""
    res = client.get("/api/v1/admin/integrity/anchors", headers=admin_token)
    assert res.status_code == 200
    assert isinstance(res.json()["data"], list)


def test_admin_simulate_tamper_and_detect(admin_token, db_session):
    """Verify full end-to-end tamper simulation and detection flow."""
    # Simulate tamper on audit log
    tamper_res = client.post(
        "/api/v1/admin/integrity/simulate-tamper",
        json={"target": "audit_log"},
        headers=admin_token,
    )
    assert tamper_res.status_code == 200
    assert tamper_res.json()["data"]["success"] is True
    tampered_id = tamper_res.json()["data"]["tampered_record_id"]

    # Run verification - should report audit chain mismatch and overall status FAIL
    verify_res = client.post("/api/v1/admin/integrity/verify", headers=admin_token)
    assert verify_res.status_code == 200
    data = verify_res.json()["data"]
    assert data["status"] == "FAIL"
    assert data["audit_chain"]["status"] == "FAIL"

    # Restore audit record
    target = db_session.query(AuditLog).filter(AuditLog.id == tampered_id).first()
    target.action = tamper_res.json()["data"]["original_action"]
    db_session.commit()


# ── 6. Legal Authorization Tracking (CDR / Financial) ─────────────────────────

def test_cdr_upload_without_authorization_reference_fails(investigator_token):
    """Verify that uploading CDR data without authorization_reference returns 422 Unprocessable Entity."""
    cdr_csv = "caller,receiver,duration,timestamp\n+919811044501,+919811099999,120,2025-05-01 10:00:00\n"
    files = {"file": ("call_detail_records.csv", io.BytesIO(cdr_csv.encode()), "text/csv")}
    data = {"source_type": "CDR"}
    res = client.post("/api/v1/ingest/file", files=files, data=data, headers=investigator_token)
    assert res.status_code == 422
    assert "authorization_reference is required" in res.json()["detail"]


def test_financial_upload_without_authorization_reference_fails(investigator_token):
    """Verify that uploading Financial records without authorization_reference returns 422."""
    fin_csv = "source_account,target_account,amount,timestamp\n1122334455,9988776655,500000,2025-05-01\n"
    files = {"file": ("bank_transactions.csv", io.BytesIO(fin_csv.encode()), "text/csv")}
    data = {"source_type": "FINANCIAL"}
    res = client.post("/api/v1/ingest/file", files=files, data=data, headers=investigator_token)
    assert res.status_code == 422
    assert "authorization_reference is required" in res.json()["detail"]


def test_cdr_upload_with_authorization_reference_succeeds(investigator_token, db_session):
    """Verify that uploading CDR with court order reference succeeds and logs custody event."""
    cdr_csv = "caller,receiver,duration,timestamp\n+919811011111,+919811022222,45,2025-05-02 12:00:00\n"
    files = {"file": ("auth_cdr_sample.csv", io.BytesIO(cdr_csv.encode()), "text/csv")}
    data = {
        "source_type": "CDR",
        "authorization_reference": "Court Order No. CR-2025-8819/Spl-CBI-Judge-Delhi (Dt: 2025-04-30)",
    }
    res = client.post("/api/v1/ingest/file", files=files, data=data, headers=investigator_token)
    assert res.status_code == 201
    data_res = res.json()["data"]
    ds_id = data_res["data_source_id"]

    # Verify authorization_reference stored on DataSource
    ds = db_session.query(DataSource).filter(DataSource.id == ds_id).first()
    assert ds is not None
    assert "CR-2025-8819" in ds.authorization_reference

    # Verify UPLOAD CustodyEvent was recorded
    custody = db_session.query(CustodyEvent).filter(
        CustodyEvent.data_source_id == ds_id,
        CustodyEvent.action == "UPLOAD",
    ).first()
    assert custody is not None
    assert custody.content_hash_at_time is not None


# ── 7. Case Brief Evidence Integrity Section ──────────────────────────────────

def test_case_export_markdown_contains_integrity_section(investigator_token):
    """Verify that the exported court brief in Markdown includes evidence hashes and audit reference."""
    res = client.get("/api/v1/cases/101/export?format=markdown", headers=investigator_token)
    assert res.status_code == 200
    content = res.text
    assert "EVIDENCE INTEGRITY & CRYPTOGRAPHIC PROVENANCE" in content
    assert "CHAIN OF CUSTODY & AUDIT VERIFICATION" in content
    assert "SIH-AUDIT-101-" in content
    assert "Section 65B" in content


def test_case_export_pdf_succeeds(investigator_token):
    """Verify that the court brief PDF generates successfully with evidence integrity tables."""
    res = client.get("/api/v1/cases/101/export?format=pdf", headers=investigator_token)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000
