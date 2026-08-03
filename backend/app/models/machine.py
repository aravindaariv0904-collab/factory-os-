from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from datetime import datetime
from backend.app.db.session import Base

class MachineModel(Base):
    __tablename__ = "machines"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    factory_id = Column(String, ForeignKey("factories.id"), nullable=False, index=True)
    status = Column(String, default="Running")
    health_score = Column(Float, default=95.0)
    temperature = Column(Float, default=45.0)
    vibration = Column(Float, default=1.2)
    rul_hours = Column(Float, default=450.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)
