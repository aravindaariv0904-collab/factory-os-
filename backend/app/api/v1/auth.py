from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from backend.app.core.security import create_access_token, create_refresh_token, SECRET_KEY, ALGORITHM
from backend.app.core.rbac import get_current_user, CurrentUser
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

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    if req.email and req.password:
        access_token = create_access_token({"sub": req.email, "role": "Plant Manager", "factory_id": "fact_01"})
        refresh_token = create_refresh_token({"sub": req.email, "role": "Plant Manager", "factory_id": "fact_01"})
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    raise HTTPException(status_code=401, detail="Invalid credentials")

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
async def get_my_profile(current_user: CurrentUser = Depends(get_current_user)):
    return UserProfileOut(
        email=current_user.email,
        role=current_user.role,
        factory_id=current_user.factory_id or "fact_01",
    )
