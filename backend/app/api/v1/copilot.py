from fastapi import APIRouter
from backend.app.schemas.ai import CopilotQueryRequest, CopilotQueryResponse, EvidenceData, EvidenceMetrics
from backend.app.ai.agents.supervisor import SupervisorAgent
from datetime import datetime

router = APIRouter()

@router.post("/query", response_model=CopilotQueryResponse)
async def query_copilot(req: CopilotQueryRequest):
    orchestration = SupervisorAgent.orchestrate(req.prompt)

    metrics = [
        EvidenceMetrics(label=m["label"], value=m["value"], trend=m.get("trend"))
        for m in orchestration["metrics"]
    ]

    return CopilotQueryResponse(
        id=f"msg_{int(datetime.now().timestamp())}",
        sender="assistant",
        content=orchestration["content"],
        timestamp=datetime.now().strftime("%H:%M"),
        evidence=EvidenceData(
            confidence=orchestration["confidence"],
            sources=orchestration["sources"],
            metrics=metrics,
            recommendations=orchestration["recommendations"],
        ),
    )
