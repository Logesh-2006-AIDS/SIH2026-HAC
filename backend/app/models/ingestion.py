"""
Ingestion models for tracking imported documents and extracted raw records.
"""
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Float, Boolean
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from app.db.postgres import Base


class DataSourceType(str, enum.Enum):
    FIR_REPORT   = "FIR_REPORT"
    CDR          = "CDR"
    FINANCIAL    = "FINANCIAL"
    INTELLIGENCE = "INTELLIGENCE"
    JSON_IMPORT  = "JSON_IMPORT"
    CSV_IMPORT   = "CSV_IMPORT"


class IngestStatus(str, enum.Enum):
    PENDING    = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED  = "COMPLETED"
    FAILED     = "FAILED"


class DataSource(Base):
    """Tracks each ingested file / document."""
    __tablename__ = "data_sources"

    id           = Column(Integer, primary_key=True, index=True)
    filename     = Column(String(255), nullable=False)
    source_type  = Column(Enum(DataSourceType), nullable=False)
    file_path    = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    case_id_ref  = Column(String(50), nullable=True)           # e.g. "101"
    status       = Column(Enum(IngestStatus), default=IngestStatus.PENDING)
    row_count    = Column(Integer, nullable=True)
    error_log    = Column(Text, nullable=True)
    ingested_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ingested_by  = Column(Integer, ForeignKey("users.id"), nullable=True)


class RawEntity(Base):
    """Raw entity mentions extracted during ingestion (pre NLP / resolution)."""
    __tablename__ = "raw_entities"

    id            = Column(Integer, primary_key=True, index=True)
    data_source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=False)
    entity_type   = Column(String(50), nullable=False)   # PERSON, PHONE, ORG, LOCATION, VEHICLE, ACCOUNT
    raw_text      = Column(Text, nullable=False)          # Original mention text from document
    normalized    = Column(String(255), nullable=True)    # Post-normalization canonical form
    confidence    = Column(Float, default=1.0)
    source_case_id= Column(String(50), nullable=True)
    resolved_entity_id = Column(String(100), nullable=True)   # FK to Neo4j node ID after resolution
    is_resolved   = Column(Boolean, default=False)
    extracted_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    meta          = Column(JSON, nullable=True)           # Extra attributes (sentence offset, etc.)


class PendingResolution(Base):
    """Candidate entity merge pairs pending investigator verification (Human-in-the-Loop)."""
    __tablename__ = "pending_resolutions"

    id              = Column(Integer, primary_key=True, index=True)
    entity_a_id     = Column(Integer, ForeignKey("raw_entities.id"), nullable=False)
    entity_b_id     = Column(Integer, ForeignKey("raw_entities.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    match_reason    = Column(Text, nullable=True)         # Human-readable justification
    status          = Column(String(50), default="PENDING")  # PENDING / ACCEPTED / REJECTED
    reviewed_by     = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at     = Column(DateTime(timezone=True), nullable=True)
    created_at      = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
