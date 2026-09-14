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

    # PostgreSQL
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "sih_db"
    DATABASE_URL: str = ""

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Memgraph (Bolt) — preferred graph store
    MEMGRAPH_URI: str = "bolt://localhost:7687"
    MEMGRAPH_USER: str = ""
    MEMGRAPH_PASSWORD: str = ""

    # Legacy env aliases (map to Memgraph; Neo4j is NOT used)
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = ""
    NEO4J_PASSWORD: str = ""
    NEO4J_DATABASE: str = ""

    def model_post_init(self, __context) -> None:
        # Prefer explicit MEMGRAPH_* ; fall back to NEO4J_* env if present
        if self.NEO4J_URI and self.MEMGRAPH_URI == "bolt://localhost:7687":
            # Keep MEMGRAPH_URI authoritative when set in .env
            pass
        if not self.MEMGRAPH_USER and self.NEO4J_USER:
            object.__setattr__(self, "MEMGRAPH_USER", self.NEO4J_USER)
        if not self.MEMGRAPH_PASSWORD and self.NEO4J_PASSWORD:
            object.__setattr__(self, "MEMGRAPH_PASSWORD", self.NEO4J_PASSWORD)

    # Redis
    USE_REDIS: bool = True
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
