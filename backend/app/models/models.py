"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
SQLAlchemy Database Models for Relational Storage & RBAC
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), default="")
    role = Column(String(20), default="investigator")  # admin, investigator, analyst
    is_active = Column(Boolean, default=True)
    badge_number = Column(String(50), default="POL-2026-IN")
    created_at = Column(DateTime, default=datetime.utcnow)

class CaseFile(Base):
    __tablename__ = "case_files"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    fir_number = Column(String(100), default="")
    police_station = Column(String(100), default="")
    state = Column(String(50), default="Delhi")
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_hash_sha256 = Column(String(64), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    raw_text = Column(Text, default="")
    summary_text = Column(Text, default="")
    status = Column(String(30), default="PROCESSED")  # UPLOADED, PROCESSING, PROCESSED, FAILED
    uploaded_by = Column(String(50), default="Investigator")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    entities = relationship("ExtractedEntityRecord", back_populates="case_file", cascade="all, delete-orphan")
    relationships = relationship("ExtractedRelationRecord", back_populates="case_file", cascade="all, delete-orphan")

class ExtractedEntityRecord(Base):
    __tablename__ = "extracted_entities"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("case_files.case_id"), nullable=False, index=True)
    text = Column(String(255), nullable=False)
    normalized = Column(String(255), nullable=False, index=True)
    label = Column(String(50), nullable=False, index=True)  # SUSPECT_PERSON, VEHICLE_NUMBER, PHONE_NUMBER, etc.
    confidence = Column(Float, default=0.90)
    extractor = Column(String(50), default="NLP_HYBRID")

    case_file = relationship("CaseFile", back_populates="entities")

class ExtractedRelationRecord(Base):
    __tablename__ = "extracted_relations"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("case_files.case_id"), nullable=False, index=True)
    source = Column(String(255), nullable=False, index=True)
    source_type = Column(String(50), default="Entity")
    relation = Column(String(50), nullable=False, index=True)  # CO_ACCUSED, OWNS_VEHICLE, CALLED, etc.
    target = Column(String(255), nullable=False, index=True)
    target_type = Column(String(50), default="Entity")
    confidence = Column(Float, default=0.90)
    evidence_sentence = Column(Text, default="")

    case_file = relationship("CaseFile", back_populates="relationships")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False)
    role = Column(String(20), default="investigator")
    action = Column(String(100), nullable=False)  # UPLOAD_FIR, VIEW_GRAPH, EXPORT_BRIEF, SEED_DATASET
    resource = Column(String(255), default="")
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow)
