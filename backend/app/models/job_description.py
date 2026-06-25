import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text)
    required_skills: Mapped[list | None] = mapped_column(JSON, nullable=True)
    preferred_skills: Mapped[list | None] = mapped_column(JSON, nullable=True)
    responsibilities: Mapped[list | None] = mapped_column(JSON, nullable=True)
    experience_requirements: Mapped[str | None] = mapped_column(String(255), nullable=True)
    technology_stack: Mapped[list | None] = mapped_column(JSON, nullable=True)
    seniority_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    match_score: Mapped[float | None] = mapped_column(nullable=True)
    gap_analysis: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
