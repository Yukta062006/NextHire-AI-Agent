"""
Autopilot Agent API — Autonomous recruitment workflow with Human-in-the-Loop.
Track 4: Autopilot Agent for Global AI Hackathon with Qwen Cloud.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.utils.auth_utils import get_current_user
from app.models.user import User
from app.services.autopilot_engine import (
    run_autopilot_workflow,
    get_pending_approvals,
    resolve_approval,
    store_memory,
    get_memory,
    AVAILABLE_TOOLS,
    APPROVAL_REQUIRED_ACTIONS,
)

router = APIRouter(prefix="/api/autopilot", tags=["autopilot"])


class WorkflowRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None


class ApprovalAction(BaseModel):
    request_id: str
    approved: bool


class MemoryInput(BaseModel):
    memory_type: str  # preference, candidate_history
    key: str
    value: dict


@router.get("/tools")
async def list_tools():
    """List all tools available to the AI agent."""
    return {
        "tools": [{"name": k, "description": v} for k, v in AVAILABLE_TOOLS.items()],
        "approval_required_actions": APPROVAL_REQUIRED_ACTIONS,
    }


@router.post("/workflow")
async def execute_workflow(
    body: WorkflowRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute the full autonomous recruitment workflow.
    The AI agent will:
    1. Parse the resume
    2. Extract skills
    3. Match against JD (if provided)
    4. Score the candidate
    5. Make a hiring decision
    6. Generate interview questions
    7. Request approval if needed
    8. Store candidate in persistent memory
    """
    try:
        result = await run_autopilot_workflow(
            db=db,
            user_id=user.id,
            resume_text=body.resume_text,
            job_description=body.job_description,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")


@router.get("/approvals")
async def list_approvals(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all pending approval requests for the recruiter."""
    approvals = await get_pending_approvals(db, user.id)
    return {"pending_approvals": approvals, "count": len(approvals)}


@router.post("/approvals/resolve")
async def resolve_approval_request(
    body: ApprovalAction,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a pending action (Human-in-the-Loop)."""
    try:
        request = await resolve_approval(db, body.request_id, body.approved)
        action = "approved" if body.approved else "rejected"
        return {
            "status": action,
            "request_id": request.id,
            "action_type": request.action_type,
            "message": f"Action '{request.action_type}' has been {action} by recruiter.",
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/memory")
async def save_memory(
    body: MemoryInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Store a preference or context in the agent's persistent memory."""
    memory = await store_memory(db, user.id, body.memory_type, body.key, body.value)
    return {"status": "stored", "key": body.key, "type": body.memory_type}


@router.get("/memory")
async def list_memory(
    memory_type: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve stored memories (preferences, candidate history, etc.)."""
    memories = await get_memory(db, user.id, memory_type)
    return {"memories": memories, "count": len(memories)}


@router.get("/status")
async def agent_status():
    """Get the current status of the Autopilot AI Agent."""
    from app.agents.base_agent import client, MODEL_ID
    return {
        "agent": "NextHire AI Recruiter Agent",
        "version": "2.0.0",
        "track": "Track 4 — Autopilot Agent",
        "hackathon": "Global AI Hackathon Series with Qwen Cloud",
        "ai_provider": "Qwen Cloud (Alibaba Cloud DashScope)",
        "model": MODEL_ID,
        "api_endpoint": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        "ai_connected": client is not None,
        "capabilities": [
            "Autonomous Resume Analysis",
            "Skill Extraction & Scoring",
            "Job Description Matching",
            "Adaptive Interview Generation",
            "Candidate Ranking",
            "Human-in-the-Loop Approvals",
            "Persistent Memory",
            "Multi-Tool Orchestration",
            "Email Generation",
            "Calendar Scheduling",
        ],
        "tools_available": len(AVAILABLE_TOOLS),
        "approval_actions": APPROVAL_REQUIRED_ACTIONS,
    }
