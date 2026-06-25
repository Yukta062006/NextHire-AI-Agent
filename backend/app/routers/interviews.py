from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.interview import Interview
from app.models.question import Question
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.schemas.schemas import InterviewStartRequest, InterviewResponse, AnswerSubmitRequest, AnswerEvaluationResponse
from app.utils.auth_utils import get_current_user
from app.services.interview_engine import start_interview, process_answer
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/api/interviews", tags=["Interviews"])


@router.post("/start")
async def start_new_interview(
    req: InterviewStartRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new AI interview session."""
    interview = Interview(
        user_id=user.id,
        jd_id=req.jd_id,
        resume_id=req.resume_id,
        interview_type=req.interview_type,
        difficulty=req.difficulty,
        company=req.company,
    )
    db.add(interview)
    await db.commit()
    await db.refresh(interview)

    result = await start_interview(db, user.id, interview)

    # Broadcast via WebSocket
    await ws_manager.send_event(interview.id, "question_generated", result.get("first_question", {}))

    return result


@router.post("/{interview_id}/answer")
async def submit_answer(
    interview_id: str,
    req: AnswerSubmitRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit an answer and get evaluation + next question."""
    result = await db.execute(
        select(Interview).where(Interview.id == interview_id, Interview.user_id == user.id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.status not in ("active", "pending"):
        raise HTTPException(status_code=400, detail=f"Interview is {interview.status}")

    response = await process_answer(db, interview, req.answer_text, req.response_time_seconds)

    # Broadcast WebSocket events
    await ws_manager.send_event(interview_id, "answer_received", {"score": response.get("score")})
    await ws_manager.send_event(interview_id, "score_updated", response.get("updated_metrics", {}))

    if response.get("difficulty_changed"):
        await ws_manager.send_event(interview_id, "difficulty_changed", {"new_difficulty": response["difficulty_changed"]})

    if response.get("next_question"):
        await ws_manager.send_event(interview_id, "question_generated", response["next_question"])

    if response.get("interview_terminated"):
        await ws_manager.send_event(interview_id, "interview_terminated", {
            "reason": response.get("termination_reason")
        })
    elif response.get("interview_completed"):
        await ws_manager.send_event(interview_id, "interview_completed", response.get("final_report", {}))

    return response


@router.post("/{interview_id}/end")
async def end_interview(
    interview_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually end an interview."""
    result = await db.execute(
        select(Interview).where(Interview.id == interview_id, Interview.user_id == user.id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    from datetime import datetime
    interview.status = "completed"
    interview.end_time = datetime.utcnow()
    await db.commit()

    await ws_manager.send_event(interview_id, "interview_completed", {"status": "ended_by_user"})
    return {"status": "completed", "interview_id": interview_id}


@router.get("/{interview_id}")
async def get_interview(
    interview_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get interview details."""
    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return InterviewResponse.model_validate(interview)


@router.get("/{interview_id}/replay")
async def get_replay(
    interview_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get the full Q&A replay of an interview."""
    q_result = await db.execute(
        select(Question).where(Question.interview_id == interview_id).order_by(Question.order_index)
    )
    questions = q_result.scalars().all()

    replay = []
    for q in questions:
        a_result = await db.execute(
            select(Answer).where(Answer.question_id == q.id)
        )
        answer = a_result.scalar_one_or_none()
        replay.append({
            "question": {
                "text": q.question_text,
                "difficulty": q.difficulty,
                "category": q.category,
                "topic": q.topic,
                "order": q.order_index,
            },
            "answer": {
                "text": answer.response_text if answer else None,
                "score": answer.score if answer else None,
                "evaluation": answer.evaluation if answer else None,
                "reasoning": answer.reasoning if answer else None,
                "response_time": answer.response_time_seconds if answer else None,
            } if answer else None,
        })

    return {"interview_id": interview_id, "replay": replay}


@router.get("/user/history")
async def get_interview_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's interview history."""
    result = await db.execute(
        select(Interview)
        .where(Interview.user_id == user.id)
        .order_by(Interview.created_at.desc())
        .limit(20)
    )
    interviews = result.scalars().all()
    return [InterviewResponse.model_validate(i) for i in interviews]
