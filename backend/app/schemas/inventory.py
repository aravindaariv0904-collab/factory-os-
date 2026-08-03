from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class InventoryItemBase(BaseModel):
    sku: str
    item_name: str
    category: str
    quantity: int
    min_threshold: int
    max_capacity: int
    unit_cost: float
    location: str
    supplier: str
    status: str = "Optimal"
    lead_time_days: int = 5

class InventoryItemCreate(InventoryItemBase):
    factory_id: UUID

class InventoryItemUpdate(BaseModel):
    quantity: Optional[int] = None
    min_threshold: Optional[int] = None
    status: Optional[str] = None

class InventoryItemOut(InventoryItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    factory_id: UUID
    updated_at: datetime
