"""
Scoring Engine — calculates the weighted NextHire score.

Technical Competency = 35%
Knowledge Depth = 20%
Communication = 15%
Pressure Handling = 10%
Skill Verification = 10%
Time Efficiency = 5%
Confidence = 5%
"""


def calculate_nexthire_score(
    technical: float,
    knowledge_depth: float,
    communication: float,
    pressure: float,
    skill_verification: float,
    time_efficiency: float,
    confidence: float,
) -> float:
    """Calculate the weighted NextHire score (0-100)."""
    score = (
        technical * 0.35
        + knowledge_depth * 0.20
        + communication * 0.15
        + pressure * 0.10
        + skill_verification * 0.10
        + time_efficiency * 0.05
        + confidence * 0.05
    )
    return round(min(max(score, 0), 100), 1)


def calculate_hire_probability(nexthire_score: float) -> float:
    """Convert NextHire score to a hire probability percentage."""
    if nexthire_score >= 85:
        return round(min(90 + (nexthire_score - 85) * 0.67, 99), 1)
    elif nexthire_score >= 70:
        return round(60 + (nexthire_score - 70) * 2, 1)
    elif nexthire_score >= 50:
        return round(30 + (nexthire_score - 50) * 1.5, 1)
    else:
        return round(max(nexthire_score * 0.6, 5), 1)


def get_recommendation(nexthire_score: float) -> str:
    """Get hiring recommendation based on NextHire score."""
    if nexthire_score >= 85:
        return "Strong Hire"
    elif nexthire_score >= 70:
        return "Hire"
    elif nexthire_score >= 55:
        return "Borderline"
    elif nexthire_score >= 40:
        return "Needs Improvement"
    else:
        return "Reject"
