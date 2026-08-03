from sqlalchemy import Column, String, Date, DateTime, JSON, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, RLSMixin
import uuid

class Plant(Base, TimestampMixin, RLSMixin):
    __tablename__ = "plants"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)

class Machine(Base, TimestampMixin, RLSMixin):
    __tablename__ = "machines"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    installation_date = Column(Date, nullable=True)
    last_maintenance = Column(DateTime, nullable=True)
    status = Column(String, default="operational")
    metadata = Column(JSON, nullable=True)

class Operator(Base, TimestampMixin, RLSMixin):
    __tablename__ = "operators"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    shift_pattern = Column(String, nullable=True)
    skills = Column(ARRAY(String), nullable=True)
