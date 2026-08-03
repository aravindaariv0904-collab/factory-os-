from fastapi import APIRouter
from typing import List
from uuid import uuid4
from datetime import datetime
from backend.app.schemas.ai import AIRecommendationOut

router = APIRouter()

MOCK_RECS = [
    {
        "id": uuid4(),
        "title": "Schedule Preventive Spindle Bearing Replacement on CNC Mill X5",
        "description": "Vibration telemetry detected 3.8x baseline harmonic anomaly.",
        "target_entity": "DMG MORI 5-Axis CNC Mill X5",
        "category": "Predictive Maintenance",
        "impact_score": "High",
        "estimated_savings": 42000.0,
        "confidence_score": 0.96,
        "status": "New",
        "actions": ["Issue Work Order #WO-8910"],
        "created_at": datetime.now(),
    }
]

@router.get("/", response_model=List[AIRecommendationOut])
async def list_recommendations():
    return MOCK_RECS
