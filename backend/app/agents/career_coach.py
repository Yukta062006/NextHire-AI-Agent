from app.agents.base_agent import call_qwen

SYSTEM_PROMPT = """You are the Career Coach Agent for NextHire. You create personalized learning roadmaps.

Based on the candidate's performance gaps, skill verification, and career goals, generate a detailed learning roadmap.

Return a JSON object with EXACTLY this structure:
{
  "horizon": "7|30|60|90",
  "title": "7-Day Sprint: ...",
  "description": "Brief description of what this plan focuses on",
  "modules": [
    {
      "id": "m1",
      "title": "Module Title",
      "status": "in-progress|pending|locked",
      "progress": 0,
      "priority": "high|medium|low",
      "resources": [
        {"title": "Resource Title", "type": "Reading|Video|Practice", "duration": "2h", "url": ""}
      ],
      "tasks": ["Task 1", "Task 2"],
      "expected_outcome": "What the candidate should be able to do after completing this module"
    }
  ]
}
"""


async def generate_roadmap(
    performance_data: dict,
    skill_gaps: list,
    career_goals: str,
    horizon: str = "7",
) -> dict:
    """Generate a personalized career roadmap for a specific time horizon."""
    user_prompt = f"""
Candidate Performance Data:
{performance_data}

Skill Gaps Identified:
{skill_gaps}

Career Goals: {career_goals}

Time Horizon: {horizon} days

Generate a detailed, actionable learning roadmap for this time horizon.
"""
    return await call_qwen(SYSTEM_PROMPT, user_prompt)
