import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.schemas import ResumeResponse
from app.utils.auth_utils import get_current_user
from app.utils.resume_parser import extract_text_from_file
from app.agents.resume_intelligence import analyze_resume
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/resumes", tags=["Resumes"])


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a resume, parse it, and run AI analysis."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_bytes = await file.read()

    # Save file to disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, f"{user.id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Extract text
    try:
        raw_text = extract_text_from_file(file_bytes, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # AI Analysis
    analysis = await analyze_resume(raw_text)

    # Save to DB
    resume = Resume(
        user_id=user.id,
        file_path=file_path,
        raw_text=raw_text,
        parsed_content=analysis,
        skills=analysis.get("skills", []),
        projects=analysis.get("projects", []),
        education=analysis.get("education", []),
        certifications=analysis.get("certifications", []),
        experience=analysis.get("experience", []),
        resume_score=analysis.get("resume_score"),
        skill_confidence=analysis.get("skill_confidence", {}),
        project_complexity=analysis.get("project_complexity", {}),
    )
    db.add(resume)
    
    # Update candidate profile name in User model if parsed from resume
    extracted_name = analysis.get("name")
    if extracted_name and extracted_name.strip() and extracted_name != "Candidate's Full Name":
        user.name = extracted_name.strip()
        db.add(user)

    extracted_role = analysis.get("target_role")
    if extracted_role and extracted_role.strip():
        user.target_role = extracted_role.strip()
        db.add(user)

    await db.commit()
    await db.refresh(resume)
    return ResumeResponse.model_validate(resume)


@router.get("/latest", response_model=ResumeResponse)
async def get_latest_resume(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's latest resume."""
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == user.id)
        .order_by(Resume.created_at.desc())
        .limit(1)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        # Auto-seed a high-fidelity mock resume using candidate's registered name and target role
        from app.agents.base_agent import _generate_mock_response
        user_prompt = f"Analyze this resume:\nName: {user.name}\nRole: {user.target_role or 'Software Engineer'}"
        mock_data = _generate_mock_response("resume intelligence", user_prompt)
        resume = Resume(
            user_id=user.id,
            file_path="mock_resume.pdf",
            raw_text=f"Mock resume text content for {user.name}.",
            parsed_content=mock_data,
            skills=mock_data.get("skills", []),
            projects=mock_data.get("projects", []),
            education=mock_data.get("education", []),
            certifications=mock_data.get("certifications", []),
            experience=mock_data.get("experience", []),
            resume_score=mock_data.get("resume_score"),
            skill_confidence=mock_data.get("skill_confidence", {}),
            project_complexity=mock_data.get("project_complexity", {}),
        )
        db.add(resume)
        await db.commit()
        await db.refresh(resume)
    return ResumeResponse.model_validate(resume)


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(resume_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return ResumeResponse.model_validate(resume)
