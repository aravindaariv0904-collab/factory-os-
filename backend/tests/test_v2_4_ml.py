from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.ml.predictor import MLPredictor

client = TestClient(app)

def test_ml_predictor_inference():
    telemetry = {
        "temperature_deg_c": 82.5,
        "vibration_mm_s": 7.8,
        "hydraulic_pressure_bar": 190.0,
        "thermal_gradient": 3.4,
    }
    preds = MLPredictor.predict_machine_telemetry(telemetry)
    assert "failure_probability" in preds
    assert "predicted_rul_hours" in preds
    assert "failure_risk_level" in preds
    assert preds["failure_probability"] > 0.0

def test_predict_api_endpoint():
    resp = client.post(
        "/api/v1/predict/machine",
        json={
            "machine_id": "mch_104",
            "temperature_deg_c": 84.1,
            "vibration_mm_s": 8.9,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["machine_id"] == "mch_104"
    assert "predictions" in data
