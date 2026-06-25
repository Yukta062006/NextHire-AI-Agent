from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.schemas.schemas import JDAnalyzeRequest, JDResponse
from app.utils.auth_utils import get_current_user
from app.agents.jd_intelligence import analyze_jd
from app.agents.skill_gap import analyze_skill_gap

router = APIRouter(prefix="/api/jd", tags=["Job Descriptions"])


@router.post("/analyze", response_model=JDResponse)
async def analyze_job_description(
    req: JDAnalyzeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyze a job description and perform gap analysis against the user's resume."""
    # AI analysis of JD
    jd_analysis = await analyze_jd(req.content)

    # Get latest resume for gap analysis
    gap_analysis = None
    result = await db.execute(
        select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc()).limit(1)
    )
    resume = result.scalar_one_or_none()
    if resume and resume.skills:
        candidate_profile = {
            "skills": resume.skills,
            "skill_confidence": resume.skill_confidence or {},
            "experience": resume.experience or [],
            "projects": resume.projects or [],
        }
        jd_requirements = {
            "required_skills": jd_analysis.get("required_skills", []),
            "preferred_skills": jd_analysis.get("preferred_skills", []),
            "technology_stack": jd_analysis.get("technology_stack", []),
            "seniority_level": jd_analysis.get("seniority_level", "Mid"),
        }
        gap_analysis = await analyze_skill_gap(candidate_profile, jd_requirements)

    match_score = None
    if gap_analysis:
        match_score = gap_analysis.get("match_score")

    # Save to DB
    jd = JobDescription(
        user_id=user.id,
        title=req.title or jd_analysis.get("title", "Untitled"),
        content=req.content,
        required_skills=jd_analysis.get("required_skills", []),
        preferred_skills=jd_analysis.get("preferred_skills", []),
        responsibilities=jd_analysis.get("responsibilities", []),
        experience_requirements=jd_analysis.get("experience_requirements"),
        technology_stack=jd_analysis.get("technology_stack", []),
        seniority_level=jd_analysis.get("seniority_level"),
        match_score=match_score,
        gap_analysis=gap_analysis,
    )
    db.add(jd)
    await db.commit()
    await db.refresh(jd)
    return JDResponse.model_validate(jd)


@router.get("/{jd_id}", response_model=JDResponse)
async def get_jd(jd_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(JobDescription).where(JobDescription.id == jd_id))
    jd = result.scalar_one_or_none()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    return JDResponse.model_validate(jd)


@router.get("/{jd_id}/gap-analysis")
async def get_gap_analysis(jd_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(JobDescription).where(JobDescription.id == jd_id))
    jd = result.scalar_one_or_none()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    return {"gap_analysis": jd.gap_analysis, "match_score": jd.match_score}
