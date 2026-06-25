"""
Autopilot Agent Models — Persistent Memory, Approval Workflow, Tool Invocations.
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, JSON, DateTime, Boolean, Integer, ForeignKey
from app.database import Base
import uuid


class AgentMemory(Base):
    """Persistent memory store for the AI agent's preferences and context."""
    __tablename__ = "agent_memory"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    memory_type = Column(String(50), nullable=False)  # preference, candidate_history, session
    key = Column(String(200), nullable=False)
    value = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ApprovalRequest(Base):
    """Human-in-the-Loop approval requests for critical agent actions."""
    __tablename__ = "approval_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    action_type = Column(String(50), nullable=False)  # send_offer, reject, schedule, shortlist, send_email
    candidate_id = Column(String, nullable=True)
    context = Column(JSON, nullable=False)  # Full context for the action
    status = Column(String(20), default="pending")  # pending, approved, rejected
    ai_reasoning = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class ToolInvocation(Base):
    """Log of all tool invocations by the agent."""
    __tablename__ = "tool_invocations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    tool_name = Column(String(100), nullable=False)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    status = Column(String(20), default="success")  # success, failed, pending_approval
    execution_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
