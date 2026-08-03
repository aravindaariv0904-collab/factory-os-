from sqlalchemy import Column, String, JSON
from sqlalchemy.dialects.postgresql import UUID
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin
import uuid

class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    subscription_plan = Column(String, default="basic")
    metadata = Column(JSON, nullable=True)

class Factory(Base, TimestampMixin):
    __tablename__ = "factories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    metadata = Column(JSON, nullable=True)

class User(Base, TimestampMixin):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    factory_id = Column(UUID(as_uuid=True), index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False) # admin, manager, operator
    is_active = Column(bool, default=True)
