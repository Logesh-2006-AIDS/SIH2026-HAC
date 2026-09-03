"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
Authentication & Role-Based Access Control API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, AuditLog
from app.schemas.schemas import Token, LoginRequest, UserCreate, UserResponse
from app.core.security import verify_password, get_password_hash, create_access_token, oauth2_scheme, decode_access_token

router = APIRouter()

# Default predefined users for hackathon demo
DEMO_USERS = [
    {"username": "admin", "password": "password123", "role": "admin", "full_name": "Chief Administrator", "email": "admin@police.gov.in"},
    {"username": "investigator", "password": "password123", "role": "investigator", "full_name": "Senior IO Rajesh Varma", "email": "rajesh.io@police.gov.in"},
    {"username": "analyst", "password": "password123", "role": "analyst", "full_name": "Intelligence Analyst Priya Sen", "email": "priya.intel@police.gov.in"}
]

def init_demo_users(db: Session):
    for u in DEMO_USERS:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            new_u = User(
                username=u["username"],
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                badge_number=f"BADGE-{u['role'].upper()}-01"
            )
            db.add(new_u)
    db.commit()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    init_demo_users(db)
    if not token:
        # Default fallback for testing
        user = db.query(User).filter(User.username == "investigator").first()
        if user:
            return user
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    username: str = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    init_demo_users(db)
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    access_token = create_access_token(subject=user.username, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "full_name": user.full_name
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
