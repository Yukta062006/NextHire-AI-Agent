import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id: Mapped[str] = mapped_column(String(36), ForeignKey("questions.id"), index=True)
    interview_id: Mapped[str] = mapped_column(String(36), ForeignKey("interviews.id"), index=True)
    response_text: Mapped[str] = mapped_column(Text)
    response_time_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    evaluation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
