from fastapi import APIRouter
from app.schemas.common import Message

router = APIRouter()


@router.get("/status", response_model=Message)
def auth_status():
    """Auth service placeholder."""
    return Message(message="Auth service active. JWT authentication ready.")
