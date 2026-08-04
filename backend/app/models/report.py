from sqlalchemy import Column, String, Text, JSON
from backend.app.db.session import Base
from backend.app.models.base import TimestampMixin, RLSMixin, GUIDType, generate_uuid


class SystemReport(Base, TimestampMixin, RLSMixin):
    __tablename__ = "system_reports"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    format = Column(String, default="PDF")
    status = Column(String, default="Ready")  # ready, processing, failed
    download_url = Column(String, nullable=True)
    created_by = Column(String, nullable=True)
