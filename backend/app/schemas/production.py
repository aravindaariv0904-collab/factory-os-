from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class ProductionOrderBase(BaseModel):
    order_number: str
    product_name: str
    sku: str
    target_quantity: int
    produced_quantity: int = 0
    defective_quantity: int = 0
    line: str
    status: str = "In Progress"
    oee: float = 0.0

class ProductionOrderCreate(ProductionOrderBase):
    factory_id: UUID

class ProductionOrderOut(ProductionOrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    factory_id: UUID
    created_at: datetime
    updated_at: datetime

class DowntimeEventBase(BaseModel):
    machine_name: str
    reason: str
    category: str
    duration_minutes: int
    impact_cost: float
    status: str = "Investigating"

class DowntimeEventCreate(DowntimeEventBase):
    machine_id: UUID

class DowntimeEventOut(DowntimeEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    machine_id: UUID
    created_at: datetime
