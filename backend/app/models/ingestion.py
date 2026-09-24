"""
Ingestion models for tracking imported documents, pipeline steps, and extracted raw records.
"""
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Float, Boolean
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from app.db.postgres import Base


class DataSourceType(str, enum.Enum):
    FIR_REPORT        = "FIR_REPORT"
    CDR               = "CDR"
    FINANCIAL         = "FINANCIAL"
    SOCIAL_MEDIA      = "SOCIAL_MEDIA"
    CRIMINAL_HISTORY  = "CRIMINAL_HISTORY"
    SURVEILLANCE      = "SURVEILLANCE"
    INTELLIGENCE      = "INTELLIGENCE"
    JSON_IMPORT       = "JSON_IMPORT"
    CSV_IMPORT        = "CSV_IMPORT"


class IngestStatus(str, enum.Enum):
    PENDING    = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED  = "COMPLETED"
    FAILED     = "FAILED"


class PipelineStep(str, enum.Enum):
    UPLOAD                  = "UPLOAD"
    VALIDATE                = "VALIDATE"
    CLEAN                   = "CLEAN"
    NLP_EXTRACTION          = "NLP_EXTRACTION"
    ENTITY_RESOLUTION       = "ENTITY_RESOLUTION"
    RELATIONSHIP_EXTRACTION = "RELATIONSHIP_EXTRACTION"
    GRAPH_INSERTION         = "GRAPH_INSERTION"
    COMPLETED               = "COMPLETED"


class DataSource(Base):
    """Tracks each ingested file / document across all 8 pipeline steps."""
    __tablename__ = "data_sources"

    id                  = Column(Integer, primary_key=True, index=True)
    filename            = Column(String(255), nullable=False)
    source_type         = Column(Enum(DataSourceType), nullable=False)
    file_path           = Column(String(500), nullable=True)
    file_storage_path   = Column(String(500), nullable=True)
    file_size_bytes     = Column(Integer, nullable=True)
    content_hash        = Column(String(64), nullable=True, index=True)
    case_id_ref         = Column(String(50), nullable=True)
    status              = Column(Enum(IngestStatus), default=IngestStatus.PENDING)
    current_step        = Column(String(50), default=PipelineStep.UPLOAD.value)
    failed_step         = Column(String(50), nullable=True)
    step_progress       = Column(JSON, nullable=True)  # dict mapping step_name -> {status, latency_ms, details}
    row_count           = Column(Integer, nullable=True)
    entities_count      = Column(Integer, default=0)
    relationships_count = Column(Integer, default=0)
    error_log           = Column(Text, nullable=True)
    ingested_at         = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ingested_by         = Column(Integer, ForeignKey("users.id"), nullable=True)


class RawEntity(Base):
    """Raw entity mentions extracted during ingestion (pre NLP / resolution)."""
    __tablename__ = "raw_entities"

    id                 = Column(Integer, primary_key=True, index=True)
    data_source_id     = Column(Integer, ForeignKey("data_sources.id"), nullable=False)
    entity_type        = Column(String(50), nullable=False)   # PERSON, PHONE, VEHICLE, LOCATION, ORGANIZATION, FINANCIAL_ACCOUNT
    raw_text           = Column(Text, nullable=False)          # Original mention text from document
    normalized         = Column(String(255), nullable=True)    # Post-normalization canonical form
    confidence         = Column(Float, default=1.0)
    source_case_id     = Column(String(50), nullable=True)
    resolved_entity_id = Column(String(100), nullable=True)   # Node ID in graph store after resolution
    is_resolved        = Column(Boolean, default=False)
    extracted_at       = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    meta               = Column(JSON, nullable=True)           # Extra attributes (sentence offset, extraction_method, etc.)


class PendingResolution(Base):
    """Candidate entity merge pairs pending analyst verification (Human-in-the-Loop)."""
    __tablename__ = "pending_resolutions"

    id               = Column(Integer, primary_key=True, index=True)
    entity_a_id      = Column(Integer, nullable=True)      # FK or reference to raw entity / node id
    entity_b_id      = Column(Integer, nullable=True)
    node_a_id        = Column(String(100), nullable=False) # Graph node ID A
    node_b_id        = Column(String(100), nullable=False) # Graph node ID B
    node_a_name      = Column(String(255), nullable=True)
    node_b_name      = Column(String(255), nullable=True)
    entity_type      = Column(String(50), default="Person")
    similarity_score = Column(Float, nullable=False)       # 0.0 - 1.0 or 0 - 100
    match_reason     = Column(Text, nullable=True)         # Human-readable justification
    signals          = Column(JSON, nullable=True)         # Corroborating signals breakdown
    status           = Column(String(50), default="PENDING")  # PENDING / APPROVED / REJECTED / SPLIT
    reviewed_by      = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at      = Column(DateTime(timezone=True), nullable=True)
    merge_log        = Column(JSON, nullable=True)         # Reversible state log for SPLIT actions
    created_at       = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
