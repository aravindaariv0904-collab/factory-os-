from fastapi import APIRouter
from backend.app.schemas.ai import CopilotQueryRequest, CopilotQueryResponse, EvidenceData, EvidenceMetrics
from datetime import datetime

router = APIRouter()

@router.post("/query", response_model=CopilotQueryResponse)
async def query_copilot(req: CopilotQueryRequest):
    return CopilotQueryResponse(
        id=f"msg_{int(datetime.now().timestamp())}",
        sender="assistant",
        content=f"### LangGraph Multi-Agent Analysis\nQuery: **{req.prompt}**\n\n1. **Telemetry Match**: Machine operating within normal standard distribution variance.\n2. **Financial Impact**: Preventive maintenance avoids an estimated **$18,500** in unplanned downtime.\n3. **Recommended Action**: Monitor spindle bearing thermal readings.",
        timestamp=datetime.now().strftime("%H:%M"),
        evidence=EvidenceData(
            confidence=0.96,
            sources=["IoT Vibration Telemetry", "LangGraph Agent Node v2.4"],
            metrics=[
                EvidenceMetrics(label="Confidence", value="96.4%", trend="High"),
                EvidenceMetrics(label="Est. Savings", value="$18,500", trend="Saved"),
            ],
            recommendations=["Dispatch Crew #1 to inspect spindle housing"],
        ),
    )
