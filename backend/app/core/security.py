import uuid
import jwt
from typing import Optional
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import settings

security = HTTPBearer(auto_error=False)


def ensure_valid_uuid(uid: str) -> str:
    if not uid:
        return "00000000-0000-0000-0000-000000000001"
    try:
        return str(uuid.UUID(uid))
    except (ValueError, AttributeError):
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(uid)))


class AuthUser:
    def __init__(self, user_id: str, email: Optional[str] = None, is_mock: bool = False):
        self.user_id = user_id
        self.email = email or ""
        self.is_mock = is_mock


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> AuthUser:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Test / Mock token support for local testing / development
    if token.startswith("test-token-") or token.startswith("mock-token-"):
        raw_uid = token.replace("test-token-", "").replace("mock-token-", "")
        uid = ensure_valid_uuid(raw_uid)
        return AuthUser(user_id=uid, email="test@example.com", is_mock=True)

    # If Supabase JWT Secret is configured, verify signature
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            raw_user_id = payload.get("sub")
            if not raw_user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token missing subject (user_id)",
                )
            user_id = ensure_valid_uuid(raw_user_id)
            email = payload.get("email", "")
            return AuthUser(user_id=user_id, email=email, is_mock=False)
        except jwt.PyJWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication credentials: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # Development fallback if secret not set yet: decode unverified
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            raw_user_id = payload.get("sub") or "00000000-0000-0000-0000-000000000001"
            user_id = ensure_valid_uuid(raw_user_id)
            email = payload.get("email", "")
            return AuthUser(user_id=user_id, email=email, is_mock=False)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format",
            )
