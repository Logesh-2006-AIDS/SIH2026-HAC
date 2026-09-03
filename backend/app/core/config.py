"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Core Configuration & Environment Settings
"""
import os
from pydantic_settings import BaseSettings
from typing import List

_base_d = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_data_d = os.path.join(_base_d, "data")
_upload_d = os.path.join(_data_d, "uploads", "fir")
_dataset_d = os.path.join(_data_d, "dataset")
_db_file = os.path.join(_data_d, "investigation.db").replace("\\", "/")
_default_db_url = f"sqlite:///{_db_file}"

os.makedirs(_upload_d, exist_ok=True)
os.makedirs(_dataset_d, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "SIH 2026 Criminal Network Investigation Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "sih_2026_super_secure_jwt_token_secret_house_targaryen"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Local Storage Paths
    BASE_DIR: str = _base_d
    DATA_DIR: str = _data_d
    UPLOAD_DIR: str = _upload_d
    DATASET_DIR: str = _dataset_d

    # Database: SQLite for zero-config hackathon reliability, can switch to PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", _default_db_url)

    # Neo4j Graph Database
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password123")
    NEO4J_DATABASE: str = os.getenv("NEO4J_DATABASE", "neo4j")
 
    # Stitch API Integration
    STITCH_API_KEY: str = os.getenv("STITCH_API_KEY", "")
    STITCH_API_URL: str = os.getenv("STITCH_API_URL", "https://api.stitchdata.com/v2/import/push")

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]

    class Config:
        case_sensitive = True

settings = Settings()
