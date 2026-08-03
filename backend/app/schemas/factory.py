from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class FactoryBase(BaseModel):
    name: str
    location: str
    type: str
    metadata_json: Optional[dict] = None

class FactoryCreate(FactoryBase):
    organization_id: UUID

class FactoryUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    metadata_json: Optional[dict] = None

class FactoryOut(FactoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime
