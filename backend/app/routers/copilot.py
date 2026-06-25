from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation
from app.models.resume import Resume
from app.schemas.schemas import CopilotChatRequest, CopilotChatResponse
from app.utils.auth_utils import get_current_user
from app.agents.copilot_agent import chat

router = APIRouter(prefix="/api/copilot", tags=["AI Copilot"])


@router.post("/chat", response_model=CopilotChatResponse)
async def copilot_chat(
    req: CopilotChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Chat with the AI Copilot using full candidate context."""
    # Build context
    eval_result = await db.execute(
        select(Evaluation).where(Evaluation.user_id == user.id).order_by(Evaluation.created_at.desc()).limit(3)
    )
    recent_evals = eval_result.scalars().all()

    resume_result = await db.execute(
        select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc()).limit(1)
    )
    resume = resume_result.scalar_one_or_none()

    latest_breakdown = recent_evals[0].detailed_breakdown if (recent_evals and recent_evals[0].detailed_breakdown) else {}
    if isinstance(latest_breakdown, str):
        try:
            latest_breakdown = json.loads(latest_breakdown)
        except Exception:
            latest_breakdown = {}

    skills = []
    if resume and resume.skills:
        skills_val = resume.skills
        if isinstance(skills_val, str):
            try:
                skills = json.loads(skills_val)
            except Exception:
                skills = []
        elif isinstance(skills_val, list):
            skills = skills_val

    context = {
        "name": user.name,
        "target_role": user.target_role,
        "career_goals": user.career_goals,
        "nexthire_score": recent_evals[0].nexthire_score if recent_evals else None,
        "skills": skills,
        "recent_scores": [
            {
                "nexthire": e.nexthire_score,
                "technical": e.technical_score,
                "communication": e.communication_score,
                "recommendation": e.recommendation,
            }
            for e in recent_evals
        ],
        "predictions": latest_breakdown.get("predictions", {}),
        "benchmarks": latest_breakdown.get("benchmarks", {}),
        "risks": latest_breakdown.get("risks", []),
        "war_room": latest_breakdown.get("war_room", {}),
        "company_context": latest_breakdown.get("company_context", {}),
        "weaknesses": latest_breakdown.get("hiring_verdict", {}).get("weaknesses", []) if "hiring_verdict" in latest_breakdown else []
    }

    result = await chat(req.message, context)
    return CopilotChatResponse(
        response=result.get("response", "I'm here to help! Could you rephrase your question?"),
        suggestions=result.get("suggestions", []),
    )
