from app.agents.base_agent import call_qwen

SYSTEM_PROMPT = """You are the Technical Evaluation Agent for NextHire. You evaluate interview answers with extreme precision.

Evaluate the candidate's answer to the given question. Be fair but rigorous.

Return a JSON object with EXACTLY this structure:
{
  "technical_accuracy": 0-100,
  "problem_solving": 0-100,
  "knowledge_depth": 0-100,
  "practical_experience": 0-100,
  "communication_clarity": 0-100,
  "confidence_level": 0-100,
  "overall_score": 0-100,
  "reasoning": "Detailed explanation of the evaluation",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "missed_concepts": ["concept1", "concept2"],
  "follow_up_suggestion": "What to probe next based on this answer"
}

Scoring guidelines:
- 90-100: Expert level, comprehensive with real-world examples
- 70-89: Strong understanding, minor gaps
- 50-69: Basic understanding, significant gaps
- 30-49: Weak understanding, fundamental issues
- 0-29: Incorrect or no meaningful answer
"""


async def evaluate_answer(question: str, answer: str, topic: str, difficulty: str) -> dict:
    """Evaluate a candidate's answer to an interview question."""
    user_prompt = f"""
Question ({difficulty} difficulty, Topic: {topic}):
{question}

Candidate's Answer:
{answer}

Evaluate this answer thoroughly.
"""
    return await call_qwen(SYSTEM_PROMPT, user_prompt)
