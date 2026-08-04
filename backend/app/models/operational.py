from sqlalchemy import Column, String, DateTime, Integer, Float, JSON, Text, ForeignKey, Boolean
from datetime import datetime
from backend.app.db.session import Base
from backend.app.models.base import TimestampMixin, RLSMixin, GUIDType, generate_uuid


class ProductionOrder(Base, TimestampMixin, RLSMixin):
    __tablename__ = "production_orders"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    factory_id = Column(GUIDType(), ForeignKey("factories.id"), index=True, nullable=False)
    order_number = Column(String, unique=True, index=True, nullable=False)
    product_name = Column(String, nullable=False)
    sku = Column(String, nullable=False)
    target_quantity = Column(Integer, default=0)
    produced_quantity = Column(Integer, default=0)
    defective_quantity = Column(Integer, default=0)
    line = Column(String, nullable=False)
    status = Column(String, default="In Progress")
    oee = Column(Float, default=0.0)


class DowntimeEvent(Base, TimestampMixin, RLSMixin):
    __tablename__ = "downtime_events"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    machine_id = Column(GUIDType(), ForeignKey("machines.id"), index=True, nullable=False)
    machine_name = Column(String, nullable=True)
    reason = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    duration_minutes = Column(Integer, default=0)
    impact_cost = Column(Float, default=0.0)
    status = Column(String, default="Investigating")


class MaintenanceLog(Base, TimestampMixin, RLSMixin):
    __tablename__ = "maintenance_logs"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    machine_id = Column(GUIDType(), ForeignKey("machines.id"), index=True, nullable=False)
    type = Column(String, nullable=False)  # planned, unplanned
    description = Column(Text, nullable=True)
    cost = Column(Float, nullable=True)
    duration_minutes = Column(Integer, default=0)
    performed_by = Column(String, nullable=True)
    work_order_id = Column(String, nullable=True)


class InventoryItem(Base, TimestampMixin, RLSMixin):
    __tablename__ = "inventory"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    factory_id = Column(GUIDType(), ForeignKey("factories.id"), index=True, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=False)
    item_name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    quantity = Column(Integer, default=0)
    min_threshold = Column(Integer, default=10)
    max_capacity = Column(Integer, default=1000)
    unit_cost = Column(Float, nullable=True)
    location = Column(String, nullable=True)
    supplier = Column(String, nullable=True)
    status = Column(String, default="Optimal")
    lead_time_days = Column(Integer, default=5)


class QualityReport(Base, TimestampMixin, RLSMixin):
    __tablename__ = "quality_reports"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    machine_id = Column(GUIDType(), ForeignKey("machines.id"), index=True, nullable=False)
    batch_id = Column(String, index=True, nullable=True)
    defect_type = Column(String, nullable=True)
    severity = Column(String, nullable=False)
    inspection_type = Column(String, nullable=True)
    status = Column(String, nullable=False)  # pass, fail, rework, quarantined
