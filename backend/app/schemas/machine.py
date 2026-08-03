from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class MachineBase(BaseModel):
    name: str
    code: str
    type: str
    manufacturer: Optional[str] = None
    line: Optional[str] = None
    status: str = "Running"
    oee: float = 85.0
    availability: float = 90.0
    performance: float = 95.0
    quality: float = 99.0
    temperature: float = 45.0
    vibration: float = 1.2
    rul_hours: float = 500.0
    health_score: float = 90.0

class MachineCreate(MachineBase):
    plant_id: UUID

class MachineUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    oee: Optional[float] = None
    availability: Optional[float] = None
    performance: Optional[float] = None
    quality: Optional[float] = None
    temperature: Optional[float] = None
    vibration: Optional[float] = None
    rul_hours: Optional[float] = None
    health_score: Optional[float] = None

class MachineOut(MachineBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plant_id: UUID
    last_maintenance: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
