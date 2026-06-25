"""
Interview Engine — orchestrates the full interview lifecycle.
"""
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.interview import Interview
from app.models.question import Question
from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.resume import Resume
from app.models.job_description import JobDescription
from app.agents import (
    interview_planner,
    adaptive_interview,
    technical_evaluation,
    difficulty_controller,
    hiring_manager,
    war_room,
)
from app.services.scoring_engine import calculate_nexthire_score, calculate_hire_probability, get_recommendation
from app.services.early_termination import should_terminate

COMPANY_WEIGHTS = {
    "Google": {
        "technical": 0.40,
        "knowledge_depth": 0.25,
        "communication": 0.10,
        "pressure": 0.05,
        "skill_verification": 0.10,
        "time_efficiency": 0.05,
        "confidence": 0.05
    },
    "Amazon": {
        "technical": 0.20,
        "knowledge_depth": 0.10,
        "communication": 0.15,
        "pressure": 0.20,
        "skill_verification": 0.20,
        "time_efficiency": 0.05,
        "confidence": 0.10
    },
    "Stripe": {
        "technical": 0.35,
        "knowledge_depth": 0.10,
        "communication": 0.05,
        "pressure": 0.05,
        "skill_verification": 0.30,
        "time_efficiency": 0.10,
        "confidence": 0.05
    },
    "Meta": {
        "technical": 0.35,
        "knowledge_depth": 0.15,
        "communication": 0.10,
        "pressure": 0.10,
        "skill_verification": 0.10,
        "time_efficiency": 0.15,
        "confidence": 0.05
    },
    "Netflix": {
        "technical": 0.25,
        "knowledge_depth": 0.25,
        "communication": 0.15,
        "pressure": 0.10,
        "skill_verification": 0.15,
        "time_efficiency": 0.05,
        "confidence": 0.05
    },
    "Microsoft": {
        "technical": 0.30,
        "knowledge_depth": 0.20,
        "communication": 0.15,
        "pressure": 0.05,
        "skill_verification": 0.15,
        "time_efficiency": 0.05,
        "confidence": 0.10
    },
    "Standard": {
        "technical": 0.35,
        "knowledge_depth": 0.20,
        "communication": 0.15,
        "pressure": 0.10,
        "skill_verification": 0.10,
        "time_efficiency": 0.05,
        "confidence": 0.05
    }
}



async def start_interview(
    db: AsyncSession,
    user_id: str,
    interview: Interview,
) -> dict:
    """Initialize an interview: generate knowledge graph and first question."""
    # Fetch resume and JD data
    resume_data = {}
    jd_data = {}

    if interview.resume_id:
        result = await db.execute(select(Resume).where(Resume.id == interview.resume_id))
        resume = result.scalar_one_or_none()
        if resume:
            resume_data = {
                "skills": resume.skills or [],
                "projects": resume.projects or [],
                "experience": resume.experience or [],
                "education": resume.education or [],
            }

    if interview.jd_id:
        result = await db.execute(select(JobDescription).where(JobDescription.id == interview.jd_id))
        jd = result.scalar_one_or_none()
        if jd:
            jd_data = {
                "required_skills": jd.required_skills or [],
                "preferred_skills": jd.preferred_skills or [],
                "technology_stack": jd.technology_stack or [],
                "seniority_level": jd.seniority_level or "Mid",
            }

    # Generate interview plan
    plan = await interview_planner.plan_interview(
        resume_data, 
        jd_data, 
        interview.difficulty, 
        company=interview.company or "Standard"
    )

    # Save knowledge graph
    interview.knowledge_graph = plan.get("knowledge_graph", {})
    interview.status = "active"
    interview.start_time = datetime.utcnow()
    interview.question_count = plan.get("total_questions", 10)

    # Generate first question
    first_q = await adaptive_interview.generate_question(
        knowledge_graph=interview.knowledge_graph,
        previous_qa=[],
        current_difficulty=interview.difficulty,
        performance_summary={"average_score": 0, "questions_answered": 0},
        question_index=0,
    )

    # Save question to DB
    question = Question(
        interview_id=interview.id,
        question_text=first_q.get("question_text", "Tell me about your experience."),
        difficulty=first_q.get("difficulty", interview.difficulty),
        category=first_q.get("category", "technical"),
        topic=first_q.get("topic", "General"),
        knowledge_node=first_q.get("knowledge_node", ""),
        follow_up_path=first_q.get("follow_up_path", []),
        order_index=0,
    )
    db.add(question)

    # Create evaluation record
    evaluation = Evaluation(
        interview_id=interview.id,
        user_id=user_id,
    )
    db.add(evaluation)

    await db.commit()
    await db.refresh(question)

    return {
        "interview_id": interview.id,
        "knowledge_graph": interview.knowledge_graph,
        "first_question": {
            "id": question.id,
            "question_text": question.question_text,
            "difficulty": question.difficulty,
            "category": question.category,
            "topic": question.topic,
            "knowledge_node": question.knowledge_node,
            "order_index": question.order_index,
        },
    }


async def process_answer(
    db: AsyncSession,
    interview: Interview,
    answer_text: str,
    response_time_seconds: float | None = None,
) -> dict:
    """Process an answer: evaluate, adjust difficulty, generate next question."""
    # Get current question
    result = await db.execute(
        select(Question)
        .where(Question.interview_id == interview.id)
        .where(Question.order_index == interview.current_question_index)
    )
    current_question = result.scalar_one_or_none()
    if not current_question:
        return {"error": "No current question found"}

    # Evaluate the answer
    eval_result = await technical_evaluation.evaluate_answer(
        question=current_question.question_text,
        answer=answer_text,
        topic=current_question.topic or "General",
        difficulty=current_question.difficulty,
    )

    score = eval_result.get("overall_score", 50)

    # Save answer
    answer = Answer(
        question_id=current_question.id,
        interview_id=interview.id,
        response_text=answer_text,
        response_time_seconds=response_time_seconds,
        evaluation=eval_result,
        score=score,
        reasoning=eval_result.get("reasoning", ""),
    )
    db.add(answer)

    # Get all scores so far for this interview
    scores_result = await db.execute(
        select(Answer.score).where(Answer.interview_id == interview.id)
    )
    all_scores = [s[0] for s in scores_result.all() if s[0] is not None]
    all_scores.append(score)

    avg_score = sum(all_scores) / len(all_scores) if all_scores else 50

    # Update running evaluation
    eval_record_result = await db.execute(
        select(Evaluation).where(Evaluation.interview_id == interview.id)
    )
    eval_record = eval_record_result.scalar_one_or_none()
    if eval_record:
        eval_record.technical_score = eval_result.get("technical_accuracy", avg_score)
        eval_record.communication_score = eval_result.get("communication_clarity", avg_score)
        eval_record.confidence_score = eval_result.get("confidence_level", avg_score)
        eval_record.knowledge_depth_score = eval_result.get("knowledge_depth", avg_score)
        eval_record.pressure_score = max(100 - (response_time_seconds or 30) * 1.5, 30) if response_time_seconds else 70
        eval_record.time_efficiency_score = min(100, max(0, 100 - ((response_time_seconds or 30) - 15) * 2)) if response_time_seconds else 70
        eval_record.skill_verification_score = eval_result.get("practical_experience", avg_score)

        # Get custom company evaluation weights or use standard ones
        weights = COMPANY_WEIGHTS.get(interview.company or "Standard", COMPANY_WEIGHTS["Standard"])
        nexthire = (
            eval_record.technical_score * weights["technical"]
            + eval_record.knowledge_depth_score * weights["knowledge_depth"]
            + eval_record.communication_score * weights["communication"]
            + eval_record.pressure_score * weights["pressure"]
            + eval_record.skill_verification_score * weights["skill_verification"]
            + eval_record.time_efficiency_score * weights["time_efficiency"]
            + eval_record.confidence_score * weights["confidence"]
        )
        nexthire = round(min(max(nexthire, 0), 100), 1)
        eval_record.nexthire_score = nexthire
        eval_record.hire_probability = calculate_hire_probability(nexthire)
        eval_record.recommendation = get_recommendation(nexthire)

    # Check early termination
    terminate, reason = should_terminate(all_scores, avg_score)
    if terminate:
        interview.status = "terminated"
        interview.termination_reason = reason
        interview.end_time = datetime.utcnow()
        if eval_record:
            # Generate same metrics even for early termination to avoid DB null issues
            prev_qa_result = await db.execute(
                select(Question, Answer)
                .join(Answer, Answer.question_id == Question.id)
                .where(Question.interview_id == interview.id)
                .order_by(Question.order_index)
            )
            history_qa = [
                {"question": q.question_text, "answer": a.response_text, "score": a.score}
                for q, a in prev_qa_result.all()
            ]
            history_qa.append({"question": current_question.question_text, "answer": answer_text, "score": score})
            
            overall_metrics = {
                "technical_score": eval_record.technical_score,
                "communication_score": eval_record.communication_score,
                "confidence_score": eval_record.confidence_score,
                "pressure_score": eval_record.pressure_score,
                "knowledge_depth_score": eval_record.knowledge_depth_score,
                "skill_verification_score": eval_record.skill_verification_score,
                "nexthire_score": eval_record.nexthire_score,
                "recommendation": eval_record.recommendation,
                "company": interview.company or "Standard"
            }
            war_room_eval = await war_room.evaluate_war_room(history_qa, overall_metrics)
            
            pass_prob = round(min(max(eval_record.nexthire_score * 0.9, 0), 99), 1)
            offer_prob = round(min(max(eval_record.nexthire_score * 0.8, 0), 99), 1)
            success_90 = round(min(max(eval_record.nexthire_score * 0.85, 0), 100), 1)
            retention = round(min(max(70, 0), 100), 1)
            
            predictions = {
                "interview_pass_probability": pass_prob,
                "offer_probability": offer_prob,
                "success_90_day": success_90,
                "retention_probability": retention,
                "leadership_potential": "Low",
                "promotion_potential": "Low",
                "learning_velocity": "Low",
            }
            
            benchmarks = {
                "technical_rank": round(max(100 - eval_record.technical_score * 0.8, 1), 1),
                "communication_rank": round(max(100 - eval_record.communication_score * 0.8, 1), 1),
                "system_design_rank": round(max(100 - eval_record.knowledge_depth_score * 0.8, 1), 1),
                "problem_solving_rank": round(max(100 - eval_record.skill_verification_score * 0.8, 1), 1),
            }
            
            risks_list = [{
                "category": "Early Termination",
                "level": "High",
                "details": f"Interview terminated early due to low average score: {reason}"
            }]
            
            learning_trend = [
                {"month": "Month 1", "score": round(eval_record.nexthire_score * 0.6, 1)},
                {"month": "Month 2", "score": round(eval_record.nexthire_score * 0.8, 1)},
                {"month": "Month 3", "score": round(eval_record.nexthire_score, 1)},
            ]
            velocity_engine = {
                "trend": learning_trend,
                "growth_rate": round(eval_record.nexthire_score * 0.1, 1),
                "level": "Low"
            }
            
            eval_record.war_room = war_room_eval
            eval_record.predictions = predictions
            eval_record.benchmarks = benchmarks
            eval_record.risks = {
                "risk_level": "Red",
                "warnings": [r["details"] for r in risks_list],
                "risks_list": risks_list
            }
            eval_record.learning_velocity = velocity_engine
            eval_record.company_context = {
                "company": interview.company or "Standard",
                "difficulty": interview.difficulty,
                "weightages": COMPANY_WEIGHTS.get(interview.company or "Standard", COMPANY_WEIGHTS["Standard"])
            }
            
            eval_record.detailed_breakdown = {
                "hiring_verdict": {"recommendation": eval_record.recommendation, "hire_probability": eval_record.hire_probability, "reasoning": reason},
                "war_room": war_room_eval,
                "predictions": predictions,
                "benchmarks": benchmarks,
                "risks": risks_list,
                "learning_velocity": velocity_engine,
                "company_context": eval_record.company_context
            }

        await db.commit()
        return {
            "answer_id": answer.id,
            "score": score,
            "evaluation": eval_result,
            "reasoning": eval_result.get("reasoning", ""),
            "interview_terminated": True,
            "termination_reason": reason,
            "updated_metrics": _build_metrics(eval_record) if eval_record else {},
        }

    # Check if interview should end naturally
    interview.current_question_index += 1
    if interview.current_question_index >= interview.question_count:
        interview.status = "completed"
        interview.end_time = datetime.utcnow()

        # Get final hiring decision
        if eval_record:
            # 1. Fetch previous Q&As for war room context
            prev_qa_result = await db.execute(
                select(Question, Answer)
                .join(Answer, Answer.question_id == Question.id)
                .where(Question.interview_id == interview.id)
                .order_by(Question.order_index)
            )
            history_qa = [
                {"question": q.question_text, "answer": a.response_text, "score": a.score}
                for q, a in prev_qa_result.all()
            ]
            history_qa.append({"question": current_question.question_text, "answer": answer_text, "score": score})
            
            # 2. Call War Room
            overall_metrics = {
                "technical_score": eval_record.technical_score,
                "communication_score": eval_record.communication_score,
                "confidence_score": eval_record.confidence_score,
                "pressure_score": eval_record.pressure_score,
                "knowledge_depth_score": eval_record.knowledge_depth_score,
                "skill_verification_score": eval_record.skill_verification_score,
                "nexthire_score": eval_record.nexthire_score,
                "recommendation": eval_record.recommendation,
                "company": interview.company or "Standard"
            }
            war_room_eval = await war_room.evaluate_war_room(history_qa, overall_metrics)
            
            # 3. Calculate Success Predictions
            pass_prob = round(min(max(eval_record.nexthire_score * 1.05 if eval_record.nexthire_score >= 80 else eval_record.nexthire_score * 0.95, 0), 99), 1)
            offer_prob = round(min(max(eval_record.nexthire_score * 1.08 if eval_record.nexthire_score >= 85 else eval_record.nexthire_score * 0.9, 0), 99), 1)
            success_90 = round(min(max(eval_record.nexthire_score * 0.92, 0), 100), 1)
            retention = round(min(max(80 + (eval_record.nexthire_score - 70) * 0.5 if eval_record.nexthire_score >= 70 else 80 - (70 - eval_record.nexthire_score) * 0.8, 0), 100), 1)
            
            predictions = {
                "interview_pass_probability": pass_prob,
                "offer_probability": offer_prob,
                "success_90_day": success_90,
                "retention_probability": retention,
                "leadership_potential": "High" if eval_record.nexthire_score >= 85 else "Medium" if eval_record.nexthire_score >= 70 else "Low",
                "promotion_potential": "High" if eval_record.nexthire_score >= 87 else "Medium" if eval_record.nexthire_score >= 73 else "Low",
                "learning_velocity": "High" if eval_record.nexthire_score >= 82 else "Medium" if eval_record.nexthire_score >= 68 else "Low",
            }
            
            # 4. Calculate Benchmarks (percentiles)
            benchmarks = {
                "technical_rank": round(max(100 - eval_record.technical_score * 0.9, 1), 1),
                "communication_rank": round(max(100 - eval_record.communication_score * 0.95, 1), 1),
                "system_design_rank": round(max(100 - eval_record.knowledge_depth_score * 0.85, 1), 1),
                "problem_solving_rank": round(max(100 - eval_record.skill_verification_score * 0.88, 1), 1),
            }
            
            # 5. Calculate Hiring Risks
            risks_list = []
            if eval_record.skill_verification_score < 70:
                risks_list.append({
                    "category": "Skill Inflation Risk",
                    "level": "Moderate",
                    "details": f"Candidate's verified skill performance ({round(eval_record.skill_verification_score, 1)}%) shows gaps compared to typical senior depth expectations."
                })
            if eval_record.communication_score < 70:
                risks_list.append({
                    "category": "Communication Risk",
                    "level": "Moderate",
                    "details": "Expression was slightly slow or overly brief during core architectural breakdowns."
                })
            if eval_record.pressure_score < 70:
                risks_list.append({
                    "category": "Execution Risk",
                    "level": "Moderate",
                    "details": "Response time indicators suggest potential fatigue or slower response under intense questioning."
                })
            if not risks_list:
                risks_list.append({
                    "category": "None",
                    "level": "Low",
                    "details": "No significant recruiter concerns or skill anomalies detected."
                })
                
            # 6. Calculate Learning Velocity Trend
            learning_trend = [
                {"month": "Month 1", "score": round(eval_record.nexthire_score * 0.8, 1)},
                {"month": "Month 2", "score": round(eval_record.nexthire_score * 0.9, 1)},
                {"month": "Month 3", "score": round(eval_record.nexthire_score, 1)},
            ]
            velocity_engine = {
                "trend": learning_trend,
                "growth_rate": round(eval_record.nexthire_score * 0.2, 1),
                "level": "High" if eval_record.nexthire_score >= 80 else "Medium" if eval_record.nexthire_score >= 60 else "Low"
            }
            
            # 7. Call standard hiring manager agent
            hiring_decision = await hiring_manager.make_hiring_decision({
                "technical_score": eval_record.technical_score,
                "communication_score": eval_record.communication_score,
                "confidence_score": eval_record.confidence_score,
                "pressure_score": eval_record.pressure_score,
                "knowledge_depth_score": eval_record.knowledge_depth_score,
                "skill_verification_score": eval_record.skill_verification_score,
                "nexthire_score": eval_record.nexthire_score,
                "total_questions": interview.question_count,
                "average_score": avg_score,
                "company": interview.company or "Standard"
            })
            
            eval_record.recommendation = hiring_decision.get("recommendation", eval_record.recommendation)
            eval_record.hire_probability = hiring_decision.get("hire_probability", eval_record.hire_probability)
            
            eval_record.war_room = war_room_eval
            eval_record.predictions = predictions
            eval_record.benchmarks = benchmarks
            eval_record.risks = {
                "risk_level": "Amber" if any(r["level"] == "Moderate" for r in risks_list) else "Low",
                "warnings": [r["details"] for r in risks_list],
                "risks_list": risks_list
            }
            eval_record.learning_velocity = velocity_engine
            eval_record.company_context = {
                "company": interview.company or "Standard",
                "difficulty": interview.difficulty,
                "weightages": COMPANY_WEIGHTS.get(interview.company or "Standard", COMPANY_WEIGHTS["Standard"])
            }
            
            eval_record.detailed_breakdown = {
                "hiring_verdict": hiring_decision,
                "war_room": war_room_eval,
                "predictions": predictions,
                "benchmarks": benchmarks,
                "risks": risks_list,
                "learning_velocity": velocity_engine,
                "company_context": eval_record.company_context
            }

        await db.commit()
        return {
            "answer_id": answer.id,
            "score": score,
            "evaluation": eval_result,
            "reasoning": eval_result.get("reasoning", ""),
            "interview_terminated": False,
            "interview_completed": True,
            "updated_metrics": _build_metrics(eval_record) if eval_record else {},
            "final_report": eval_record.detailed_breakdown if eval_record else {},
        }

    # Adjust difficulty
    recent_scores = all_scores[-3:] if len(all_scores) >= 3 else all_scores
    diff_result = await difficulty_controller.adjust_difficulty(interview.difficulty, recent_scores)
    new_difficulty = diff_result.get("new_difficulty", interview.difficulty)
    difficulty_changed = diff_result.get("changed", False)
    if difficulty_changed:
        interview.difficulty = new_difficulty

    # Build previous Q&A for context
    prev_qa_result = await db.execute(
        select(Question, Answer)
        .join(Answer, Answer.question_id == Question.id)
        .where(Question.interview_id == interview.id)
        .order_by(Question.order_index)
    )
    previous_qa = [
        {"question": q.question_text, "answer": a.response_text, "score": a.score}
        for q, a in prev_qa_result.all()
    ]

    # Generate next question
    next_q_data = await adaptive_interview.generate_question(
        knowledge_graph=interview.knowledge_graph or {},
        previous_qa=previous_qa,
        current_difficulty=interview.difficulty,
        performance_summary={
            "average_score": avg_score, 
            "questions_answered": len(all_scores),
            "last_answer_score": score,
            "last_answer_rating": "strong" if score >= 85 else "average" if score >= 60 else "weak",
            "navigation_rule": "Go deeper/harder on same topic" if score >= 85 else "Move sideways within parallel concepts" if score >= 60 else "Pivot to fundamentals / basic concepts"
        },
        question_index=interview.current_question_index,
    )

    next_question = Question(
        interview_id=interview.id,
        question_text=next_q_data.get("question_text", "Tell me more about your experience."),
        difficulty=next_q_data.get("difficulty", interview.difficulty),
        category=next_q_data.get("category", "technical"),
        topic=next_q_data.get("topic", "General"),
        knowledge_node=next_q_data.get("knowledge_node", ""),
        follow_up_path=next_q_data.get("follow_up_path", []),
        order_index=interview.current_question_index,
    )
    db.add(next_question)
    await db.commit()
    await db.refresh(next_question)

    return {
        "answer_id": answer.id,
        "score": score,
        "evaluation": eval_result,
        "reasoning": eval_result.get("reasoning", ""),
        "next_question": {
            "id": next_question.id,
            "question_text": next_question.question_text,
            "difficulty": next_question.difficulty,
            "category": next_question.category,
            "topic": next_question.topic,
            "knowledge_node": next_question.knowledge_node,
            "order_index": next_question.order_index,
        },
        "updated_metrics": _build_metrics(eval_record) if eval_record else {},
        "difficulty_changed": new_difficulty if difficulty_changed else None,
        "interview_terminated": False,
    }


def _build_metrics(eval_record: Evaluation) -> dict:
    """Build a metrics dict for the frontend."""
    return {
        "technical_score": round(eval_record.technical_score, 1),
        "communication_score": round(eval_record.communication_score, 1),
        "confidence_score": round(eval_record.confidence_score, 1),
        "pressure_score": round(eval_record.pressure_score, 1),
        "knowledge_depth_score": round(eval_record.knowledge_depth_score, 1),
        "time_efficiency_score": round(eval_record.time_efficiency_score, 1),
        "skill_verification_score": round(eval_record.skill_verification_score, 1),
        "nexthire_score": round(eval_record.nexthire_score, 1),
        "hire_probability": round(eval_record.hire_probability, 1),
        "recommendation": eval_record.recommendation,
        "company_context": eval_record.company_context,
        "war_room": eval_record.war_room,
        "predictions": eval_record.predictions,
        "risks": eval_record.risks,
        "benchmarks": eval_record.benchmarks,
        "learning_velocity": eval_record.learning_velocity,
    }
