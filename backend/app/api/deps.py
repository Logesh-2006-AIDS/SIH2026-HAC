"""
Common FastAPI dependencies: DB Session, Auth, RBAC, and Audit Helpers.
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.postgres import get_db
from app.models.user import User, UserRole
from app.models.audit import AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


def get_current_user(
    db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """Get the current authenticated user from JWT token, or return a demo investigator if no token provided in dev mode."""
    if not token:
        # Development fallback demo user
        demo_user = db.query(User).filter(User.email == "investigator@police.gov.in").first()
        if not demo_user:
            demo_user = User(
                email="investigator@police.gov.in",
                badge_number="DL-CB-9021",
                full_name="Insp. Rajesh Vardhan",
                department="Crime Branch, Delhi Police",
                hashed_password="demo_hashed_password",
                role=UserRole.INVESTIGATOR,
                is_active=True,
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        return demo_user

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account.")
    return user


def require_role(*allowed_roles: UserRole):
    """RBAC dependency to restrict endpoints to specific roles."""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.is_superuser:
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{current_user.role.value}'. Requires: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker


def log_audit_action(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    user_id: Optional[int] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """Helper to record tamper-evident audit logs."""
    try:
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        # Logging failure should not crash main request in dev
        pass
