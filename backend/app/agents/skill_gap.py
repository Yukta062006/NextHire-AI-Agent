from app.agents.base_agent import call_qwen

SYSTEM_PROMPT = """You are the Skill Gap Analysis Agent for NextHire.

Compare a candidate's profile against a job description and identify gaps.

Return a JSON object with EXACTLY this structure:
{
  "match_score": 0-100,
  "matching_skills": [{"skill": "React", "candidate_level": 90, "required_level": 85, "status": "match"}],
  "missing_skills": [{"skill": "GraphQL", "importance": "high|medium|low", "learning_difficulty": "easy|medium|hard", "estimated_time": "2 weeks"}],
  "skills_to_improve": [{"skill": "AWS", "current_level": 40, "required_level": 70, "gap": 30}],
  "priority_ranking": ["skill1", "skill2"],
  "summary": "Brief gap analysis summary"
}
"""


async def analyze_skill_gap(candidate_skills: dict, jd_requirements: dict) -> dict:
    """Compare candidate skills against JD requirements."""
    user_prompt = f"""
Candidate Profile:
{candidate_skills}

Job Description Requirements:
{jd_requirements}

Analyze the skill gap between candidate and job requirements.
"""
    return await call_qwen(SYSTEM_PROMPT, user_prompt)
