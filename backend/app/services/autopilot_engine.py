"""
Autopilot Engine — Orchestrates the autonomous recruitment workflow.
Implements: Tool Calling, Persistent Memory, Human-in-the-Loop approvals.
"""
import time
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.autopilot import AgentMemory, ApprovalRequest, ToolInvocation
from app.agents.base_agent import call_qwen


# ============================================================================
# TOOL REGISTRY — Agent can invoke these tools autonomously
# ============================================================================

AVAILABLE_TOOLS = {
    "resume_parser": "Parse and extract structured data from a resume file",
    "skill_extractor": "Extract and score technical/soft skills from text",
    "jd_matcher": "Match candidate skills against job description requirements",
    "candidate_scorer": "Generate a composite hiring score for a candidate",
    "interview_generator": "Generate adaptive interview questions",
    "email_generator": "Draft professional recruitment emails",
    "calendar_scheduler": "Schedule interviews avoiding conflicts",
    "database_search": "Search candidates/jobs in the database",
    "analytics_tool": "Generate hiring analytics and insights",
    "qwen_reasoning": "Use Qwen AI for complex reasoning tasks",
}

# Actions requiring human approval before execution
APPROVAL_REQUIRED_ACTIONS = [
    "send_offer",
    "reject_candidate",
    "schedule_interview",
    "send_email",
    "shortlist_candidate",
]


async def store_memory(db: AsyncSession, user_id: str, memory_type: str, key: str, value: dict) -> AgentMemory:
    """Store or update a memory entry for the agent."""
    result = await db.execute(
        select(AgentMemory).where(
            and_(AgentMemory.user_id == user_id, AgentMemory.key == key)
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.value = value
        existing.updated_at = datetime.utcnow()
        await db.commit()
        return existing

    memory = AgentMemory(
        id=str(uuid.uuid4()),
        user_id=user_id,
        memory_type=memory_type,
        key=key,
        value=value,
    )
    db.add(memory)
    await db.commit()
    return memory


async def get_memory(db: AsyncSession, user_id: str, memory_type: Optional[str] = None) -> list[dict]:
    """Retrieve all memories for a user, optionally filtered by type."""
    query = select(AgentMemory).where(AgentMemory.user_id == user_id)
    if memory_type:
        query = query.where(AgentMemory.memory_type == memory_type)
    result = await db.execute(query)
    memories = result.scalars().all()
    return [{"key": m.key, "value": m.value, "type": m.memory_type, "updated_at": str(m.updated_at)} for m in memories]


async def create_approval_request(
    db: AsyncSession,
    user_id: str,
    action_type: str,
    context: dict,
    ai_reasoning: str,
    candidate_id: Optional[str] = None,
) -> ApprovalRequest:
    """Create an approval request that requires human intervention."""
    request = ApprovalRequest(
        id=str(uuid.uuid4()),
        user_id=user_id,
        action_type=action_type,
        candidate_id=candidate_id,
        context=context,
        ai_reasoning=ai_reasoning,
        status="pending",
    )
    db.add(request)
    await db.commit()
    return request


async def resolve_approval(db: AsyncSession, request_id: str, approved: bool) -> ApprovalRequest:
    """Resolve an approval request (approve or reject)."""
    result = await db.execute(select(ApprovalRequest).where(ApprovalRequest.id == request_id))
    request = result.scalar_one_or_none()
    if not request:
        raise ValueError("Approval request not found")

    request.status = "approved" if approved else "rejected"
    request.resolved_at = datetime.utcnow()
    await db.commit()
    return request


async def get_pending_approvals(db: AsyncSession, user_id: str) -> list[dict]:
    """Get all pending approval requests for a recruiter."""
    result = await db.execute(
        select(ApprovalRequest).where(
            and_(ApprovalRequest.user_id == user_id, ApprovalRequest.status == "pending")
        )
    )
    approvals = result.scalars().all()
    return [
        {
            "id": a.id,
            "action_type": a.action_type,
            "candidate_id": a.candidate_id,
            "context": a.context,
            "ai_reasoning": a.ai_reasoning,
            "created_at": str(a.created_at),
        }
        for a in approvals
    ]


async def log_tool_invocation(
    db: AsyncSession,
    user_id: str,
    tool_name: str,
    input_data: dict,
    output_data: dict,
    status: str = "success",
    execution_time_ms: int = 0,
) -> ToolInvocation:
    """Log a tool invocation for audit trail and analytics."""
    invocation = ToolInvocation(
        id=str(uuid.uuid4()),
        user_id=user_id,
        tool_name=tool_name,
        input_data=input_data,
        output_data=output_data,
        status=status,
        execution_time_ms=execution_time_ms,
    )
    db.add(invocation)
    await db.commit()
    return invocation


async def run_autopilot_workflow(
    db: AsyncSession,
    user_id: str,
    resume_text: str,
    job_description: Optional[str] = None,
) -> dict:
    """
    Execute the full autonomous recruitment workflow.
    The AI agent reasons through the pipeline, invokes tools, and pauses for approvals.
    """
    workflow_log = []
    start_time = time.time()

    # Load recruiter preferences from memory
    preferences = await get_memory(db, user_id, "preference")
    pref_context = ""
    if preferences:
        pref_context = f"\nRecruiter Preferences: {preferences}"

    # Step 1: Resume Parsing & Analysis
    tool_start = time.time()
    from app.agents.resume_intelligence import analyze_resume
    resume_data = await analyze_resume(resume_text)
    await log_tool_invocation(db, user_id, "resume_parser", {"text_length": len(resume_text)}, resume_data, "success", int((time.time() - tool_start) * 1000))
    workflow_log.append({"step": "resume_analysis", "status": "complete", "tool": "resume_parser"})

    # Step 2: Job Description Matching (if JD provided)
    match_data = None
    if job_description:
        tool_start = time.time()
        from app.agents.jd_intelligence import analyze_jd
        jd_data = await analyze_jd(job_description)
        await log_tool_invocation(db, user_id, "jd_matcher", {"jd_length": len(job_description)}, jd_data, "success", int((time.time() - tool_start) * 1000))
        workflow_log.append({"step": "jd_analysis", "status": "complete", "tool": "jd_matcher"})

        # Step 3: Skill Gap Analysis
        tool_start = time.time()
        from app.agents.skill_gap import analyze_skill_gap
        match_data = await analyze_skill_gap(resume_data, jd_data)
        await log_tool_invocation(db, user_id, "skill_extractor", {}, match_data, "success", int((time.time() - tool_start) * 1000))
        workflow_log.append({"step": "skill_gap_analysis", "status": "complete", "tool": "skill_extractor"})

    # Step 4: Candidate Scoring
    candidate_score = resume_data.get("resume_score", 70)
    match_percentage = match_data.get("match_percentage", 65) if match_data else 65
    workflow_log.append({"step": "candidate_scoring", "status": "complete", "tool": "candidate_scorer"})

    # Step 5: AI Reasoning — Should we proceed with this candidate?
    reasoning_prompt = f"""
You are an autonomous AI Recruiter Agent making a hiring workflow decision.

Candidate Analysis: {resume_data}
Match Data: {match_data}
Candidate Score: {candidate_score}
Match Percentage: {match_percentage}%
{pref_context}

Based on this data, decide the next action:
- If score >= 75 and match >= 70%: Recommend "shortlist" and generate interview questions
- If score >= 60: Recommend "further_review" 
- If score < 60: Recommend "reject"

Return JSON with: decision, reasoning, next_actions, confidence
"""
    tool_start = time.time()
    ai_decision = await call_qwen(
        "You are an autonomous AI recruiter agent. Make data-driven hiring decisions.",
        reasoning_prompt
    )
    await log_tool_invocation(db, user_id, "qwen_reasoning", {"prompt": "workflow_decision"}, ai_decision if isinstance(ai_decision, dict) else {"raw": str(ai_decision)}, "success", int((time.time() - tool_start) * 1000))
    workflow_log.append({"step": "ai_reasoning", "status": "complete", "tool": "qwen_reasoning"})

    # Step 6: Determine if approval is needed
    decision = "further_review"
    if isinstance(ai_decision, dict):
        decision = ai_decision.get("decision", "further_review")
    
    approval_needed = decision in ["shortlist", "reject"]
    approval_request = None

    if approval_needed:
        action_type = "shortlist_candidate" if decision == "shortlist" else "reject_candidate"
        reasoning = ai_decision.get("reasoning", "Based on AI analysis") if isinstance(ai_decision, dict) else "Based on AI analysis"
        approval_request = await create_approval_request(
            db=db,
            user_id=user_id,
            action_type=action_type,
            context={
                "candidate_name": resume_data.get("name", "Unknown"),
                "score": candidate_score,
                "match_percentage": match_percentage,
                "skills": resume_data.get("skills", [])[:10],
                "decision": decision,
            },
            ai_reasoning=reasoning,
        )
        workflow_log.append({"step": "approval_requested", "status": "waiting", "action": action_type})

    # Step 7: Generate interview questions (if shortlisted)
    interview_questions = None
    if decision == "shortlist" or candidate_score >= 65:
        tool_start = time.time()
        from app.agents.adaptive_interview import generate_question
        interview_questions = await generate_question(
            resume_data=resume_data,
            jd_data=match_data or {},
            history=[],
            current_difficulty="Medium",
            knowledge_graph={},
        )
        await log_tool_invocation(db, user_id, "interview_generator", {}, interview_questions if isinstance(interview_questions, dict) else {}, "success", int((time.time() - tool_start) * 1000))
        workflow_log.append({"step": "interview_questions", "status": "complete", "tool": "interview_generator"})

    # Step 8: Store candidate in memory
    candidate_name = resume_data.get("name", "Unknown Candidate")
    await store_memory(db, user_id, "candidate_history", f"candidate_{candidate_name}", {
        "name": candidate_name,
        "score": candidate_score,
        "match_percentage": match_percentage,
        "decision": decision,
        "skills": resume_data.get("skills", []),
        "processed_at": str(datetime.utcnow()),
    })
    workflow_log.append({"step": "memory_stored", "status": "complete", "tool": "database_search"})

    total_time = int((time.time() - start_time) * 1000)

    return {
        "status": "complete" if not approval_needed else "awaiting_approval",
        "candidate": {
            "name": candidate_name,
            "score": candidate_score,
            "match_percentage": match_percentage,
            "skills": resume_data.get("skills", []),
            "target_role": resume_data.get("target_role", ""),
            "summary": resume_data.get("summary", ""),
        },
        "ai_decision": ai_decision if isinstance(ai_decision, dict) else {"decision": decision, "reasoning": "AI analysis completed"},
        "approval_request": {"id": approval_request.id, "action_type": approval_request.action_type} if approval_request else None,
        "interview_questions": interview_questions,
        "workflow_log": workflow_log,
        "execution_time_ms": total_time,
        "tools_invoked": len(workflow_log),
    }
