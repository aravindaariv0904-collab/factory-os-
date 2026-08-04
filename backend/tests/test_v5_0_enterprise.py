from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.analytics.oee import oee_engine
from backend.app.analytics.optimizer import optimizer_engine

client = TestClient(app)

def test_oee_analytics_calculation():
    oee_res = oee_engine.calculate_machine_oee(480.0, 24.0, 12.0, 2200, 35)
    assert "oee_percent" in oee_res
    assert oee_res["oee_percent"] > 50.0
    assert oee_res["good_parts"] == 2165

def test_production_optimizer():
    wo_list = [{"id": "WO-101", "target_machine": "mch_102", "estimated_hours": 5.0}]
    opt_res = optimizer_engine.optimize_production_schedule(wo_list)
    assert opt_res["total_work_orders"] == 1
    assert opt_res["carbon_footprint_reduction_kg_co2"] > 0.0

def test_v5_0_production_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["version"] == "6.0.0"
    assert data["status"] == "healthy"
