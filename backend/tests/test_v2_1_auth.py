from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_login_and_get_me():
    # Login to receive JWT access token
    login_resp = client.post("/api/v1/auth/login", json={"email": "alexander.vance@factoryos.ai", "password": "password123"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # Request /auth/me with Bearer token
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "alexander.vance@factoryos.ai"
    assert me_data["role"] == "Plant Manager"

def test_unauthorized_access():
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 403 or resp.status_code == 401

def test_security_headers():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
