from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    organization_id: UUID
    factory_id: Optional[UUID] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None

class UserInDB(UserBase):
    id: UUID
    is_active: bool

    class Config:
        from_attributes = True

class UserOut(UserInDB):
    pass
