import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    jd_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("job_descriptions.id"), nullable=True)
    resume_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("resumes.id"), nullable=True)
    interview_type: Mapped[str] = mapped_column(String(50), default="technical")  # technical | behavioral | system_design | mixed
    company: Mapped[str | None] = mapped_column(String(50), nullable=True, default="Standard")
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)  # in seconds
    difficulty: Mapped[str] = mapped_column(String(20), default="Medium")  # Easy | Medium | Hard | Expert
    mode: Mapped[str] = mapped_column(String(20), default="text")  # text | voice
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | active | completed | terminated
    knowledge_graph: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    question_count: Mapped[int] = mapped_column(Integer, default=0)
    current_question_index: Mapped[int] = mapped_column(Integer, default=0)
    termination_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
