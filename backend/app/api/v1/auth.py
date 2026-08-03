from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from backend.app.core.security import create_access_token, create_refresh_token
from backend.app.core.rbac import get_current_user, CurrentUser

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

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
        refresh_token = create_refresh_token({"sub": req.email})
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/me", response_model=UserProfileOut)
async def get_my_profile(current_user: CurrentUser = Depends(get_current_user)):
    return UserProfileOut(
        email=current_user.email,
        role=current_user.role,
        factory_id=current_user.factory_id or "fact_01",
    )
