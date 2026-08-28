"""Platform entities for the adaptive data-to-ML workflow."""
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Text,
    JSON,
    ForeignKey,
    UniqueConstraint,
)
from backend.app.db.session import Base
from backend.app.models.base import TimestampMixin, RLSMixin, GUIDType, generate_uuid


class Line(Base, TimestampMixin, RLSMixin):
    """Production line within a plant (factory)."""

    __tablename__ = "lines"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    plant_id = Column(GUIDType(), ForeignKey("factories.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    status = Column(String, default="active")


class Dataset(Base, TimestampMixin, RLSMixin):
    __tablename__ = "datasets"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    source_type = Column(String, default="upload")  # upload, mqtt, opcua, mes
    status = Column(String, default="draft")  # draft, profiling, mapped, ready, archived
    created_by = Column(String, nullable=True)


class DatasetVersion(Base, TimestampMixin, RLSMixin):
    __tablename__ = "dataset_versions"
    __table_args__ = (UniqueConstraint("dataset_id", "version_number", name="uq_dataset_version"),)

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    dataset_id = Column(GUIDType(), ForeignKey("datasets.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False, default=1)
    storage_path = Column(String, nullable=True)
    original_filename = Column(String, nullable=True)
    record_count = Column(Integer, default=0)
    columns = Column(JSON, nullable=True)
    profile = Column(JSON, nullable=True)
    mapping = Column(JSON, nullable=True)
    mapping_approved = Column(String, default="pending")  # pending, approved, rejected
    quality = Column(JSON, nullable=True)
    status = Column(String, default="uploaded")  # uploaded, profiling, validated, processed, failed


class ProcessingJob(Base, TimestampMixin, RLSMixin):
    __tablename__ = "processing_jobs"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    job_type = Column(String, nullable=False)  # ingest, profile, process, train, report
    status = Column(String, default="QUEUED")  # QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED
    progress = Column(Float, default=0.0)
    resource_type = Column(String, nullable=True)  # dataset, model, report
    resource_id = Column(GUIDType(), nullable=True, index=True)
    celery_task_id = Column(String, nullable=True, index=True)
    error_message = Column(Text, nullable=True)
    result = Column(JSON, nullable=True)
    created_by = Column(String, nullable=True)


class Feature(Base, TimestampMixin, RLSMixin):
    __tablename__ = "features"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    dataset_version_id = Column(GUIDType(), ForeignKey("dataset_versions.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    feature_type = Column(String, nullable=False)
    metadata_json = Column(JSON, nullable=True)


class Experiment(Base, TimestampMixin, RLSMixin):
    __tablename__ = "experiments"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    dataset_version_id = Column(GUIDType(), ForeignKey("dataset_versions.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    status = Column(String, default="pending")
    hyperparameters = Column(JSON, nullable=True)
    metrics = Column(JSON, nullable=True)


class MLModelRecord(Base, TimestampMixin, RLSMixin):
    __tablename__ = "ml_models"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    task_type = Column(String, nullable=False)  # classification, regression, anomaly
    description = Column(Text, nullable=True)
    status = Column(String, default="draft")  # draft, training, deployed, archived


class ModelVersion(Base, TimestampMixin, RLSMixin):
    __tablename__ = "model_versions"
    __table_args__ = (UniqueConstraint("model_id", "version_tag", name="uq_model_version"),)

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    model_id = Column(GUIDType(), ForeignKey("ml_models.id"), nullable=False, index=True)
    version_tag = Column(String, nullable=False)
    artifact_path = Column(String, nullable=True)
    preprocessing_hash = Column(String, nullable=True)
    metrics = Column(JSON, nullable=True)
    status = Column(String, default="created")  # created, validated, deployed, retired
    experiment_id = Column(GUIDType(), ForeignKey("experiments.id"), nullable=True)


class PlatformPrediction(Base, TimestampMixin, RLSMixin):
    __tablename__ = "platform_predictions"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    model_version_id = Column(GUIDType(), ForeignKey("model_versions.id"), nullable=False, index=True)
    input_data = Column(JSON, nullable=False)
    output_data = Column(JSON, nullable=True)
    explanation = Column(JSON, nullable=True)
    confidence = Column(Float, nullable=True)
    status = Column(String, default="pending")  # pending, completed, failed


class PlatformRecommendation(Base, TimestampMixin, RLSMixin):
    __tablename__ = "platform_recommendations"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    prediction_id = Column(GUIDType(), ForeignKey("platform_predictions.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)
    estimated_savings = Column(Float, nullable=True)
    status = Column(String, default="pending")  # pending, approved, rejected, verified
    approved_by = Column(String, nullable=True)
    verified_by = Column(String, nullable=True)
    rejection_reason = Column(Text, nullable=True)


class PlatformReport(Base, TimestampMixin, RLSMixin):
    __tablename__ = "platform_reports"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    report_type = Column(String, nullable=False)
    format = Column(String, default="PDF")  # PDF, XLSX, JSON
    status = Column(String, default="QUEUED")
    storage_path = Column(String, nullable=True)
    job_id = Column(GUIDType(), ForeignKey("processing_jobs.id"), nullable=True)
    created_by = Column(String, nullable=True)


class AuditEvent(Base, TimestampMixin):
    __tablename__ = "audit_events"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    organization_id = Column(GUIDType(), index=True, nullable=False)
    factory_id = Column(GUIDType(), index=True, nullable=True)
    user_id = Column(GUIDType(), nullable=True)
    user_email = Column(String, nullable=False)
    action = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    resource_id = Column(String, nullable=True)
    resource_version = Column(String, nullable=True)
    result = Column(String, default="success")
    metadata_json = Column(JSON, nullable=True)
    request_id = Column(String, nullable=True)


class SystemHealthSnapshot(Base, TimestampMixin):
    __tablename__ = "system_health_snapshots"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    component = Column(String, nullable=False)
    status = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
