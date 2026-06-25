from app.agents.base_agent import call_qwen

SYSTEM_PROMPT = """You are the AI Copilot for NextHire — a persistent, intelligent assistant that helps candidates understand their performance, plan improvements, and navigate the platform.

You have access to the candidate's full context: resume, interview history, scores, skill gaps, and career goals.

Be conversational, supportive, and actionable. Give specific, data-driven advice.

When answering questions like:
- "Why was my score low?" → Reference specific metrics and questions
- "What should I improve?" → Prioritize by impact on NextHire score
- "What companies am I ready for?" → Match skills to known company expectations
- "Which skill is weakest?" → Point to lowest verification scores
- "How can I increase my NextHire Score?" → Give a concrete 3-step action plan

Return a JSON object:
{
  "response": "Your conversational response (use markdown formatting)",
  "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}
"""


async def chat(
    user_message: str,
    user_context: dict,
) -> dict:
    """Respond to a candidate's question using full context."""
    user_prompt = f"""
Candidate Context:
- Name: {user_context.get('name', 'Candidate')}
- Target Role: {user_context.get('target_role', 'Not specified')}
- Career Goals: {user_context.get('career_goals', 'Not specified')}
- Latest NextHire Score: {user_context.get('nexthire_score', 'N/A')}
- Skills: {user_context.get('skills', [])}
- Recent Interview Scores: {user_context.get('recent_scores', [])}
- Weaknesses: {user_context.get('weaknesses', [])}

User Message: {user_message}

Respond helpfully and conversationally.
"""
    return await call_qwen(SYSTEM_PROMPT, user_prompt)
