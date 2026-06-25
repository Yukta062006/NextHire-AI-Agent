# NEXTHIRE 2.0 — AI Hiring Intelligence Operating System Implementation Plan

We will transform NEXTHIRE into a fully integrated, state-of-the-art **AI Hiring Intelligence Operating System**. We will implement high-fidelity dashboard views, recruiter workspaces, and detailed backend decision-making components to enable candidate twin profiling, war room committee evaluation, early termination, skill verification, career roadmap navigation, and global market comparisons.

## User Review Required

We are introducing the following major upgrades:
1. **Database Schema Enhancements**: We will extend the `Evaluation` model to store rich metrics including `company_mode` weightages, `success_predictions`, `market_benchmarks`, `hiring_risks`, `learning_velocity`, and `war_room_evaluations` as JSON objects.
2. **Company-Specific Rules**: We will support specialized mock interviews mimicking Google, Amazon, Microsoft, Meta, Stripe, Netflix, Uber, and Atlassian. Each company will dynamically skew the adaptive prompt generation and evaluation weightage.
3. **AI Hiring War Room**: Multiple AI evaluator panels will simulate Technical Lead, Engineering Manager, Recruiter, and VP Engineering, returning distinct opinions, recommendations, and concerns.

## Open Questions

> [!NOTE]
> * **API Key Verification**: Are you using your own Google Gemini API key in the `.env` file, or should we continue to support the high-fidelity mock fallback mechanism seamlessly? *(Note: The current system has an elegant schema-compliant fallback in `base_agent.py` which we will preserve and expand to keep everything fully functional either way).*

---

## Proposed Changes

### Component 1: Database & Backend Schemas

#### [MODIFY] [evaluation.py](file:///d:/%20Projects/NextHire/backend/app/models/evaluation.py)
- Extend the model to store company-specific settings and advanced matrices.
- Keep backwards-compatibility with existing fields while adding JSON properties for:
  - `company_context` (e.g. company name, weightages used)
  - `war_room` (e.g. evaluations from the Tech Lead, EM, Recruiter, VP Eng)
  - `predictions` (e.g. Offer Prob, 90-day success, Retention Prob)
  - `risks` (e.g. Skill Inflation, Communication, depth, etc.)
  - `benchmarks` (e.g. relative percentiles for React, System Design, Problem Solving)
  - `learning_velocity` (e.g. historical and projected learning rates)

#### [MODIFY] [interview.py](file:///d:/Innovative%20Projects/NextHire/backend/app/models/interview.py)
- Add a `company` field (e.g., "Google", "Stripe", "Amazon") so the interview session is customized according to the selected target company.

#### [MODIFY] [schemas.py](file:///d:/Innovative%20Projects/NextHire/backend/app/schemas/schemas.py)
- Update `InterviewStartRequest` to accept an optional `company: str = "Standard"`.
- Update `EvaluationResponse` and `DashboardResponse` to return the new fields.

---

### Component 2: Core Backend Engine & AI Agents

#### [NEW] [war_room.py](file:///d:/Innovative%20Projects/NextHire/backend/app/agents/war_room.py)
- Implement a dedicated agent that takes full interview evaluation logs and simulates four distinct personas (Tech Lead, Engineering Manager, Recruiter, VP Engineering) generating scores, strengths, concerns, and recommendations.

#### [MODIFY] [interview_engine.py](file:///d:/Innovative%20Projects/NextHire/backend/app/services/interview_engine.py)
- Incorporate `company` parameters in `start_interview` and `process_answer`.
- Apply strict adaptive rules:
  - **Strong Answer** ($\ge 85$): Escalate difficulty, ask deep architectural follow-up questions.
  - **Average Answer** ($60 \le \text{score} < 85$): Keep difficulty stable, move sideways to parallel concepts.
  - **Weak Answer** ($< 60$): De-escalate difficulty, pivot to fundamental concepts.
- When the interview finishes, invoke the **AI Hiring War Room** agent and generate:
  - `hiring_risks` (comparing claimed skills from the resume vs verified performance).
  - `success_predictions` (calculating Offer Probability, 90-Day Success, Retention).
  - `market_benchmarks` (global percentiles).
  - `learning_velocity` based on performance trajectory across answers.

#### [MODIFY] [base_agent.py](file:///d:/Innovative%20Projects/NextHire/backend/app/agents/base_agent.py)
- Expand mock fallback logic to generate highly realistic datasets for the War Room, benchmarking, learning velocity, and success predictions when API key is not configured or fails.

---

### Component 3: Frontend Interfaces & Visualization

#### [MODIFY] [recruiter/page.tsx](file:///d:/Innovative%20Projects/NextHire/src/app/dashboard/recruiter/page.tsx)
- **Fix API data parsing bug** where candidate array was mapped incorrectly (referencing `data.map` instead of `data.candidates.map`).
- Enhance recruiter panel to display:
  - Skill Verification Accuracy.
  - Risk Warnings with indicator badges (Red/Amber/Green).
  - War Room Committee recommendation summaries.

#### [MODIFY] [live-interview/page.tsx](file:///d:/Innovative%20Projects/NextHire/src/app/dashboard/live-interview/page.tsx)
- Enable selecting a target company (Google, Amazon, Meta, Stripe, Netflix, Microsoft) during interview setup.
- Style cards with brand accents matching the selected company.
- Implement the "War Room Committee Verdict" tab when the interview is completed, showcasing the four evaluator cards and a beautiful breakdown of the success predictions.

#### [MODIFY] [dashboard/page.tsx](file:///d:/Innovative%20Projects/NextHire/src/app/dashboard/page.tsx)
- Render the **Digital Candidate Twin** tab showing interactive metrics (Learning velocity, problem-solving style, communication patterns, and career trajectory).
- Render **Success Predictions** (Offer Prob, 90-Day success, retention, leadership potential) with circular progress indicators.
- Display a interactive **Global Benchmark Engine** showing candidate rank compared to global peers.

---

## Verification Plan

### Automated Verification
- Run backend FastAPI server locally: `python -m uvicorn app.main:app --port 8000`.
- Verify endpoints `/api/interviews/start`, `/api/interviews/{id}/answer`, `/api/recruiter/candidates` using curl or browser testing.
- Launch Next.js development server: `npm run dev -- -p 3000`.

### Manual UI Verification
- Log in as recruiter, verify candidates list loads perfectly without error.
- Start a new company-specific interview simulation (e.g. Google or Stripe style).
- Submit answers and verify the adaptive difficulty pivots successfully.
- Complete the interview, and review the gorgeous **AI Hiring War Room** evaluations and **Digital Candidate Twin** profile charts.
