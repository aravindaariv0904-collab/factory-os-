from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from datetime import datetime
from backend.app.db.session import Base
from backend.app.models.base import GUIDType, generate_uuid


class Machine(Base):
    __tablename__ = "machines"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    plant_id = Column(GUIDType(), ForeignKey("factories.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    type = Column(String, nullable=False)
    manufacturer = Column(String, nullable=True)
    line = Column(String, nullable=True)
    status = Column(String, default="Running")
    oee = Column(Float, default=85.0)
    availability = Column(Float, default=90.0)
    performance = Column(Float, default=95.0)
    quality = Column(Float, default=99.0)
    temperature = Column(Float, default=45.0)
    vibration = Column(Float, default=1.2)
    rul_hours = Column(Float, default=500.0)
    health_score = Column(Float, default=90.0)
    last_maintenance = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
