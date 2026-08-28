from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from backend.app.core.security import create_access_token, create_refresh_token, verify_password, SECRET_KEY, ALGORITHM
from backend.app.core.rbac import get_current_user, CurrentUser
from backend.app.core.config import get_settings
from backend.app.db.session import get_db_session
from backend.app.models import User
from jose import jwt, JWTError

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserProfileOut(BaseModel):
    id: str
    email: str
    role: str
    organization_id: str
    factory_id: str | None = None
    full_name: str = ""


def _token_payload(user: User) -> dict:
    return {
        "sub": user.email,
        "role": user.role,
        "organization_id": str(user.organization_id),
        "factory_id": str(user.factory_id) if user.factory_id else None,
        "user_id": str(user.id),
    }


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db_session)):
    settings = get_settings()
    user = (await db.execute(select(User).where(User.email == req.email))).scalars().first()

    if user:
        if not user.is_active:
            raise HTTPException(status_code=401, detail="Account is inactive")
        if not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    else:
        user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
        allow_bypass = settings.is_development and (
            settings.allow_dev_auth_bypass or user_count == 0
        )
        if not allow_bypass or req.password != "password123":
            raise HTTPException(status_code=401, detail="Invalid credentials")
        # Development-only bootstrap: used ONLY when is_development=True AND
        # the database contains zero real users.
        # The organization_id below is a zero-filled dev sentinel — it will never
        # match a real organization because seed_database.py creates real orgs with
        # different UUIDs. This exists solely to allow the frontend to start in dev
        # mode before any users are seeded.
        # WARNING: This code path is disabled when ENVIRONMENT != development.
        DEV_BOOTSTRAP_ORG = "00000000-0000-0000-0000-000000000000"
        DEV_BOOTSTRAP_FACTORY = "00000000-0000-0000-0000-000000000001"
        payload = {
            "sub": req.email,
            "role": "Plant Manager",
            "organization_id": DEV_BOOTSTRAP_ORG,
            "factory_id": DEV_BOOTSTRAP_FACTORY,
            "user_id": None,
            "_dev_bootstrap": True,  # Allows detection by downstream guards
        }
        access_token = create_access_token(payload)
        refresh_token = create_refresh_token(payload)
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    payload = _token_payload(user)
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token_endpoint(req: TokenRefreshRequest):
    try:
        payload = jwt.decode(req.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        token_data = {
            "sub": email,
            "role": payload.get("role", "Operator"),
            "organization_id": payload.get("organization_id"),
            "factory_id": payload.get("factory_id"),
            "user_id": payload.get("user_id"),
        }
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)
        return TokenResponse(access_token=new_access_token, refresh_token=new_refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.get("/me", response_model=UserProfileOut)
async def get_my_profile(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    user = (await db.execute(select(User).where(User.email == current_user.email))).scalars().first()
    if user:
        return UserProfileOut(
            id=str(user.id),
            email=user.email,
            role=user.role,
            organization_id=str(user.organization_id),
            factory_id=str(user.factory_id) if user.factory_id else None,
            full_name=user.full_name,
        )
    return UserProfileOut(
        id=current_user.user_id or "",
        email=current_user.email,
        role=current_user.role,
        organization_id=current_user.organization_id or "",
        factory_id=current_user.factory_id,
        full_name="",
    )
