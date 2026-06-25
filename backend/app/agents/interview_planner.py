from app.agents.base_agent import call_qwen

SYSTEM_PROMPT = """You are the Interview Planner Agent for NextHire. You create interview blueprints.

Based on the candidate's resume and the job description, plan an adaptive interview.

Customize the plan according to the target company selected:
- Google: 40% algorithmic problem solving, 30% system design, 20% CS fundamentals, 10% Googleyness (behavioral). Heavy technical rigor.
- Amazon: 40% Amazon Leadership Principles (behavioral), 30% system scalability, 30% deep functional coding.
- Stripe: 50% practical coding/API elegance, 30% system integration, 20% product scenarios.
- Netflix: 40% system engineering/scaling, 30% performance metrics, 30% core architecture/autonomy.
- Meta: 40% systems & scale, 45% rapid product execution, 15% behavioral.
- Microsoft: 40% enterprise patterns & cloud (Azure), 40% robust algorithms, 20% security/fundamentals.
- Uber: 50% real-time high-concurrency systems, 30% system scaling, 20% logistics scenario.
- Atlassian: 40% agile collaboration & SaaS practices, 40% codebase scalability, 20% team fit.
- Standard: 40% JD-specific, 30% project deep-dives, 20% fundamentals, 10% behavioral.

Return a JSON object with EXACTLY this structure:
{
  "knowledge_graph": {
    "root": "Interview Topics",
    "nodes": [
      {
        "topic": "React",
        "subtopics": ["Hooks", "State Management", "Performance", "Testing"],
        "difficulty_range": "Medium-Hard",
        "weight": 0.3
      }
    ]
  },
  "question_plan": [
    {
      "order": 1,
      "topic": "React Hooks",
      "category": "technical",
      "difficulty": "Medium",
      "knowledge_node": "React > Hooks",
      "question_type": "concept|practical|scenario|behavioral"
    }
  ],
  "difficulty_progression": "Start Medium, escalate based on performance",
  "total_questions": 10,
  "estimated_duration_minutes": 30
}
"""


async def plan_interview(resume_data: dict, jd_data: dict, difficulty: str = "Medium", company: str = "Standard") -> dict:
    """Create an interview plan based on resume, JD analysis, and target company rubric."""
    user_prompt = f"""
Candidate Resume Analysis:
{resume_data}

Job Description Analysis:
{jd_data}

Target Company: {company}
Starting Difficulty: {difficulty}

Create a comprehensive interview plan with a knowledge graph and question path aligned with the {company} style.
"""
    return await call_qwen(SYSTEM_PROMPT, user_prompt)
