from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class CopilotQueryRequest(BaseModel):
    prompt: str
    factory_id: Optional[str] = None
    session_id: Optional[str] = None

class EvidenceMetrics(BaseModel):
    label: str
    value: str
    trend: Optional[str] = None

class EvidenceData(BaseModel):
    confidence: float
    sources: List[str]
    metrics: Optional[List[EvidenceMetrics]] = None
    recommendations: Optional[List[str]] = None

class CopilotQueryResponse(BaseModel):
    id: str
    sender: str = "assistant"
    content: str
    timestamp: str
    evidence: Optional[EvidenceData] = None

class AIRecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    target_entity: str
    category: str
    impact_score: str
    estimated_savings: float
    confidence_score: float
    status: str
    actions: List[str]
    created_at: datetime

class CriticalAlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    message: str
    severity: str
    machine_id: Optional[UUID] = None
    is_read: bool
    is_resolved: bool
    created_at: datetime
