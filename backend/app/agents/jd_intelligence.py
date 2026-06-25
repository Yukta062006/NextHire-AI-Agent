from app.agents.base_agent import call_qwen

SYSTEM_PROMPT = """You are a JD Intelligence Agent for NextHire. Analyze Job Descriptions with precision.

Extract structured information from the provided job description.

Return a JSON object with EXACTLY this structure:
{
  "title": "Job Title",
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill1", "skill2"],
  "responsibilities": ["resp1", "resp2"],
  "experience_requirements": "e.g. 5+ years",
  "technology_stack": ["tech1", "tech2"],
  "seniority_level": "Junior|Mid|Senior|Staff|Principal",
  "key_competencies": ["comp1", "comp2"],
  "interview_focus_areas": ["area1", "area2"]
}
"""


async def analyze_jd(jd_text: str) -> dict:
    """Analyze a job description and extract structured requirements."""
    user_prompt = f"Analyze this job description:\n\n{jd_text}"
    return await call_qwen(SYSTEM_PROMPT, user_prompt)
