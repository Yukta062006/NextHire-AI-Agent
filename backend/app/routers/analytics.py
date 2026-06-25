import json
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.interview import Interview
from app.models.evaluation import Evaluation
from app.models.resume import Resume
from app.schemas.schemas import DashboardResponse
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the main dashboard data for the current user."""
    # Get latest evaluation
    eval_result = await db.execute(
        select(Evaluation)
        .where(Evaluation.user_id == user.id)
        .order_by(Evaluation.created_at.desc())
        .limit(1)
    )
    latest_eval = eval_result.scalar_one_or_none()

    # Get interview count
    count_result = await db.execute(
        select(func.count(Interview.id))
        .where(Interview.user_id == user.id)
        .where(Interview.status.in_(["completed", "terminated"]))
    )
    interview_count = count_result.scalar() or 0

    # Get recent interviews with evaluations
    recent_result = await db.execute(
        select(Interview, Evaluation)
        .outerjoin(Evaluation, Evaluation.interview_id == Interview.id)
        .where(Interview.user_id == user.id)
        .where(Interview.status.in_(["completed", "terminated"]))
        .order_by(Interview.created_at.desc())
        .limit(5)
    )
    recent_rows = recent_result.all()
    recent_interviews = []
    for interview, evaluation in recent_rows:
        recent_interviews.append({
            "id": interview.id,
            "type": interview.interview_type,
            "status": interview.status,
            "difficulty": interview.difficulty,
            "score": evaluation.nexthire_score if evaluation else 0,
            "recommendation": evaluation.recommendation if evaluation else "N/A",
            "date": interview.created_at.isoformat() if interview.created_at else "",
        })

    # Get skill data from latest resume
    resume_result = await db.execute(
        select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc()).limit(1)
    )
    resume = resume_result.scalar_one_or_none()
    skill_data = []
    if resume:
        skill_conf = resume.skill_confidence
        if isinstance(skill_conf, str):
            try:
                skill_conf = json.loads(skill_conf)
            except Exception:
                skill_conf = {}
        if isinstance(skill_conf, dict):
            for skill, confidence in skill_conf.items():
                skill_data.append({"subject": skill, "A": confidence, "fullMark": 100})

    # Get score trends from past evaluations
    trend_result = await db.execute(
        select(Evaluation)
        .where(Evaluation.user_id == user.id)
        .order_by(Evaluation.created_at.asc())
        .limit(10)
    )
    trend_evals = trend_result.scalars().all()
    trend_data = [
        {"name": f"Session {i+1}", "score": round(e.nexthire_score, 1)}
        for i, e in enumerate(trend_evals)
    ]

    # Initialize dashboard metrics
    nexthire_score = 0
    hire_prob = 0
    technical_score = 0
    communication_score = 0
    pressure_score = 0
    recommendation = "N/A"
    
    predictions = None
    risks = None
    benchmarks = None
    learning_velocity = None

    if latest_eval:
        nexthire_score = latest_eval.nexthire_score
        hire_prob = latest_eval.hire_probability
        technical_score = latest_eval.technical_score
        communication_score = latest_eval.communication_score
        pressure_score = latest_eval.pressure_score
        recommendation = latest_eval.recommendation or "N/A"
        
        db_breakdown = latest_eval.detailed_breakdown or {}
        if isinstance(db_breakdown, str):
            try:
                db_breakdown = json.loads(db_breakdown)
            except Exception:
                db_breakdown = {}
        predictions = db_breakdown.get("predictions")
        risks = db_breakdown.get("risks")
        benchmarks = db_breakdown.get("benchmarks")
        learning_velocity = db_breakdown.get("learning_velocity")
    elif resume:
        # Seed dashboard with initial resume evaluation score
        nexthire_score = resume.resume_score or 75.0
        hire_prob = min(99.0, max(10.0, nexthire_score * 1.05))
        technical_score = nexthire_score
        communication_score = nexthire_score * 0.95
        pressure_score = nexthire_score * 0.9
        recommendation = "Strong Hire" if nexthire_score >= 80 else "Hire" if nexthire_score >= 65 else "Borderline"
        
        # Seed dynamic predictions & benchmarks
        predictions = {
            "offer_probability": round(hire_prob),
            "success_90_day": round(nexthire_score * 0.96),
            "retention_probability": round(hire_prob * 1.02),
            "leadership_potential": "High" if nexthire_score >= 80 else "Medium",
            "promotion_potential": "High" if nexthire_score >= 80 else "Medium",
            "learning_velocity": "Exponential Developer" if nexthire_score >= 80 else "Linear Growth"
        }
        benchmarks = {
            "technical_rank": round(100 - technical_score),
            "communication_rank": round(100 - communication_score),
            "system_design_rank": 20,
            "problem_solving_rank": 15
        }
        learning_velocity = {
            "level": "High" if nexthire_score >= 80 else "Medium",
            "growth_rate": 15.0,
            "profile": f"Adaptive {user.target_role or 'Developer'}",
            "trend": [
                {"month": "Month 1", "score": round(nexthire_score * 0.85)},
                {"month": "Month 2", "score": round(nexthire_score * 0.95)},
                {"month": "Month 3", "score": round(nexthire_score)}
            ]
        }
        risks = [
            {"category": "Experience Depth", "description": "Candidate demonstrates theoretical knowledge but practical bounds need verification."}
        ]

    readiness = "Strong Hire" if nexthire_score >= 85 else "Hire" if nexthire_score >= 70 else "Borderline" if nexthire_score >= 55 else "Needs Improvement"

    return DashboardResponse(
        nexthire_score=round(nexthire_score, 1),
        hire_probability=round(hire_prob, 1),
        readiness=readiness,
        technical_score=round(technical_score, 1),
        communication_score=round(communication_score, 1),
        pressure_score=round(pressure_score, 1),
        interviews_completed=interview_count,
        recent_interviews=recent_interviews,
        skill_data=skill_data,
        trend_data=trend_data,
        predictions=predictions,
        risks=risks,
        benchmarks=benchmarks,
        learning_velocity=learning_velocity,
    )


@router.get("/trends")
async def get_trends(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get score trends over time."""
    result = await db.execute(
        select(Evaluation)
        .where(Evaluation.user_id == user.id)
        .order_by(Evaluation.created_at.asc())
    )
    evaluations = result.scalars().all()

    return {
        "nexthire_trend": [{"session": i+1, "score": round(e.nexthire_score, 1)} for i, e in enumerate(evaluations)],
        "technical_trend": [{"session": i+1, "score": round(e.technical_score, 1)} for i, e in enumerate(evaluations)],
        "communication_trend": [{"session": i+1, "score": round(e.communication_score, 1)} for i, e in enumerate(evaluations)],
        "pressure_trend": [{"session": i+1, "score": round(e.pressure_score, 1)} for i, e in enumerate(evaluations)],
    }
