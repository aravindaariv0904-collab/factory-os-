from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from backend.app.core.security import create_access_token, create_refresh_token, verify_password, SECRET_KEY, ALGORITHM
from backend.app.core.rbac import get_current_user, CurrentUser
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
    email: str
    role: str
    factory_id: str = "fact_01"
    full_name: str = ""


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db_session)):
    user = (await db.execute(select(User).where(User.email == req.email))).scalars().first()

    if user:
        if not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        role = user.role
        factory_id = user.factory_id or "fact_01"
    else:
        user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
        if user_count > 0 or req.password != "password123":
            raise HTTPException(status_code=401, detail="Invalid credentials")
        # Dev bootstrap: accept any seeded-style account when the DB is empty.
        role = "Plant Manager"
        factory_id = "fact_01"

    access_token = create_access_token({"sub": req.email, "role": role, "factory_id": factory_id})
    refresh_token = create_refresh_token({"sub": req.email, "role": role, "factory_id": factory_id})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token_endpoint(req: TokenRefreshRequest):
    try:
        payload = jwt.decode(req.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role", "Plant Manager")
        factory_id: str = payload.get("factory_id", "fact_01")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        new_access_token = create_access_token({"sub": email, "role": role, "factory_id": factory_id})
        new_refresh_token = create_refresh_token({"sub": email, "role": role, "factory_id": factory_id})
        return TokenResponse(access_token=new_access_token, refresh_token=new_refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.get("/me", response_model=UserProfileOut)
async def get_my_profile(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    user = (await db.execute(select(User).where(User.email == current_user.email))).scalars().first()
    return UserProfileOut(
        email=current_user.email,
        role=current_user.role,
        factory_id=current_user.factory_id or "fact_01",
        full_name=user.full_name if user else "",
    )
