from sqlalchemy import Column, String, Integer, JSON
from backend.app.db.session import Base
from backend.app.models.base import TimestampMixin, RLSMixin, GUIDType, generate_uuid


class DataUpload(Base, TimestampMixin, RLSMixin):
    __tablename__ = "data_uploads"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=True)
    record_count = Column(Integer, default=0)
    status = Column(String, default="completed")
    columns = Column(JSON, nullable=True)
    uploaded_by = Column(String, nullable=True)
