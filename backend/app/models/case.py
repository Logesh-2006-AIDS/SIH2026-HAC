import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.postgres import Base


class CaseStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    PENDING_TRIAL = "PENDING_TRIAL"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"


class CasePriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    crime_category = Column(String(100), nullable=False) # e.g. Extortion, Cyber Fraud, Smuggling
    jurisdiction = Column(String(100), nullable=True)
    status = Column(Enum(CaseStatus), default=CaseStatus.UNDER_INVESTIGATION, nullable=False)
    priority = Column(Enum(CasePriority), default=CasePriority.HIGH, nullable=False)
    incident_date = Column(DateTime(timezone=True), nullable=True)
    
    lead_investigator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    lead_investigator = relationship("User", foreign_keys=[lead_investigator_id])

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
