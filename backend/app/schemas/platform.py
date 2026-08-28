"""Pydantic schemas for platform workflow APIs."""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class DatasetCreateResponse(BaseModel):
    id: str
    name: str
    status: str
    version_id: str
    version_number: int
    job_id: Optional[str] = None


class DatasetSummary(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    source_type: str
    status: str
    created_at: datetime
    latest_version: Optional[int] = None


class DatasetDetail(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    source_type: str
    status: str
    created_at: datetime
    updated_at: datetime
    versions: list[dict[str, Any]] = Field(default_factory=list)


class DatasetProfileOut(BaseModel):
    dataset_id: str
    version_id: str
    version_number: int
    record_count: int
    columns: list[str]
    profile: dict[str, Any]
    status: str


class DatasetMappingOut(BaseModel):
    dataset_id: str
    version_id: str
    mappings: list[dict[str, Any]]
    mapping_approved: str
    target_column: Optional[str] = None


class MappingApproveRequest(BaseModel):
    approved: bool = True
    target_column: Optional[str] = None
    mapping_overrides: Optional[dict[str, str]] = None


class DatasetQualityOut(BaseModel):
    dataset_id: str
    version_id: str
    quality_status: str
    issues: list[dict[str, str]] = Field(default_factory=list)
    warnings: list[dict[str, str]] = Field(default_factory=list)


class JobCreateRequest(BaseModel):
    job_type: str = Field(..., description="ingest|profile|process|train|report")
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None


class JobOut(BaseModel):
    id: str
    job_type: str
    status: str
    progress: float
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    celery_task_id: Optional[str] = None
    error_message: Optional[str] = None
    result: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class ModelSummary(BaseModel):
    id: str
    name: str
    task_type: str
    status: str
    latest_version: Optional[str] = None


class ModelDetail(BaseModel):
    id: str
    name: str
    task_type: str
    description: Optional[str] = None
    status: str
    versions: list[dict[str, Any]] = Field(default_factory=list)


class PredictionCreateRequest(BaseModel):
    model_version_id: str
    input_data: dict[str, Any]


class PredictionOut(BaseModel):
    id: str
    model_version_id: str
    status: str
    output_data: Optional[dict[str, Any]] = None
    confidence: Optional[float] = None
    created_at: datetime


class PredictionExplanationOut(BaseModel):
    prediction_id: str
    explanation: dict[str, Any]
    model_version_id: str


class RecommendationActionRequest(BaseModel):
    reason: Optional[str] = None


class RecommendationCreateRequest(BaseModel):
    prediction_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None


class PlatformReportCreateRequest(BaseModel):
    title: str
    report_type: str
    format: str = "PDF"
    resource_id: Optional[str] = None
    model_version_id: Optional[str] = None
    prediction_id: Optional[str] = None
    recommendation_id: Optional[str] = None


class PlatformReportOut(BaseModel):
    id: str
    title: str
    report_type: str
    format: str
    status: str
    job_id: Optional[str] = None
    download_available: bool = False
    created_at: datetime


class HealthComponent(BaseModel):
    name: str
    status: str
    details: Optional[dict[str, Any]] = None


class DetailedHealthOut(BaseModel):
    status: str
    service: str
    version: str
    components: list[HealthComponent]
