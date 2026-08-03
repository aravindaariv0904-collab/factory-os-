from fastapi import APIRouter
from typing import List
from uuid import uuid4
from datetime import datetime
from backend.app.schemas.quality import QualityReportOut

router = APIRouter()

MOCK_QUALITY = [
    {
        "id": uuid4(),
        "machine_id": uuid4(),
        "batch_id": "PO-2026-8801-B1",
        "defect_type": "Weld Fault",
        "severity": "Major",
        "inspection_type": "AI Vision",
        "status": "Quarantined",
        "created_at": datetime.now(),
    }
]

@router.get("/reports", response_model=List[QualityReportOut])
async def list_quality_reports():
    return MOCK_QUALITY
