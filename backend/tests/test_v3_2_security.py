from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.tenant import tenant_manager
from backend.app.core.rbac import CurrentUser
import pytest

client = TestClient(app)

def test_refresh_token_rotation():
    login_resp = client.post("/api/v1/auth/login", json={"email": "operator@factoryos.ai", "password": "password123"})
    assert login_resp.status_code == 200
    rf_token = login_resp.json()["refresh_token"]

    refresh_resp = client.post("/api/v1/auth/refresh", json={"refresh_token": rf_token})
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()

def test_tenant_isolation_filtering():
    user = CurrentUser(email="mgr@factoryos.ai", role="Plant Manager", factory_id="fact_01")
    records = [
        {"id": 1, "factory_id": "fact_01"},
        {"id": 2, "factory_id": "fact_02"},
    ]
    filtered = tenant_manager.filter_records_by_tenant(user, records)
    assert len(filtered) == 1
    assert filtered[0]["factory_id"] == "fact_01"
