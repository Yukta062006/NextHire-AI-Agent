from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation
from app.models.interview import Interview
from app.models.resume import Resume
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/recruiter", tags=["Recruiter"])


@router.get("/candidates")
async def get_ranked_candidates(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all candidates ranked by NextHire score. Recruiter-only endpoint."""
    # Get all users with their latest evaluation
    users_result = await db.execute(
        select(User).where(User.role == "candidate")
    )
    candidates = users_result.scalars().all()

    ranked = []
    for candidate in candidates:
        eval_result = await db.execute(
            select(Evaluation)
            .where(Evaluation.user_id == candidate.id)
            .order_by(Evaluation.created_at.desc())
            .limit(1)
        )
        latest_eval = eval_result.scalar_one_or_none()

        interview_count_result = await db.execute(
            select(Interview)
            .where(Interview.user_id == candidate.id)
            .where(Interview.status.in_(["completed", "terminated"]))
        )
        interviews = interview_count_result.scalars().all()

        resume_result = await db.execute(
            select(Resume)
            .where(Resume.user_id == candidate.id)
            .order_by(Resume.created_at.desc())
            .limit(1)
        )
        latest_resume = resume_result.scalar_one_or_none()

        ranked.append({
            "id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "target_role": candidate.target_role or "Not specified",
            "experience_level": candidate.experience_level or "Not specified",
            "nexthire_score": round(latest_eval.nexthire_score, 1) if latest_eval else 0,
            "hire_probability": round(latest_eval.hire_probability, 1) if latest_eval else 0,
            "recommendation": latest_eval.recommendation if latest_eval else "N/A",
            "technical_score": round(latest_eval.technical_score, 1) if latest_eval else 0,
            "communication_score": round(latest_eval.communication_score, 1) if latest_eval else 0,
            "skill_verification_score": round(latest_eval.skill_verification_score, 1) if latest_eval else 0,
            "interviews_completed": len(interviews),
            "skills": latest_resume.skills if latest_resume and latest_resume.skills else [],
        })

    # Sort by NextHire score descending
    ranked.sort(key=lambda x: x["nexthire_score"], reverse=True)
    return {"candidates": ranked, "total": len(ranked)}


@router.get("/candidates/{candidate_id}/report")
async def get_candidate_report(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a detailed recruiter report for a specific candidate."""
    user_result = await db.execute(select(User).where(User.id == candidate_id))
    candidate = user_result.scalar_one_or_none()
    if not candidate:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Candidate not found")

    eval_result = await db.execute(
        select(Evaluation)
        .where(Evaluation.user_id == candidate_id)
        .order_by(Evaluation.created_at.desc())
    )
    evaluations = eval_result.scalars().all()

    return {
        "candidate": {
            "name": candidate.name,
            "email": candidate.email,
            "target_role": candidate.target_role,
            "experience_level": candidate.experience_level,
        },
        "evaluations": [
            {
                "interview_id": e.interview_id,
                "nexthire_score": round(e.nexthire_score, 1),
                "technical_score": round(e.technical_score, 1),
                "communication_score": round(e.communication_score, 1),
                "pressure_score": round(e.pressure_score, 1),
                "hire_probability": round(e.hire_probability, 1),
                "recommendation": e.recommendation,
                "detailed_breakdown": e.detailed_breakdown,
                "war_room": e.war_room,
                "predictions": e.predictions,
                "risks": e.risks,
                "benchmarks": e.benchmarks,
                "learning_velocity": e.learning_velocity,
            }
            for e in evaluations
        ],
        "total_interviews": len(evaluations),
    }
