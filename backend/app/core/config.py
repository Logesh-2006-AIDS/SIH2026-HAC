from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    APP_NAME: str = "AI-Powered Criminal Network Analysis Platform"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "sih_2026_super_secret_jwt_key_change_in_production_house_targaryen"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # Operating Modes
    DEMO_MODE: bool = True
    GRAPH_STORE: str = "fixture"  # "fixture" or "memgraph"

    # Evidence Store / Relational Database (Default: SQLite file for zero-Docker execution)
    DATABASE_URL: str = "sqlite:///./sih_evidence.db"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "sih_db"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return "sqlite:///./sih_evidence.db"

    # Memgraph (Bolt Protocol)
    MEMGRAPH_URI: str = "bolt://localhost:7687"
    MEMGRAPH_USER: str = ""
    MEMGRAPH_PASSWORD: str = ""

    # Redis
    USE_REDIS: bool = False
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


settings = Settings()
