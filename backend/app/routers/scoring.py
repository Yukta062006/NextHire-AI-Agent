from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation
from app.schemas.schemas import EvaluationResponse
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/scoring", tags=["Scoring"])


@router.get("/{interview_id}", response_model=EvaluationResponse)
async def get_evaluation(
    interview_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get the full evaluation report for an interview."""
    result = await db.execute(
        select(Evaluation).where(Evaluation.interview_id == interview_id)
    )
    evaluation = result.scalar_one_or_none()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return EvaluationResponse.model_validate(evaluation)
