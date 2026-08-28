from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from backend.app.ml.predictor import MLPredictor
from backend.app.core.rbac import get_current_user, CurrentUser

router = APIRouter()

class MachinePredictRequest(BaseModel):
    machine_id: str
    temperature_deg_c: Optional[float] = 64.2
    vibration_mm_s: Optional[float] = 2.1
    hydraulic_pressure_bar: Optional[float] = 195.0
    thermal_gradient: Optional[float] = 1.2

@router.post("/machine")
async def predict_machine_health(
    req: MachinePredictRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    telemetry = req.model_dump()
    predictions = MLPredictor.predict_machine_telemetry(telemetry)
    return {
        "machine_id": req.machine_id,
        "input_telemetry": telemetry,
        "predictions": predictions,
    }
