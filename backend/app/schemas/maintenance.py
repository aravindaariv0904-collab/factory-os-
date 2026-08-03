from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class MaintenanceLogBase(BaseModel):
    type: str  # Planned / Unplanned
    description: str
    cost: float
    duration_minutes: int

class MaintenanceLogCreate(MaintenanceLogBase):
    machine_id: UUID

class MaintenanceLogOut(MaintenanceLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    machine_id: UUID
    created_at: datetime

class WorkOrderCreate(BaseModel):
    machine_id: UUID
    priority: str
    description: str
    assigned_crew: Optional[str] = "Crew Alpha"
