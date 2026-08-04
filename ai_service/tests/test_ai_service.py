from fastapi.testclient import TestClient
from ai_service.app.main import app

client = TestClient(app)


def test_health_check():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert data["models_ready"] is True
    assert data["models_loaded"] == 3


def test_list_models():
    r = client.get("/models")
    assert r.status_code == 200
    data = r.json()
    assert data["ready"] is True
    names = {m["name"] for m in data["models"]}
    assert {"failure_classifier", "rul_regressor", "anomaly_detector"} <= names


def test_predict_machine():
    r = client.post(
        "/predict/machine",
        json={
            "machine_id": "mch-101",
            "temperature_deg_c": 84.1,
            "vibration_mm_s": 8.9,
            "hydraulic_pressure_bar": 200.0,
            "thermal_gradient": 1.5,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["machine_id"] == "mch-101"
    preds = data["predictions"]
    assert "failure_probability" in preds
    assert "predicted_rul_hours" in preds
    assert "failure_risk_level" in preds
    assert 0.0 <= preds["failure_probability"] <= 1.0


def test_predict_machine_defaults():
    r = client.post("/predict/machine", json={"machine_id": "mch-102"})
    assert r.status_code == 200
    assert "predictions" in r.json()


def test_reload_models():
    r = client.post("/models/reload")
    assert r.status_code == 200
    assert r.json()["models_loaded"] == 3
