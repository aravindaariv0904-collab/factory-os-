from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_sse_alerts_stream():
    response = client.get("/api/v1/stream/alerts")
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    content = response.text
    assert "Critical" in content or "Warning" in content

def test_websocket_telemetry_stream():
    with client.websocket_connect("/api/v1/stream/telemetry/mch_101") as websocket:
        data = websocket.receive_json()
        assert data["machine_id"] == "mch_101"
        assert "vibration_mm_s" in data
        assert "temperature_deg_c" in data
