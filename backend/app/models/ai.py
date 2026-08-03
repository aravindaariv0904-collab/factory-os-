from sqlalchemy import Column, String, DateTime, Float, JSON, Text, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, RLSMixin
import uuid

class Alert(Base, TimestampMixin, RLSMixin):
    __tablename__ = "alerts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(UUID(as_uuid=True), index=True, nullable=True)
    severity = Column(String, nullable=False) # critical, warning, info
    message = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)

class Recommendation(Base, TimestampMixin, RLSMixin):
    __tablename__ = "recommendations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(UUID(as_uuid=True), index=True, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    impact_analysis = Column(JSON, nullable=True)
    agent_id = Column(String, nullable=True)

class Prediction(Base, TimestampMixin, RLSMixin):
    __tablename__ = "predictions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(UUID(as_uuid=True), index=True, nullable=True)
    metric = Column(String, nullable=False) # failure_probability, oee_forecast
    predicted_value = Column(Float, nullable=False)
    target_date = Column(Date, nullable=True)
    shap_values = Column(JSON, nullable=True)
    model_version = Column(String, nullable=True)

class ChatSession(Base, TimestampMixin, RLSMixin):
    __tablename__ = "chat_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    metadata = Column(JSON, nullable=True)

class ChatHistory(Base, TimestampMixin, RLSMixin):
    __tablename__ = "chat_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    agent_metadata = Column(JSON, nullable=True)

class AIMemory(Base, TimestampMixin, RLSMixin):
    __tablename__ = "ai_memory"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String, index=True, nullable=False)
    value = Column(JSON, nullable=False)
