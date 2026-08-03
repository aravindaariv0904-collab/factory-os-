from fastapi import APIRouter
from typing import List
from uuid import uuid4
from datetime import datetime
from backend.app.schemas.ai import CriticalAlertOut

router = APIRouter()

MOCK_ALERTS = [
    {
        "id": uuid4(),
        "title": "CNC Mill X5 Vibration Spike (8.9 mm/s)",
        "message": "Telemetry exceeded ISO 10816 class III threshold.",
        "severity": "Critical",
        "machine_id": uuid4(),
        "is_read": False,
        "is_resolved": False,
        "created_at": datetime.now(),
    }
]

@router.get("/", response_model=List[CriticalAlertOut])
async def list_alerts():
    return MOCK_ALERTS
