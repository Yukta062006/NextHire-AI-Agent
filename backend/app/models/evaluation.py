import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_id: Mapped[str] = mapped_column(String(36), ForeignKey("interviews.id"), unique=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    technical_score: Mapped[float] = mapped_column(Float, default=0.0)
    communication_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    pressure_score: Mapped[float] = mapped_column(Float, default=0.0)
    time_efficiency_score: Mapped[float] = mapped_column(Float, default=0.0)
    skill_verification_score: Mapped[float] = mapped_column(Float, default=0.0)
    knowledge_depth_score: Mapped[float] = mapped_column(Float, default=0.0)
    nexthire_score: Mapped[float] = mapped_column(Float, default=0.0)
    hire_probability: Mapped[float] = mapped_column(Float, default=0.0)
    recommendation: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Strong Hire | Hire | Borderline | Needs Improvement | Reject
    detailed_breakdown: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    company_context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    war_room: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    predictions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    risks: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    benchmarks: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    learning_velocity: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
