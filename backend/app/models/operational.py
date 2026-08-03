from sqlalchemy import Column, String, DateTime, Integer, Float, JSON, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, RLSMixin
import uuid

class ProductionLog(Base, TimestampMixin, RLSMixin):
    __tablename__ = "production_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    operator_id = Column(UUID(as_uuid=True), index=True, nullable=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    units_produced = Column(Integer, default=0)
    units_defective = Column(Integer, default=0)
    downtime_minutes = Column(Integer, default=0)
    downtime_reason = Column(Text, nullable=True)
    cycle_time_seconds = Column(Float, nullable=True)

class MaintenanceLog(Base, TimestampMixin, RLSMixin):
    __tablename__ = "maintenance_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    type = Column(String, nullable=False) # planned, unplanned
    description = Column(Text, nullable=True)
    cost = Column(Numeric(12, 2), nullable=True)
    duration_hours = Column(Float, nullable=True)
    performed_by = Column(String, nullable=True)

class Inventory(Base, TimestampMixin, RLSMixin):
    __tablename__ = "inventory"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    quantity = Column(Integer, default=0)
    threshold = Column(Integer, default=10)
    unit_cost = Column(Numeric(12, 2), nullable=True)
    last_restocked = Column(DateTime, nullable=True)

class QualityReport(Base, TimestampMixin, RLSMixin):
    __tablename__ = "quality_reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    batch_id = Column(String, index=True, nullable=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    parameters = Column(JSON, nullable=True)
    status = Column(String, nullable=False) # pass, fail, rework
    defect_type = Column(String, nullable=True)
