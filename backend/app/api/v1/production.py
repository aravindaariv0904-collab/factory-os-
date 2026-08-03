from fastapi import APIRouter, Query
from typing import List
from uuid import uuid4
from datetime import datetime
from backend.app.schemas.production import ProductionOrderOut, DowntimeEventOut

router = APIRouter()

MOCK_ORDERS = [
    {
        "id": uuid4(),
        "factory_id": uuid4(),
        "order_number": "PO-2026-8801",
        "product_name": "Model-S EV Battery Housing Enclosure",
        "sku": "SKU-EV-BAT-9002",
        "target_quantity": 1200,
        "produced_quantity": 980,
        "defective_quantity": 14,
        "line": "Line 2 - Battery Enclosure",
        "status": "In Progress",
        "oee": 92.4,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
]

MOCK_DOWNTIME = [
    {
        "id": uuid4(),
        "machine_id": uuid4(),
        "machine_name": "DMG MORI 5-Axis CNC Mill X5",
        "reason": "Spindle Bearing Thermal Overheating & Excessive Vibration",
        "category": "Unplanned Mechanical",
        "duration_minutes": 145,
        "impact_cost": 18500.0,
        "status": "Investigating",
        "created_at": datetime.now(),
    }
]

@router.get("/orders", response_model=List[ProductionOrderOut])
async def list_orders(skip: int = 0, limit: int = Query(10, le=100)):
    return MOCK_ORDERS[skip : skip + limit]

@router.get("/downtime", response_model=List[DowntimeEventOut])
async def list_downtime(skip: int = 0, limit: int = Query(10, le=100)):
    return MOCK_DOWNTIME[skip : skip + limit]
