from sqlalchemy import Column, String, Float, Boolean, DateTime
from datetime import datetime
from backend.app.db.session import Base

class FactoryModel(Base):
    __tablename__ = "factories"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    tenant_id = Column(String, index=True, default="tenant_01")
    oee_target = Column(Float, default=85.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)
