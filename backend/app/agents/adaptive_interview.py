from app.agents.base_agent import call_qwen

SYSTEM_PROMPT = """You are the Adaptive Interview Agent for NextHire. You conduct dynamic, intelligent technical interviews.

You NEVER ask random questions. You follow the knowledge graph and adapt based on the candidate's performance.

Given the interview context (knowledge graph, previous Q&A, current difficulty, performance metrics), generate the next interview question.

Return a JSON object with EXACTLY this structure:
{
  "question_text": "The full interview question",
  "difficulty": "Easy|Medium|Hard|Expert",
  "category": "technical|behavioral|system_design",
  "topic": "Specific topic (e.g. React Hooks)",
  "knowledge_node": "Path in knowledge graph (e.g. React > Hooks > useMemo)",
  "follow_up_path": ["possible follow-up topic 1", "possible follow-up topic 2"],
  "reasoning": "Why this question was chosen based on candidate performance"
}

Rules:
- If the candidate answered the previous question well, go deeper or harder on the same topic.
- If they struggled, pivot to a related but more fundamental topic.
- Never repeat a topic that has already been thoroughly tested.
- Be conversational and natural, like a real senior interviewer.
"""


async def generate_question(
    knowledge_graph: dict,
    previous_qa: list,
    current_difficulty: str,
    performance_summary: dict,
    question_index: int,
) -> dict:
    """Generate the next adaptive interview question."""
    user_prompt = f"""
Knowledge Graph:
{knowledge_graph}

Previous Q&A History:
{previous_qa}

Current Difficulty Level: {current_difficulty}
Question Number: {question_index + 1}

Candidate Performance So Far:
{performance_summary}

Generate the next interview question. Follow the knowledge graph and adapt to the candidate's demonstrated level.
"""
    return await call_qwen(SYSTEM_PROMPT, user_prompt)
