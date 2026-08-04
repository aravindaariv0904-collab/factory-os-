from sqlalchemy import Column, String, DateTime, Float, JSON, Text, Boolean, Date
from backend.app.db.session import Base
from backend.app.models.base import TimestampMixin, RLSMixin, GUIDType, generate_uuid


class Alert(Base, TimestampMixin, RLSMixin):
    __tablename__ = "alerts"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    machine_id = Column(GUIDType(), index=True, nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String, nullable=False)  # critical, warning, info
    is_read = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)


class Recommendation(Base, TimestampMixin, RLSMixin):
    __tablename__ = "recommendations"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    machine_id = Column(GUIDType(), index=True, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    target_entity = Column(String, nullable=True)
    category = Column(String, nullable=True)
    impact_score = Column(String, nullable=True)
    estimated_savings = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    status = Column(String, default="New")
    actions = Column(JSON, nullable=True)
    agent_id = Column(String, nullable=True)


class Prediction(Base, TimestampMixin, RLSMixin):
    __tablename__ = "predictions"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    machine_id = Column(GUIDType(), index=True, nullable=True)
    metric = Column(String, nullable=False)  # failure_probability, rul_hours
    predicted_value = Column(Float, nullable=False)
    target_date = Column(Date, nullable=True)
    shap_values = Column(JSON, nullable=True)
    model_version = Column(String, nullable=True)


class ChatSession(Base, TimestampMixin, RLSMixin):
    __tablename__ = "chat_sessions"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    user_id = Column(GUIDType(), index=True, nullable=False)
    metadata_json = Column(JSON, nullable=True)


class ChatHistory(Base, TimestampMixin, RLSMixin):
    __tablename__ = "chat_history"

    id = Column(GUIDType(), primary_key=True, default=generate_uuid)
    session_id = Column(GUIDType(), index=True, nullable=False)
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    agent_metadata = Column(JSON, nullable=True)
