from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class QualityReportBase(BaseModel):
    batch_id: str
    defect_type: str
    severity: str
    inspection_type: str
    status: str = "Quarantined"

class QualityReportCreate(QualityReportBase):
    machine_id: UUID

class QualityReportOut(QualityReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    machine_id: UUID
    created_at: datetime
