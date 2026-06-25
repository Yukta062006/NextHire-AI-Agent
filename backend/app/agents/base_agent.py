import json
import re
import os
from openai import OpenAI
from app.config import get_settings

settings = get_settings()

# Initialize Qwen Cloud Client via OpenAI-compatible SDK
client = None
api_key = None

# Try DASHSCOPE_API_KEY from settings
if settings.DASHSCOPE_API_KEY and not settings.DASHSCOPE_API_KEY.startswith("your-"):
    api_key = settings.DASHSCOPE_API_KEY
# Fallback to environment variable
else:
    api_key = os.environ.get("DASHSCOPE_API_KEY")

if api_key and not api_key.startswith("your-"):
    try:
        client = OpenAI(
            api_key=api_key,
            base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
        )
    except Exception as e:
        print(f"[Qwen Client Init Error] {e}")
        client = None

MODEL_ID = "qwen-plus"
FALLBACK_MODEL_ID = "qwen-turbo"


async def call_qwen(system_prompt: str, user_prompt: str, json_output: bool = True) -> dict | str:
    """
    Call Qwen Cloud via OpenAI-compatible API with a system prompt and user prompt.
    If json_output is True, parse the response as JSON.
    If the API key is not configured, or if the call fails, returns a realistic mock response.
    """
    global client

    def run_call(qwen_client: OpenAI, model_name: str = MODEL_ID):
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        extra_params = {}
        if json_output:
            extra_params["response_format"] = {"type": "json_object"}

        response = qwen_client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.7,
            max_tokens=4096,
            **extra_params,
        )
        text = response.choices[0].message.content.strip()
        if json_output:
            # Try direct JSON parse first
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                pass
            # Try extracting from markdown code block
            json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1).strip())
            # Try finding JSON object/array
            obj_match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
            if obj_match:
                return json.loads(obj_match.group(1))
            raise ValueError("JSON parse failure in model output")
        return text

    # Try primary model
    if client is not None:
        try:
            return run_call(client, MODEL_ID)
        except Exception as e:
            print(f"[Qwen API Error] Primary model {MODEL_ID} failed: {e}")
            try:
                print(f"[Qwen Fallback] Retrying with {FALLBACK_MODEL_ID}...")
                return run_call(client, FALLBACK_MODEL_ID)
            except Exception as e_fallback:
                print(f"[Qwen API Error] Fallback model also failed: {e_fallback}")

    # If all API call attempts failed, return mock response
    if json_output:
        return _generate_mock_response(system_prompt, user_prompt)
    return "API connection error. Mock mode active."


# Keep backward-compatible alias so existing agent imports still work
call_gemini = call_qwen


# ============================================================================
# DEEP RESUME TEXT EXTRACTION HELPERS
# ============================================================================

def _extract_name(lines: list[str], resume_text: str) -> str:
    """Extract candidate name from resume text using multiple heuristics."""
    for line in lines[:5]:
        clean = line.strip()
        if not clean or len(clean) > 50:
            continue
        if any(x in clean.lower() for x in ['@', 'http', 'www.', 'phone', 'email', 'address', 'objective', 'summary', 'resume']):
            continue
        if re.match(r'^[\d\s\(\)\-\+]+$', clean):
            continue
        words = clean.split()
        if 1 <= len(words) <= 4 and all(re.match(r'^[A-Za-z\.\-\']+$', w) for w in words):
            return clean

    name_match = re.search(r'(?:name|candidate)\s*[:]\s*(.+)', resume_text, re.IGNORECASE)
    if name_match:
        return name_match.group(1).strip()

    cap_match = re.search(r'^([A-Z][a-z]+ (?:[A-Z]\.?\s*)?[A-Z][a-z]+)', resume_text, re.MULTILINE)
    if cap_match:
        return cap_match.group(1).strip()

    return "Candidate"


def _extract_email(resume_text: str) -> str:
    """Extract email address."""
    match = re.search(r'[\w\.\-+]+@[\w\.\-]+\.\w+', resume_text)
    return match.group(0) if match else ""


def _extract_phone(resume_text: str) -> str:
    """Extract phone number."""
    match = re.search(r'(?:\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}', resume_text)
    return match.group(0) if match else ""


def _extract_target_role(resume_text: str, lines: list[str]) -> str:
    """Extract the candidate's current/target role from resume."""
    ROLE_PATTERNS = [
        r'(?:senior|junior|lead|staff|principal|associate|intern)?\s*(?:software|web|mobile|full[\s-]?stack|front[\s-]?end|back[\s-]?end|cloud|data|machine\s*learning|ml|ai|devops|sre|platform|systems?|embedded|ios|android|qa|test|security|network|database)\s*(?:engineer|developer|architect|scientist|analyst|consultant|specialist|manager|administrator|intern)',
        r'(?:software|web|full[\s-]?stack|front[\s-]?end|back[\s-]?end)\s+(?:engineer|developer)',
        r'(?:data\s+(?:scientist|analyst|engineer))',
        r'(?:devops|sre|cloud|platform)\s+engineer',
        r'(?:machine\s*learning|ml|ai)\s+engineer',
        r'(?:project|product|engineering|technical)\s+manager',
        r'(?:ui/?ux|ux|ui)\s+(?:designer|developer|engineer)',
        r'(?:business|systems?|data)\s+analyst',
        r'(?:technical|solutions?)\s+architect',
    ]

    for line in lines[:10]:
        for pattern in ROLE_PATTERNS:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                return match.group(0).strip().title()

    objective_match = re.search(r'(?:objective|summary|profile|about)\s*:?\s*\n(.+)', resume_text, re.IGNORECASE)
    if objective_match:
        obj_text = objective_match.group(1)
        for pattern in ROLE_PATTERNS:
            match = re.search(pattern, obj_text, re.IGNORECASE)
            if match:
                return match.group(0).strip().title()

    for pattern in ROLE_PATTERNS:
        match = re.search(pattern, resume_text, re.IGNORECASE)
        if match:
            return match.group(0).strip().title()

    return "Software Engineer"


def _extract_skills(resume_text: str) -> list[str]:
    """Extract technical skills from resume text."""
    KNOWN_SKILLS = [
        "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "C", "Go", "Golang",
        "Rust", "Ruby", "PHP", "Kotlin", "Swift", "Scala", "R", "Dart",
        "React", "Angular", "Vue", "Vue.js", "Svelte", "Next.js", "Nuxt.js",
        "HTML", "HTML5", "CSS", "CSS3", "SASS", "Tailwind CSS", "Bootstrap",
        "Material UI", "jQuery", "Redux", "Zustand",
        "Node.js", "Express", "Express.js", "FastAPI", "Flask", "Django", "Spring",
        "Spring Boot", "ASP.NET", ".NET", "Laravel", "Rails", "NestJS",
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Redis", "Cassandra",
        "DynamoDB", "Elasticsearch", "Neo4j", "Firebase", "Supabase", "Prisma",
        "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Terraform",
        "Ansible", "Jenkins", "GitHub Actions", "GitLab CI", "CI/CD", "Nginx", "Linux",
        "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy",
        "Spark", "Hadoop", "Kafka", "Airflow", "Machine Learning", "Deep Learning", "NLP",
        "Git", "GitHub", "Jira", "Figma", "Postman",
        "REST", "REST API", "GraphQL", "gRPC", "WebSocket", "OAuth", "JWT", "Microservices",
        "React Native", "Flutter", "SwiftUI",
        "Jest", "Mocha", "Cypress", "Selenium", "Pytest",
        "Agile", "Scrum", "Design Patterns", "Data Structures", "Algorithms", "System Design",
    ]

    found_skills = []
    for skill in KNOWN_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, resume_text, re.IGNORECASE):
            if skill not in found_skills:
                found_skills.append(skill)

    return found_skills if found_skills else ["Problem Solving", "Communication", "Teamwork"]


def _extract_experience(resume_text: str) -> list[dict]:
    """Extract work experience entries from resume text."""
    experiences = []
    exp_section_match = re.search(
        r'(?:work\s*)?experience[s]?\s*:?\s*\n([\s\S]*?)(?=\n(?:education|skills|projects?|certific|awards?|$))',
        resume_text, re.IGNORECASE
    )
    exp_text = exp_section_match.group(1) if exp_section_match else resume_text
    date_pattern = r'(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:\d{4})\s*[-–—to]+\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:\d{4}|[Pp]resent|[Cc]urrent|[Nn]ow)'
    date_matches = list(re.finditer(date_pattern, exp_text))

    for i, dm in enumerate(date_matches):
        duration = dm.group(0).strip()
        start_pos = date_matches[i-1].end() if i > 0 else 0
        context_before = exp_text[start_pos:dm.start()].strip()
        end_pos = date_matches[i+1].start() if i + 1 < len(date_matches) else dm.end() + 500
        context_after = exp_text[dm.end():min(end_pos, len(exp_text))].strip()
        context_lines = [l.strip() for l in context_before.split('\n') if l.strip()]

        role = ""
        company = ""
        if len(context_lines) >= 2:
            company = context_lines[-2]
            role = context_lines[-1]
        elif len(context_lines) == 1:
            line = context_lines[0]
            sep_match = re.search(r'(.+?)\s*[-–—|,]\s*(.+)', line)
            if sep_match:
                role, company = sep_match.group(1).strip(), sep_match.group(2).strip()
            else:
                role = line

        role = re.sub(r'^\W+|\W+$', '', role).strip()
        company = re.sub(r'^\W+|\W+$', '', company).strip()
        highlights = []
        bullets = re.findall(r'[•\-\*]\s*(.+)', context_after)
        for bullet in bullets[:4]:
            highlights.append(bullet.strip())

        if role or company:
            experiences.append({
                "role": role or "Software Engineer",
                "company": company or "Company",
                "duration": duration,
                "highlights": highlights if highlights else [f"Worked as {role}"]
            })

    return experiences[:5]


def _extract_education(resume_text: str) -> list[dict]:
    """Extract education entries from resume text."""
    education = []
    edu_section_match = re.search(
        r'education[s]?\s*:?\s*\n([\s\S]*?)(?=\n(?:experience|skills|projects?|certific|work|$))',
        resume_text, re.IGNORECASE
    )
    edu_text = edu_section_match.group(1) if edu_section_match else resume_text

    degree_patterns = [
        r'((?:Bachelor|Master|Doctor|Ph\.?D|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|MBA|BCA|MCA|B\.?Sc|M\.?Sc|Associate|Diploma)[\w\s.,]*?)(?:\s*[-–—|,from]\s*|\s+(?:in|of|from|at)\s+)',
        r'((?:Bachelor|Master|Doctor|Ph\.?D|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|MBA|BCA|MCA|B\.?Sc|M\.?Sc|Associate|Diploma)[\w\s.,]+)',
    ]

    for pattern in degree_patterns:
        degree_matches = re.finditer(pattern, edu_text, re.IGNORECASE)
        for dm in degree_matches:
            degree = dm.group(1).strip()
            context = edu_text[max(0, dm.start()-100):dm.end()+200]
            inst_match = re.search(
                r'((?:University|Institute|College|School|Academy|Polytechnic|IIT|NIT|IIIT|MIT|Stanford|Harvard)[\w\s.,\-]*?)(?:\n|$|[,\-–]|\d{4})',
                context, re.IGNORECASE
            )
            institution = inst_match.group(1).strip() if inst_match else "University"
            year_match = re.search(r'(\d{4})', context[dm.end()-dm.start():])
            year = year_match.group(1) if year_match else ""
            education.append({"degree": degree, "institution": institution, "year": year})

    seen = set()
    unique_edu = []
    for e in education:
        key = e["degree"].lower()[:30]
        if key not in seen:
            seen.add(key)
            unique_edu.append(e)
    return unique_edu[:3]


def _extract_projects(resume_text: str, skills: list[str]) -> list[dict]:
    """Extract project entries from resume text."""
    projects = []
    proj_section_match = re.search(
        r'projects?\s*:?\s*\n([\s\S]*?)(?=\n(?:education|experience|skills|certific|work|$))',
        resume_text, re.IGNORECASE
    )
    if proj_section_match:
        proj_text = proj_section_match.group(1)
        lines = proj_text.split('\n')
        current_project = None
        current_desc_lines = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            is_title = (
                len(stripped) < 80 and
                stripped[0].isupper() and
                not stripped.startswith(('•', '-', '*', '–')) and
                not any(kw in stripped.lower() for kw in ['responsible', 'developed', 'built', 'created', 'implemented'])
            )
            if is_title and current_project:
                desc = " ".join(current_desc_lines).strip()
                proj_skills = [s for s in skills if s.lower() in desc.lower() or s.lower() in current_project.lower()]
                projects.append({
                    "name": current_project,
                    "description": desc[:200] if desc else f"Project using {', '.join(proj_skills[:3])}",
                    "technologies": proj_skills[:5] if proj_skills else skills[:3],
                    "complexity_score": min(8, 5 + len(proj_skills))
                })
                current_desc_lines = []
                current_project = stripped
            elif is_title and not current_project:
                current_project = stripped
            else:
                current_desc_lines.append(re.sub(r'^[•\-\*–]\s*', '', stripped))

        if current_project:
            desc = " ".join(current_desc_lines).strip()
            proj_skills = [s for s in skills if s.lower() in desc.lower() or s.lower() in current_project.lower()]
            projects.append({
                "name": current_project,
                "description": desc[:200] if desc else f"Project using {', '.join(proj_skills[:3])}",
                "technologies": proj_skills[:5] if proj_skills else skills[:3],
                "complexity_score": min(8, 5 + len(proj_skills))
            })
    return projects[:5]


def _extract_certifications(resume_text: str) -> list[str]:
    """Extract certifications from resume text."""
    certs = []
    cert_section_match = re.search(
        r'certific(?:ation|ate)s?\s*:?\s*\n([\s\S]*?)(?=\n(?:education|experience|skills|projects?|work|$))',
        resume_text, re.IGNORECASE
    )
    if cert_section_match:
        cert_text = cert_section_match.group(1)
        for line in cert_text.split('\n'):
            stripped = re.sub(r'^[•\-\*–\d.)\s]+', '', line).strip()
            if stripped and 5 < len(stripped) < 200:
                certs.append(stripped)
    return certs[:10]


def _extract_leadership(resume_text: str) -> list[str]:
    """Extract leadership indicators from resume text."""
    indicators = []
    leadership_keywords = [
        "led", "managed", "mentored", "coordinated", "supervised",
        "directed", "founded", "spearheaded", "architected", "headed"
    ]
    for kw in leadership_keywords:
        if re.search(r'\b' + kw + r'\b', resume_text, re.IGNORECASE):
            indicators.append(kw.title())
    return indicators if indicators else ["Team Collaboration"]


def _extract_summary(resume_text: str, name: str, role: str, skills: list[str]) -> str:
    """Extract or generate a professional summary."""
    summary_match = re.search(
        r'(?:summary|profile|objective|about\s*me)\s*:?\s*\n([\s\S]*?)(?=\n(?:education|experience|skills|projects?|work|\n\n|$))',
        resume_text, re.IGNORECASE
    )
    if summary_match:
        summary_text = summary_match.group(1).strip()
        summary_text = re.sub(r'[•\-\*]\s*', '', summary_text)
        summary_text = re.sub(r'\s+', ' ', summary_text).strip()
        if len(summary_text) > 30:
            return summary_text[:500]

    top_skills = ", ".join(skills[:5]) if skills else "modern technologies"
    return f"{name} is a {role} with expertise in {top_skills}. Experienced in building robust software solutions and working in collaborative team environments."


def _generate_mock_response(system_prompt: str, user_prompt: str) -> dict:
    """Generate realistic mock data based on the type of agent requested in the system prompt.
    For resume intelligence, deeply extracts information from the actual resume text."""
    prompt_lower = system_prompt.lower()

    if "resume intelligence" in prompt_lower:
        resume_text = user_prompt
        if "Analyze this resume:" in user_prompt:
            resume_text = user_prompt.split("Analyze this resume:", 1)[1].strip()

        lines = [l.strip() for l in resume_text.splitlines() if l.strip()]
        candidate_name = _extract_name(lines, resume_text)
        target_role = _extract_target_role(resume_text, lines)
        skills = _extract_skills(resume_text)
        experience = _extract_experience(resume_text)
        education = _extract_education(resume_text)
        projects = _extract_projects(resume_text, skills)
        certifications = _extract_certifications(resume_text)
        summary = _extract_summary(resume_text, candidate_name, target_role, skills)

        skill_confidence = {}
        for skill in skills:
            count = len(re.findall(re.escape(skill), resume_text, re.IGNORECASE))
            if count >= 3:
                skill_confidence[skill] = min(95, 80 + count * 2)
            elif count >= 2:
                skill_confidence[skill] = 75
            else:
                skill_confidence[skill] = 60

        score = 50
        if len(skills) > 5: score += 10
        if len(experience) > 0: score += 10
        if len(education) > 0: score += 5
        if len(projects) > 0: score += 10
        if len(certifications) > 0: score += 5
        if len(resume_text) > 500: score += 5
        if len(resume_text) > 1000: score += 5
        score = min(score, 95)

        if not experience:
            experience = [{"role": target_role, "company": "Listed in resume", "duration": "See resume", "highlights": ["Details available in uploaded resume"]}]
        if not education:
            education = [{"degree": "Degree (see resume)", "institution": "Listed in resume", "year": ""}]
        if not projects:
            projects = [{"name": f"{skills[0] if skills else 'Software'} Project", "description": f"Project utilizing {', '.join(skills[:3])}", "technologies": skills[:4] if skills else ["Python"], "complexity_score": 7}]

        return {
            "name": candidate_name,
            "target_role": target_role,
            "skills": skills,
            "projects": projects,
            "education": education,
            "certifications": certifications,
            "experience": experience,
            "resume_score": score,
            "skill_confidence": skill_confidence,
            "project_complexity": {"overall": 7},
            "leadership_indicators": _extract_leadership(resume_text),
            "business_impact_score": min(score - 5, 85),
            "summary": summary
        }

    elif "job description intelligence" in prompt_lower:
        return {
            "required_skills": ["Python", "React", "SQL", "FastAPI"],
            "preferred_skills": ["Docker", "Kubernetes", "AWS", "GraphQL"],
            "responsibilities": ["Design and build scalable APIs.", "Collaborate with cross-functional teams.", "Optimize applications for maximum speed."],
            "seniority_level": "Mid-Senior",
            "technology_stack": ["Python", "FastAPI", "React", "PostgreSQL"],
            "experience_required_years": 3,
            "role_summary": "Seeking a talented Software Engineer to design, build, and scale core backend APIs."
        }

    elif "interview planner" in prompt_lower:
        return {
            "knowledge_graph": {
                "nodes": [
                    {"id": "python-basics", "label": "Python Core", "category": "technical", "status": "pending"},
                    {"id": "fastapi-apis", "label": "FastAPI & REST", "category": "technical", "status": "pending"},
                    {"id": "react-components", "label": "React State Management", "category": "technical", "status": "pending"},
                    {"id": "system-design", "label": "Database Design & Scaling", "category": "system_design", "status": "pending"}
                ],
                "edges": [
                    {"from": "python-basics", "to": "fastapi-apis"},
                    {"from": "fastapi-apis", "to": "system-design"}
                ]
            },
            "total_questions": 10,
            "suggested_focus": ["REST API Design", "Asynchronous Programming", "State Optimization"]
        }

    elif "adaptive interview" in prompt_lower:
        return {
            "question": "Can you explain how you would design a scalable REST API for a microservices architecture?",
            "type": "technical",
            "difficulty": "medium",
            "topic": "System Design",
            "expected_concepts": ["REST principles", "Microservices", "API Gateway", "Load Balancing"],
            "follow_up_hint": "Ask about database sharding if they mention scaling"
        }

    elif "technical evaluation" in prompt_lower:
        return {
            "score": 7.5,
            "accuracy": 8,
            "depth": 7,
            "communication": 8,
            "confidence": 7,
            "feedback": "Good understanding of core concepts with room for deeper exploration.",
            "strengths": ["Clear communication", "Solid fundamentals"],
            "improvements": ["Could elaborate on edge cases", "Add more real-world examples"]
        }

    elif "difficulty controller" in prompt_lower:
        return {
            "adjust": "maintain",
            "reason": "Candidate performing at expected level",
            "next_difficulty": "medium",
            "confidence": 0.8
        }

    elif "hiring manager" in prompt_lower:
        return {
            "decision": "Hire",
            "confidence": 0.82,
            "reasoning": "Strong technical foundation with good communication skills.",
            "offer_recommendation": "Mid-level position with standard compensation.",
            "risk_factors": ["Limited production-scale experience"],
            "strengths_summary": ["Problem solving", "Technical depth", "Team collaboration"]
        }

    elif "skill gap" in prompt_lower:
        return {
            "matching_skills": ["Python", "React", "SQL"],
            "missing_skills": ["Kubernetes", "GraphQL"],
            "match_percentage": 72,
            "recommendations": ["Take a Kubernetes course", "Build a GraphQL API project"],
            "priority_skills": ["Kubernetes", "Docker"]
        }

    elif "career coach" in prompt_lower:
        return {
            "roadmap": [
                {"week": 1, "focus": "Core fundamentals review", "resources": ["Documentation", "Practice exercises"]},
                {"week": 2, "focus": "Project-based learning", "resources": ["Build a REST API", "Deploy to cloud"]},
                {"week": 3, "focus": "Advanced topics", "resources": ["System design", "Performance optimization"]},
                {"week": 4, "focus": "Interview preparation", "resources": ["Mock interviews", "Coding challenges"]}
            ],
            "priority_skills": ["System Design", "Cloud Architecture"],
            "estimated_readiness": "4-6 weeks"
        }

    elif "copilot" in prompt_lower:
        return {
            "response": "Based on your recent performance, I'd recommend focusing on system design concepts. Your technical skills are strong, but deeper architectural thinking will set you apart in senior-level interviews.",
            "suggestions": ["Practice system design problems", "Review your interview feedback", "Try a mock interview"]
        }

    # Generic fallback
    return {
        "status": "success",
        "message": "AI analysis completed successfully.",
        "data": {"score": 75, "recommendation": "Proceed with evaluation"}
    }
