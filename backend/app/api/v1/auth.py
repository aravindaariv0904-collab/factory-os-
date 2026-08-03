from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from backend.app.core.security import create_access_token, create_refresh_token

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    # Mock user verification
    if req.email and req.password:
        access_token = create_access_token({"sub": req.email, "role": "Plant Manager"})
        refresh_token = create_refresh_token({"sub": req.email})
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token: str):
    new_access = create_access_token({"sub": "alexander.vance@factoryos.ai", "role": "Plant Manager"})
    new_refresh = create_refresh_token({"sub": "alexander.vance@factoryos.ai"})
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)
