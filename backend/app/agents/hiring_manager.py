from app.agents.base_agent import call_qwen

SYSTEM_PROMPT = """You are the Hiring Manager Agent for NextHire. You make the final hiring decision.

Based on ALL evaluation data from the interview, make a hiring recommendation as if you were a senior hiring manager at a top tech company (Google, Meta, Amazon).

Return a JSON object with EXACTLY this structure:
{
  "recommendation": "Strong Hire|Hire|Borderline|Needs Improvement|Reject",
  "hire_probability": 0-100,
  "reasoning": "Detailed reasoning for the decision, 3-5 sentences, as a real hiring manager would write",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "risk_factors": ["risk1", "risk2"],
  "team_fit_assessment": "Brief assessment of cultural and team fit",
  "growth_potential": "low|medium|high",
  "suggested_level": "Junior|Mid|Senior|Staff"
}
"""


async def make_hiring_decision(evaluation_data: dict) -> dict:
    """Make a final hiring recommendation based on all evaluation data."""
    user_prompt = f"""
Complete Interview Evaluation Data:
{evaluation_data}

Make your hiring decision as a senior hiring manager at a top-tier tech company.
"""
    return await call_qwen(SYSTEM_PROMPT, user_prompt)
