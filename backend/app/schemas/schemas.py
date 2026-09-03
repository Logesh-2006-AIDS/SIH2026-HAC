"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Pydantic Data Validation & Response Schemas
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    full_name: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "investigator"
    badge_number: Optional[str] = "POL-2026-IN"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    badge_number: str
    created_at: datetime

    class Config:
        from_attributes = True

# NLP & Case Schemas
class NLPProcessRequest(BaseModel):
    text: str
    case_id: Optional[str] = "CASE-AUTO"

class EntitySchema(BaseModel):
    text: str
    normalized: str
    label: str
    confidence: float
    extractor: str
    start: Optional[int] = 0
    end: Optional[int] = 0

class RelationshipSchema(BaseModel):
    source: str
    source_type: str
    relation: str
    target: str
    target_type: str
    confidence: float
    evidence: str

class ResolvedClusterSchema(BaseModel):
    canonical_name: str
    label: str
    aliases: List[str]
    phonetic_code: str
    mentions: int
    confidence: float
    rationale: str

class NLPProcessResponse(BaseModel):
    case_id: str
    status: str
    summary: Dict[str, Any]
    entities: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]
    resolved_clusters: List[Dict[str, Any]]
    sections: Dict[str, str]

# Case File Schemas
class CaseFileResponse(BaseModel):
    id: int
    case_id: str
    title: str
    fir_number: str
    police_station: str
    state: str
    original_filename: str
    file_path: str
    file_hash_sha256: str
    file_size_bytes: int
    status: str
    uploaded_by: str
    created_at: datetime
    entities_count: Optional[int] = 0
    relationships_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Graph Schemas
class GraphNode(BaseModel):
    id: str
    label: str
    name: Optional[str] = None
    aliases: Optional[List[str]] = None
    properties: Optional[Dict[str, Any]] = None

class GraphEdge(BaseModel):
    source: str
    target: str
    type: str
    properties: Optional[Dict[str, Any]] = None

class GraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    stats: Dict[str, Any]
    engine: str

# Audit Log Schema
class AuditLogResponse(BaseModel):
    id: int
    username: str
    role: str
    action: str
    resource: str
    ip_address: str
    timestamp: datetime

    class Config:
        from_attributes = True
