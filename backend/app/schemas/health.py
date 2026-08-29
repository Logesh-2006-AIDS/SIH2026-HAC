from typing import Dict
from pydantic import BaseModel


class ServiceStatus(BaseModel):
    status: str
    details: str


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    services: Dict[str, ServiceStatus]
