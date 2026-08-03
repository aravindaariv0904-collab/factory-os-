from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.ai.rag.vector_store import rag_store

client = TestClient(app)

def test_vector_store_search():
    res = rag_store.search("spindle vibration failure", top_k=2)
    assert len(res) > 0
    assert "SOP-MECH-409" in res[0]["title"]
    assert res[0]["similarity_score"] > 0.5

def test_rag_knowledge_api_endpoint():
    resp = client.post(
        "/api/v1/knowledge/search",
        json={"query": "laser weld seam defect", "top_k": 2},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["results_count"] > 0
    assert "documents" in data
