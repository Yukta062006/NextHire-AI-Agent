"""
Early Termination Engine.

Terminate interview when:
- Three consecutive scores below 35
- OR overall readiness score below 25
"""


def should_terminate(recent_scores: list[float], overall_readiness: float) -> tuple[bool, str | None]:
    """
    Check if the interview should be terminated early.
    Returns (should_terminate, reason).
    """
    # Check for 3 consecutive low scores
    if len(recent_scores) >= 3:
        last_three = recent_scores[-3:]
        if all(score < 35 for score in last_three):
            return True, (
                "Fundamental Skill Gaps Detected — "
                f"The candidate scored below 35 on the last 3 consecutive questions "
                f"({', '.join(str(int(s)) for s in last_three)}). "
                "Continuing advanced questions would not provide an accurate assessment."
            )

    # Check overall readiness
    if len(recent_scores) >= 3 and overall_readiness < 25:
        return True, (
            f"Overall Readiness Score ({overall_readiness:.0f}/100) is critically low. "
            "The AI has determined that continuing the interview would not be productive. "
            "A personalized learning plan has been generated."
        )

    return False, None
