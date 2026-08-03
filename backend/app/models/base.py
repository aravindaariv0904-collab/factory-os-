from sqlalchemy import Column, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class RLSMixin:
    """Mixins for Row Level Security - every entity belongs to an organization and optionally a factory."""
    organization_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    factory_id = Column(UUID(as_uuid=True), index=True, nullable=True)
