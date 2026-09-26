"""
Phase 4: Integrity models — IntegrityAnchor and CustodyEvent.

IntegrityAnchor: Local integrity ledger entries storing Merkle roots over
batches of audit-log and evidence hashes. This is a local cryptographic
integrity ledger — NOT a blockchain or distributed ledger.

CustodyEvent: Chain-of-custody log for evidence files. Records every
access (upload, view, download, export) with the file's hash at that time.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from app.db.postgres import Base


class IntegrityAnchor(Base):
    """
    Local integrity ledger entry.

    Periodically batches audit-log entry_hashes and/or evidence content_hashes
    into a binary Merkle tree, storing the Merkle root alongside the range of
    entries it covers. Used by the Verify Integrity feature to detect tampering.

    This is a local append-only ledger — not a blockchain network.
    """
    __tablename__ = "integrity_anchors"

    id = Column(Integer, primary_key=True, index=True)
    anchor_type = Column(String(30), nullable=False)        # AUDIT_LOG | EVIDENCE | COMBINED
    entry_range_start = Column(Integer, nullable=True)      # First audit_log.id in batch
    entry_range_end = Column(Integer, nullable=True)         # Last audit_log.id in batch
    leaf_count = Column(Integer, nullable=False)             # Number of hashes in the Merkle tree
    merkle_root = Column(String(64), nullable=False)         # SHA-256 Merkle root
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    details = Column(JSON, nullable=True)                    # Leaf hashes, tree depth, etc.


class CustodyEvent(Base):
    """
    Chain-of-custody log for evidence files.

    Every time an evidence file (DataSource) is uploaded, viewed, downloaded,
    or exported, a CustodyEvent is recorded capturing who, when, what action,
    and the file's content hash at that moment.
    """
    __tablename__ = "custody_events"

    id = Column(Integer, primary_key=True, index=True)
    data_source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=False)
    action = Column(String(50), nullable=False)             # UPLOAD, VIEW, DOWNLOAD, EXPORT
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    content_hash_at_time = Column(String(64), nullable=True)  # SHA-256 snapshot at event time
    ip_address = Column(String(45), nullable=True)
    details = Column(JSON, nullable=True)
