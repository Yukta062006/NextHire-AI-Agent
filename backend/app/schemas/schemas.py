from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# ── Auth ──────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "candidate"


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    email: str
    name: str
    photo_url: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# ── User ──────────────────────────────────────────
class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    experience_level: Optional[str] = None
    target_role: Optional[str] = None
    career_goals: Optional[str] = None
    profile_picture: Optional[str] = None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: Optional[str] = None
    experience_level: Optional[str] = None
    target_role: Optional[str] = None
    career_goals: Optional[str] = None


# ── Resume ────────────────────────────────────────
class ResumeResponse(BaseModel):
    id: str
    user_id: str
    skills: Optional[list] = None
    projects: Optional[list] = None
    education: Optional[list] = None
    certifications: Optional[list] = None
    experience: Optional[list] = None
    resume_score: Optional[float] = None
    skill_confidence: Optional[dict] = None
    project_complexity: Optional[dict] = None
    parsed_content: Optional[dict] = None

    model_config = {"from_attributes": True}


# ── Job Description ───────────────────────────────
class JDAnalyzeRequest(BaseModel):
    content: str
    title: Optional[str] = None


class JDResponse(BaseModel):
    id: str
    title: Optional[str] = None
    required_skills: Optional[list] = None
    preferred_skills: Optional[list] = None
    responsibilities: Optional[list] = None
    experience_requirements: Optional[str] = None
    technology_stack: Optional[list] = None
    seniority_level: Optional[str] = None
    match_score: Optional[float] = None
    gap_analysis: Optional[dict] = None

    model_config = {"from_attributes": True}


# ── Interview ─────────────────────────────────────
class InterviewStartRequest(BaseModel):
    jd_id: Optional[str] = None
    resume_id: Optional[str] = None
    interview_type: str = "technical"
    difficulty: str = "Medium"
    company: Optional[str] = "Standard"


class InterviewResponse(BaseModel):
    id: str
    user_id: str
    interview_type: str
    company: Optional[str] = "Standard"
    difficulty: str
    status: str
    knowledge_graph: Optional[dict] = None
    question_count: int = 0
    current_question_index: int = 0
    start_time: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AnswerSubmitRequest(BaseModel):
    answer_text: str
    response_time_seconds: Optional[float] = None


class QuestionResponse(BaseModel):
    id: str
    question_text: str
    difficulty: str
    category: str
    topic: Optional[str] = None
    knowledge_node: Optional[str] = None
    order_index: int

    model_config = {"from_attributes": True}


class AnswerEvaluationResponse(BaseModel):
    answer_id: str
    score: float
    evaluation: dict
    reasoning: str
    next_question: Optional[QuestionResponse] = None
    updated_metrics: Optional[dict] = None
    difficulty_changed: Optional[str] = None
    interview_terminated: bool = False
    termination_reason: Optional[str] = None


# ── Evaluation / Scoring ──────────────────────────
class EvaluationResponse(BaseModel):
    id: str
    interview_id: str
    technical_score: float
    communication_score: float
    confidence_score: float
    pressure_score: float
    time_efficiency_score: float
    skill_verification_score: float
    knowledge_depth_score: float
    nexthire_score: float
    hire_probability: float
    recommendation: Optional[str] = None
    detailed_breakdown: Optional[dict] = None
    company_context: Optional[dict] = None
    war_room: Optional[dict] = None
    predictions: Optional[dict] = None
    risks: Optional[list] = None
    benchmarks: Optional[dict] = None
    learning_velocity: Optional[dict] = None

    model_config = {"from_attributes": True}


# ── Report ────────────────────────────────────────
class ReportResponse(BaseModel):
    id: str
    interview_id: str
    nexthire_score: float
    recommendation: Optional[str] = None
    strengths: Optional[list] = None
    weaknesses: Optional[list] = None
    learning_plan: Optional[dict] = None
    detailed_feedback: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Copilot ───────────────────────────────────────
class CopilotChatRequest(BaseModel):
    message: str


class CopilotChatResponse(BaseModel):
    response: str
    suggestions: Optional[list[str]] = None


# ── Analytics ─────────────────────────────────────
class DashboardResponse(BaseModel):
    nexthire_score: float
    hire_probability: float
    readiness: str
    technical_score: float
    communication_score: float
    pressure_score: float
    interviews_completed: int
    recent_interviews: list
    skill_data: list
    trend_data: list
    predictions: Optional[dict] = None
    risks: Optional[list] = None
    benchmarks: Optional[dict] = None
    learning_velocity: Optional[dict] = None


# ── Gamification ──────────────────────────────────
class GamificationProfileResponse(BaseModel):
    total_xp: int
    level: int
    current_streak: int
    longest_streak: int
    interviews_completed: int
    achievements: list


# ── Career Coach ──────────────────────────────────
class CareerRoadmapResponse(BaseModel):
    horizon: str
    title: str
    description: str
    modules: list


# Rebuild forward refs
TokenResponse.model_rebuild()
