from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.ai.agents.supervisor import SupervisorAgent

client = TestClient(app)

def test_supervisor_agent_orchestration():
    res = SupervisorAgent.orchestrate("Why did Line 4 OEE drop?")
    assert "Consensus Analysis" in res["content"] or "Failure Risk" in res["content"] or len(res["content"]) > 10
    assert res["confidence"] >= 0.8
    assert len(res["recommendations"]) > 0

def test_copilot_langgraph_endpoint():
    resp = client.post(
        "/api/v1/copilot/query",
        json={"prompt": "Diagnose Laser Cell 03 thermal anomaly"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "Consensus Analysis" in data["content"] or "Decision Intelligence" in data["content"] or "Laser" in data["content"] or len(data["content"]) > 10
    assert data["evidence"]["confidence"] >= 0.80
    assert len(data["evidence"]["sources"]) > 0
