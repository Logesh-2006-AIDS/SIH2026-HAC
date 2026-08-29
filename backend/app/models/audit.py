from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from app.db.postgres import Base


class AuditLog(Base):
    """Tamper-evident audit log for legal compliance and accountability."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User")
    
    action = Column(String(100), nullable=False, index=True)  # SEARCH, GRAPH_EXPAND, MERGE_ENTITY, EXPORT_REPORT
    resource_type = Column(String(100), nullable=False)       # ENTITY, CASE, GRAPH, USER
    resource_id = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)                    # Payload details / query terms
