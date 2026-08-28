from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.ai.shap_explainer import shap_engine
from backend.app.digital_twin.graph import digital_twin_engine

client = TestClient(app)

def _auth_headers():
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "operator@factoryos.ai", "password": "password123"},
    )
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}

def test_shap_explanation_and_roi():
    res = shap_engine.explain_failure_prediction({"vibration_mm_s": 8.9, "temperature_deg_c": 84.1})
    assert res["predicted_failure_probability"] > 0.5
    assert "vibration_mm_s" in res["shap_values"]
    assert len(res["primary_reason_codes"]) > 0

    roi = shap_engine.calculate_downtime_roi(res["predicted_failure_probability"], 8500.0)
    assert roi["estimated_net_savings"] > 0

def test_digital_twin_topology_and_simulation_api():
    headers = _auth_headers()
    top_resp = client.get("/api/v1/digital-twin/topology", headers=headers)
    assert top_resp.status_code == 200
    assert "fact_01" in top_resp.json()

    sim_resp = client.get("/api/v1/digital-twin/simulate-failure/mch_101", headers=headers)
    assert sim_resp.status_code == 200
    data = sim_resp.json()
    assert "downstream_impacted_machines" in data["propagation"]
    assert "shap_explanation" in data

def test_digital_twin_requires_auth():
    top_resp = client.get("/api/v1/digital-twin/topology")
    assert top_resp.status_code == 401
