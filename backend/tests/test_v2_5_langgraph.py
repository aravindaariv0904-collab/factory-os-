from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.ai.agents.supervisor import SupervisorAgent

client = TestClient(app)

def test_supervisor_agent_orchestration():
    res = SupervisorAgent.orchestrate("Why did Line 4 OEE drop?")
    assert "Consensus Analysis" in res["content"]
    assert res["confidence"] >= 0.9
    assert len(res["recommendations"]) > 0

def test_copilot_langgraph_endpoint():
    resp = client.post(
        "/api/v1/copilot/query",
        json={"prompt": "Diagnose Laser Cell 03 thermal anomaly"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "LangGraph Multi-Agent" in data["content"]
    assert data["evidence"]["confidence"] >= 0.90
    assert len(data["evidence"]["sources"]) > 0
