from fastapi import APIRouter
from typing import List
from uuid import uuid4
from datetime import datetime
from backend.app.schemas.inventory import InventoryItemOut

router = APIRouter()

MOCK_INVENTORY = [
    {
        "id": uuid4(),
        "factory_id": uuid4(),
        "sku": "RAW-ALU-6061-T6",
        "item_name": "Structural Aluminum Sheets 6061-T6 (2mm)",
        "category": "Raw Material",
        "quantity": 4200,
        "min_threshold": 1500,
        "max_capacity": 10000,
        "unit_cost": 145.0,
        "location": "Bay A-14, Rack 02",
        "supplier": "Alcoa Global Metals Inc.",
        "status": "Optimal",
        "lead_time_days": 4,
        "updated_at": datetime.now(),
    }
]

@router.get("/", response_model=List[InventoryItemOut])
async def list_inventory():
    return MOCK_INVENTORY
