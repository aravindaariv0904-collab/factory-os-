from sqlalchemy import Column, String, Boolean, JSON
from backend.app.db.session import Base
from backend.app.models.base import TimestampMixin, GUIDType, generate_uuid


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    subscription_plan = Column(String, default="basic")
    metadata_json = Column(JSON, nullable=True)


class Factory(Base, TimestampMixin):
    __tablename__ = "factories"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    organization_id = Column(GUIDType(), index=True, nullable=False)
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    type = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    oee_target = Column(String, nullable=True)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    organization_id = Column(GUIDType(), index=True, nullable=False)
    factory_id = Column(GUIDType(), index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, manager, operator
    is_active = Column(Boolean, default=True)
