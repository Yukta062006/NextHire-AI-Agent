from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation
from app.schemas.schemas import CareerRoadmapResponse
from app.utils.auth_utils import get_current_user
from app.agents.career_coach import generate_roadmap

router = APIRouter(prefix="/api/career-coach", tags=["Career Coach"])


@router.get("/roadmap")
async def get_roadmap(
    horizon: str = "7",
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a personalized career roadmap for the given time horizon."""
    # Get latest evaluation data
    eval_result = await db.execute(
        select(Evaluation)
        .where(Evaluation.user_id == user.id)
        .order_by(Evaluation.created_at.desc())
        .limit(1)
    )
    latest_eval = eval_result.scalar_one_or_none()

    performance_data = {}
    skill_gaps = []
    if latest_eval:
        performance_data = {
            "technical_score": latest_eval.technical_score,
            "communication_score": latest_eval.communication_score,
            "pressure_score": latest_eval.pressure_score,
            "knowledge_depth_score": latest_eval.knowledge_depth_score,
            "nexthire_score": latest_eval.nexthire_score,
            "recommendation": latest_eval.recommendation,
        }
        db_breakdown = latest_eval.detailed_breakdown
        if db_breakdown:
            if isinstance(db_breakdown, str):
                try:
                    db_breakdown = json.loads(db_breakdown)
                except Exception:
                    db_breakdown = {}
            if isinstance(db_breakdown, dict):
                skill_gaps = db_breakdown.get("weaknesses", [])

    roadmap = await generate_roadmap(
        performance_data=performance_data,
        skill_gaps=skill_gaps,
        career_goals=user.career_goals or "Land a senior engineering role",
        horizon=horizon,
    )

    return roadmap
