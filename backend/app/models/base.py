from datetime import datetime
from sqlalchemy import Column, DateTime, String, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

GUID_LENGTH = 36


def generate_uuid() -> str:
    return str(uuid.uuid4())


def GUIDType():
    """Cross-dialect UUID: native UUID on Postgres, CHAR(36) on SQLite."""
    from sqlalchemy.types import TypeDecorator, CHAR, String
    from sqlalchemy.dialects.postgresql import UUID

    class GUID(TypeDecorator):
        impl = String
        cache_ok = True

        def load_dialect_impl(self, dialect):
            if dialect.name == "postgresql":
                return dialect.type_descriptor(UUID(as_uuid=True))
            return dialect.type_descriptor(CHAR(GUID_LENGTH))

        def process_bind_param(self, value, dialect):
            if value is None:
                return value
            if dialect.name == "postgresql" and not isinstance(value, uuid.UUID):
                return uuid.UUID(str(value))
            return str(value)

        def process_result_value(self, value, dialect):
            if value is None:
                return value
            if isinstance(value, uuid.UUID):
                return str(value)
            return str(value)

    return GUID()


class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class RLSMixin:
    """Row Level Security - every entity belongs to an organization and optionally a factory."""
    organization_id = Column(String(GUID_LENGTH), index=True, nullable=False)
    factory_id = Column(String(GUID_LENGTH), index=True, nullable=True)
