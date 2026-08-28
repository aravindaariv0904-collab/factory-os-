from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_auth_login():
    response = client.post("/api/v1/auth/login", json={"email": "alexander.vance@factoryos.ai", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

def test_factories_list():
    login_resp = client.post("/api/v1/auth/login", json={"email": "alexander.vance@factoryos.ai", "password": "password123"})
    token = login_resp.json()["access_token"]
    response = client.get("/api/v1/factories/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0

def test_machines_list():
    login_resp = client.post("/api/v1/auth/login", json={"email": "alexander.vance@factoryos.ai", "password": "password123"})
    token = login_resp.json()["access_token"]
    response = client.get("/api/v1/machines/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
