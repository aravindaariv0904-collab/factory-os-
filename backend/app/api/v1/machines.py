from fastapi import APIRouter, Query, HTTPException
from typing import List
from uuid import uuid4
from datetime import datetime
from backend.app.schemas.machine import MachineOut, MachineUpdate

router = APIRouter()

MOCK_MACHINES_RESP = [
    {
        "id": uuid4(),
        "plant_id": uuid4(),
        "name": "KUKA Titan Robot Arm Alpha",
        "code": "ROB-4011",
        "type": "6-Axis Heavy Payload Manipulator",
        "manufacturer": "KUKA",
        "line": "Line 1 - Body Stamping",
        "status": "Running",
        "oee": 89.2,
        "availability": 94.5,
        "performance": 96.1,
        "quality": 98.0,
        "temperature": 64.2,
        "vibration": 2.1,
        "rul_hours": 420.0,
        "health_score": 92.0,
        "last_maintenance": datetime.now(),
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    },
    {
        "id": uuid4(),
        "plant_id": uuid4(),
        "name": "DMG MORI 5-Axis CNC Mill X5",
        "code": "CNC-5012",
        "type": "High-Precision CNC Workcenter",
        "manufacturer": "DMG MORI",
        "line": "Line 4 - Gearbox Machining",
        "status": "Down",
        "oee": 45.0,
        "availability": 50.0,
        "performance": 92.0,
        "quality": 97.8,
        "temperature": 84.1,
        "vibration": 8.9,
        "rul_hours": 0.0,
        "health_score": 32.0,
        "last_maintenance": datetime.now(),
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    },
]

@router.get("/", response_model=List[MachineOut])
async def list_machines(skip: int = 0, limit: int = Query(10, le=100)):
    return MOCK_MACHINES_RESP[skip : skip + limit]

@router.get("/{machine_id}", response_model=MachineOut)
async def get_machine(machine_id: str):
    return MOCK_MACHINES_RESP[0]
