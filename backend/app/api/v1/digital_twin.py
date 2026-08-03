from fastapi import APIRouter
from backend.app.digital_twin.graph import digital_twin_engine
from backend.app.ai.shap_explainer import shap_engine

router = APIRouter()

@router.get("/topology")
async def get_digital_twin_topology():
    return digital_twin_engine.topology

@router.get("/simulate-failure/{machine_id}")
async def simulate_machine_failure(machine_id: str):
    propagation = digital_twin_engine.simulate_failure_propagation(machine_id)
    explanation = shap_engine.explain_failure_prediction({"vibration_mm_s": 8.9, "temperature_deg_c": 84.1})
    roi = shap_engine.calculate_downtime_roi(explanation["predicted_failure_probability"])
    
    return {
        "propagation": propagation,
        "shap_explanation": explanation,
        "financial_roi": roi,
    }
