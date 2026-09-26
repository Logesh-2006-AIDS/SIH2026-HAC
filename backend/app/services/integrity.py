"""
Phase 4: Integrity service — hash chain, Merkle tree, verification, and tamper simulation.

Provides:
- SHA-256 hash-chain computation for audit log entries
- Binary Merkle tree construction and root computation
- Backfill of existing audit log rows with hash chain
- Integrity verification (audit chain, evidence hashes, Merkle anchors)
- Tamper simulation for demo purposes
- Custody event logging for evidence files
"""
import hashlib
import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.ingestion import DataSource
from app.models.integrity import CustodyEvent, IntegrityAnchor

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

GENESIS_HASH = hashlib.sha256(b"GENESIS_SIH_2026_AUDIT_CHAIN").hexdigest()

# Auto-anchor after this many new un-anchored audit entries
AUTO_ANCHOR_THRESHOLD = 50


# ── Hash Chain ────────────────────────────────────────────────────────────────

def compute_entry_hash(
    actor: str,
    action: str,
    target: str,
    timestamp_iso: str,
    previous_hash: str,
) -> str:
    """
    Compute SHA-256 hash for a single audit log entry.

    Hash = SHA-256(actor|action|target|timestamp|previous_hash)
    """
    payload = f"{actor}|{action}|{target}|{timestamp_iso}|{previous_hash}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _entry_actor(log: AuditLog) -> str:
    """Extract actor identifier from an audit log entry."""
    return str(log.user_id or "SYSTEM")


def _entry_target(log: AuditLog) -> str:
    """Extract target identifier from an audit log entry."""
    parts = [log.resource_type or ""]
    if log.resource_id:
        parts.append(log.resource_id)
    return ":".join(parts)


def _entry_timestamp(log: AuditLog) -> str:
    """Extract consistent UTC timestamp string from an audit log entry."""
    if not log.timestamp:
        return ""
    if hasattr(log.timestamp, "strftime"):
        return log.timestamp.strftime("%Y-%m-%dT%H:%M:%S")
    return str(log.timestamp)[:19].replace(" ", "T")


def compute_chain_hash_for_entry(log: AuditLog, previous_hash: str) -> str:
    """Compute the entry_hash for a given AuditLog row and its predecessor's hash."""
    return compute_entry_hash(
        actor=_entry_actor(log),
        action=log.action or "",
        target=_entry_target(log),
        timestamp_iso=_entry_timestamp(log),
        previous_hash=previous_hash,
    )


def log_audit_action_with_chain(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    user_id: Optional[int] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> Optional[AuditLog]:
    """
    Record an audit log entry with SHA-256 hash chain.

    Fetches the previous entry's hash, computes this entry's hash, and stores both.
    """
    try:
        # Get the latest entry's hash to chain from
        latest = (
            db.query(AuditLog.entry_hash)
            .order_by(AuditLog.id.desc())
            .first()
        )
        prev_hash = latest[0] if latest and latest[0] else GENESIS_HASH

        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
            previous_hash=prev_hash,
        )
        db.add(log)
        db.flush()  # Get the timestamp assigned by the DB

        # Compute entry hash now that we have all fields
        log.entry_hash = compute_chain_hash_for_entry(log, prev_hash)
        db.commit()
        return log
    except Exception as e:
        db.rollback()
        logger.warning("Audit log chain write failed: %s", e)
        return None


# ── Backfill ──────────────────────────────────────────────────────────────────

def backfill_audit_chain(db: Session, force: bool = False) -> int:
    """
    Backfill existing audit log rows that lack hash chain fields or repair chains.

    Reads all rows in id order, computes the chain from genesis, and updates
    previous_hash and entry_hash on each. Returns count of rows updated.
    """
    all_logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not all_logs:
        return 0

    if not force:
        missing_count = db.query(func.count(AuditLog.id)).filter(
            AuditLog.entry_hash.is_(None)
        ).scalar() or 0
        if missing_count == 0:
            return 0

    prev_hash = GENESIS_HASH
    updated = 0

    for log in all_logs:
        expected_hash = compute_chain_hash_for_entry(log, prev_hash)

        if log.entry_hash != expected_hash or log.previous_hash != prev_hash:
            log.previous_hash = prev_hash
            log.entry_hash = expected_hash
            updated += 1

        prev_hash = log.entry_hash

    db.commit()
    logger.info("Backfill complete: %d entries updated.", updated)
    return updated


# ── Merkle Tree ───────────────────────────────────────────────────────────────

def compute_merkle_root(leaf_hashes: List[str]) -> str:
    """
    Compute the Merkle root of a list of SHA-256 leaf hashes.

    Uses a standard binary Merkle tree. If the number of leaves is odd at
    any level, the last leaf is duplicated (standard padding).
    Returns the genesis hash if the list is empty.
    """
    if not leaf_hashes:
        return GENESIS_HASH

    # Convert to bytes for hashing
    level = [bytes.fromhex(h) for h in leaf_hashes]

    while len(level) > 1:
        next_level = []
        for i in range(0, len(level), 2):
            left = level[i]
            right = level[i + 1] if i + 1 < len(level) else level[i]  # duplicate last if odd
            combined = hashlib.sha256(left + right).digest()
            next_level.append(combined)
        level = next_level

    return level[0].hex()


# ── Anchoring ─────────────────────────────────────────────────────────────────

def get_last_anchored_audit_id(db: Session) -> int:
    """Get the highest audit_log.id covered by an existing anchor, or 0."""
    result = db.query(func.max(IntegrityAnchor.entry_range_end)).filter(
        IntegrityAnchor.anchor_type.in_(["AUDIT_LOG", "COMBINED"])
    ).scalar()
    return result or 0


def anchor_audit_entries(
    db: Session,
    user_id: Optional[int] = None,
    from_id: Optional[int] = None,
    to_id: Optional[int] = None,
) -> Optional[IntegrityAnchor]:
    """
    Batch un-anchored audit log entry_hashes into a Merkle tree and store
    the root as a new IntegrityAnchor row.
    """
    if from_id is None:
        from_id = get_last_anchored_audit_id(db) + 1

    query = db.query(AuditLog).filter(
        AuditLog.id >= from_id,
        AuditLog.entry_hash.isnot(None),
    )
    if to_id is not None:
        query = query.filter(AuditLog.id <= to_id)

    logs = query.order_by(AuditLog.id.asc()).all()

    if not logs:
        return None

    leaf_hashes = [log.entry_hash for log in logs]
    merkle_root = compute_merkle_root(leaf_hashes)

    anchor = IntegrityAnchor(
        anchor_type="AUDIT_LOG",
        entry_range_start=logs[0].id,
        entry_range_end=logs[-1].id,
        leaf_count=len(leaf_hashes),
        merkle_root=merkle_root,
        created_by=user_id,
        details={
            "tree_depth": math.ceil(math.log2(max(len(leaf_hashes), 1))) + 1 if leaf_hashes else 0,
            "first_entry_hash": leaf_hashes[0] if leaf_hashes else None,
            "last_entry_hash": leaf_hashes[-1] if leaf_hashes else None,
        },
    )
    db.add(anchor)
    db.commit()
    db.refresh(anchor)

    logger.info(
        "Anchored audit entries %d-%d (%d leaves) => Merkle root: %s",
        anchor.entry_range_start, anchor.entry_range_end,
        anchor.leaf_count, anchor.merkle_root[:16] + "...",
    )
    return anchor


def anchor_evidence_hashes(
    db: Session, user_id: Optional[int] = None,
) -> Optional[IntegrityAnchor]:
    """
    Batch all DataSource content_hashes into a Merkle tree and store the root.
    """
    sources = (
        db.query(DataSource)
        .filter(DataSource.content_hash.isnot(None))
        .order_by(DataSource.id.asc())
        .all()
    )
    if not sources:
        return None

    leaf_hashes = [s.content_hash for s in sources]
    merkle_root = compute_merkle_root(leaf_hashes)

    anchor = IntegrityAnchor(
        anchor_type="EVIDENCE",
        entry_range_start=sources[0].id,
        entry_range_end=sources[-1].id,
        leaf_count=len(leaf_hashes),
        merkle_root=merkle_root,
        created_by=user_id,
        details={
            "tree_depth": math.ceil(math.log2(max(len(leaf_hashes), 1))) + 1 if leaf_hashes else 0,
            "source_ids": [s.id for s in sources],
        },
    )
    db.add(anchor)
    db.commit()
    db.refresh(anchor)
    return anchor


def auto_anchor_if_needed(db: Session) -> Optional[IntegrityAnchor]:
    """Trigger auto-anchoring if enough un-anchored audit entries have accumulated."""
    last_anchored = get_last_anchored_audit_id(db)
    un_anchored = db.query(func.count(AuditLog.id)).filter(
        AuditLog.id > last_anchored,
        AuditLog.entry_hash.isnot(None),
    ).scalar() or 0

    if un_anchored >= AUTO_ANCHOR_THRESHOLD:
        return anchor_audit_entries(db)
    return None


def anchor_all_unanchored(db: Session, user_id: Optional[int] = None) -> Dict[str, Any]:
    """Batch all un-anchored audit logs and evidence hashes into Merkle anchors."""
    audit_anchor = anchor_audit_entries(db, user_id=user_id)
    evidence_anchor = anchor_evidence_hashes(db, user_id=user_id)
    anchors_created = 0
    anchor_ids = []
    if audit_anchor:
        anchors_created += 1
        anchor_ids.append(audit_anchor.id)
    if evidence_anchor:
        anchors_created += 1
        anchor_ids.append(evidence_anchor.id)
    return {
        "anchors_created": anchors_created,
        "anchor_ids": anchor_ids,
        "audit_anchor": {"id": audit_anchor.id, "merkle_root": audit_anchor.merkle_root} if audit_anchor else None,
        "evidence_anchor": {"id": evidence_anchor.id, "merkle_root": evidence_anchor.merkle_root} if evidence_anchor else None,
    }


def verify_full_system_integrity(db: Session) -> Dict[str, Any]:
    """Execute complete cryptographic integrity verification across all three dimensions."""
    report = verify_all_integrity(db)
    report["status"] = report.get("overall", "PASS")
    return report


# ── Verification ──────────────────────────────────────────────────────────────

def verify_audit_chain(db: Session) -> Dict[str, Any]:
    """
    Recompute the hash chain across all audit log entries and compare to stored hashes.
    Returns PASS or FAIL with the exact mismatching record(s).
    """
    all_logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()

    if not all_logs:
        return {"status": "PASS", "total_entries": 0, "mismatches": []}

    mismatches = []
    prev_hash = GENESIS_HASH

    for log in all_logs:
        expected_hash = compute_chain_hash_for_entry(log, prev_hash)

        if log.entry_hash != expected_hash:
            mismatches.append({
                "id": log.id,
                "timestamp": _entry_timestamp(log),
                "action": log.action,
                "expected_hash": expected_hash,
                "stored_hash": log.entry_hash,
                "reason": "entry_hash mismatch — record may have been tampered with",
            })

        if log.previous_hash != prev_hash:
            mismatches.append({
                "id": log.id,
                "timestamp": _entry_timestamp(log),
                "action": log.action,
                "expected_previous_hash": prev_hash,
                "stored_previous_hash": log.previous_hash,
                "reason": "previous_hash mismatch — chain link broken",
            })

        # Use stored hash to continue chain (to detect the FIRST tampered entry)
        prev_hash = log.entry_hash or expected_hash

    return {
        "status": "FAIL" if mismatches else "PASS",
        "total_entries": len(all_logs),
        "verified_entries": len(all_logs) - len(mismatches),
        "mismatches": mismatches,
    }


def verify_evidence_hashes(db: Session) -> Dict[str, Any]:
    """
    Recompute SHA-256 of evidence file content and compare to stored content_hash.

    For files with a file_storage_path that exists on disk, hashes the actual file bytes.
    For files without a physical path (demo/text-only ingestion), verifies the stored
    hash is present and well-formed but cannot re-derive it (marked as UNVERIFIABLE).
    """
    sources = db.query(DataSource).filter(DataSource.content_hash.isnot(None)).all()

    if not sources:
        return {"status": "PASS", "total_files": 0, "mismatches": []}

    mismatches = []
    verified = 0
    unverifiable = 0

    for src in sources:
        import os
        path = src.file_storage_path
        if path and os.path.isfile(path):
            # Hash actual file bytes on disk
            with open(path, "rb") as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()
            if file_hash != src.content_hash:
                mismatches.append({
                    "id": src.id,
                    "filename": src.filename,
                    "expected_hash": file_hash,
                    "stored_hash": src.content_hash,
                    "source": "file_bytes",
                    "reason": "File content hash mismatch — file may have been tampered with",
                })
            else:
                verified += 1
        elif src.content_hash and len(src.content_hash) == 64:
            # No physical file available but hash is stored and well-formed
            verified += 1
            unverifiable += 1
        else:
            mismatches.append({
                "id": src.id,
                "filename": src.filename,
                "stored_hash": src.content_hash,
                "source": "database_record",
                "reason": "Hash is missing or malformed",
            })

    return {
        "status": "FAIL" if mismatches else "PASS",
        "total_files": len(sources),
        "verified": verified,
        "unverifiable_no_file": unverifiable,
        "mismatches": mismatches,
    }


def verify_merkle_anchors(db: Session) -> Dict[str, Any]:
    """
    Recompute Merkle roots for all IntegrityAnchor records and compare to stored roots.
    """
    anchors = db.query(IntegrityAnchor).order_by(IntegrityAnchor.id.asc()).all()

    if not anchors:
        return {"status": "PASS", "total_anchors": 0, "mismatches": []}

    mismatches = []

    for anchor in anchors:
        if anchor.anchor_type == "AUDIT_LOG":
            logs = (
                db.query(AuditLog)
                .filter(
                    AuditLog.id >= anchor.entry_range_start,
                    AuditLog.id <= anchor.entry_range_end,
                    AuditLog.entry_hash.isnot(None),
                )
                .order_by(AuditLog.id.asc())
                .all()
            )
            leaf_hashes = [log.entry_hash for log in logs]
        elif anchor.anchor_type == "EVIDENCE":
            source_ids = (anchor.details or {}).get("source_ids")
            if source_ids:
                sources = (
                    db.query(DataSource)
                    .filter(DataSource.id.in_(source_ids))
                    .order_by(DataSource.id.asc())
                    .all()
                )
            else:
                sources = (
                    db.query(DataSource)
                    .filter(
                        DataSource.id >= anchor.entry_range_start,
                        DataSource.id <= anchor.entry_range_end,
                        DataSource.content_hash.isnot(None),
                    )
                    .order_by(DataSource.id.asc())
                    .all()
                )
            leaf_hashes = [s.content_hash for s in sources]
        else:
            # COMBINED or unknown — skip
            continue

        recomputed = compute_merkle_root(leaf_hashes)
        if recomputed != anchor.merkle_root:
            mismatches.append({
                "anchor_id": anchor.id,
                "anchor_type": anchor.anchor_type,
                "range": f"{anchor.entry_range_start}-{anchor.entry_range_end}",
                "expected_root": recomputed,
                "stored_root": anchor.merkle_root,
                "reason": "Merkle root mismatch — underlying entries may have been tampered with",
            })

    return {
        "status": "FAIL" if mismatches else "PASS",
        "total_anchors": len(anchors),
        "verified_anchors": len(anchors) - len(mismatches),
        "mismatches": mismatches,
    }


def verify_all_integrity(db: Session) -> Dict[str, Any]:
    """
    Run all three integrity checks and return a combined result.
    """
    audit_result = verify_audit_chain(db)
    evidence_result = verify_evidence_hashes(db)
    merkle_result = verify_merkle_anchors(db)

    overall = "PASS"
    if any(r["status"] == "FAIL" for r in [audit_result, evidence_result, merkle_result]):
        overall = "FAIL"

    return {
        "overall": overall,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "audit_chain": audit_result,
        "evidence_hashes": evidence_result,
        "merkle_anchors": merkle_result,
    }


# ── Tamper Simulation (Demo Only) ────────────────────────────────────────────

def simulate_tamper_audit(db: Session, record_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Demo-only: Modify one audit log entry's details field directly in the DB
    (bypassing normal write paths) so that the next Verify Integrity run fails.

    Clearly labeled as a demo/test-only action.
    """
    if record_id:
        target = db.query(AuditLog).filter(AuditLog.id == record_id).first()
    else:
        target = db.query(AuditLog).order_by(AuditLog.id.desc()).offset(1).first()

    if not target:
        return {"success": False, "reason": "No audit log entry found to tamper with."}

    original_action = target.action
    target.action = f"TAMPERED_{original_action}"
    # DO NOT recompute the hash — that's the point of this simulation
    db.commit()

    return {
        "success": True,
        "tampered_record_id": target.id,
        "original_action": original_action,
        "tampered_action": target.action,
        "note": "DEMO ONLY — this record's hash chain will now fail verification. "
                "Run the reset script or re-backfill to restore.",
    }


def simulate_tamper_evidence(db: Session, record_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Demo-only: Modify one DataSource content_hash to an invalid value so that
    the next Verify Integrity run fails.
    """
    if record_id:
        target = db.query(DataSource).filter(DataSource.id == record_id).first()
    else:
        target = db.query(DataSource).filter(DataSource.content_hash.isnot(None)).first()

    if not target:
        return {"success": False, "reason": "No evidence record found to tamper with."}

    original_hash = target.content_hash
    target.content_hash = hashlib.sha256(b"TAMPERED_EVIDENCE_DEMO").hexdigest()
    db.commit()

    return {
        "success": True,
        "tampered_record_id": target.id,
        "filename": target.filename,
        "original_hash": original_hash,
        "tampered_hash": target.content_hash,
        "note": "DEMO ONLY — this record's evidence hash will now fail verification. "
                "Run the reset script to restore.",
    }


# ── Custody Event Logging ─────────────────────────────────────────────────────

def log_custody_event(
    db: Session,
    data_source_id: int,
    action: str,
    user_id: Optional[int] = None,
    content_hash: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[dict] = None,
) -> Optional[CustodyEvent]:
    """Record a chain-of-custody event for an evidence file."""
    try:
        # If no hash provided, look it up from the DataSource
        if content_hash is None:
            src = db.query(DataSource.content_hash).filter(DataSource.id == data_source_id).first()
            content_hash = src[0] if src else None

        event = CustodyEvent(
            data_source_id=data_source_id,
            action=action,
            user_id=user_id,
            content_hash_at_time=content_hash,
            ip_address=ip_address,
            details=details,
        )
        db.add(event)
        db.commit()
        return event
    except Exception as e:
        db.rollback()
        logger.warning("Custody event logging failed: %s", e)
        return None
