import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_id: Mapped[str] = mapped_column(String(36), ForeignKey("interviews.id"), index=True)
    question_text: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(20), default="Medium")
    category: Mapped[str] = mapped_column(String(50), default="technical")  # technical | behavioral | system_design
    topic: Mapped[str | None] = mapped_column(String(255), nullable=True)
    knowledge_node: Mapped[str | None] = mapped_column(String(255), nullable=True)
    follow_up_path: Mapped[list | None] = mapped_column(JSON, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
