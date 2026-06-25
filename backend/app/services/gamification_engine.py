"""
Gamification Engine — XP, levels, badges, streaks, achievements.
"""
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.gamification import Achievement, UserGamification

# Level thresholds (XP required per level)
LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000]

# Badge definitions
BADGE_DEFINITIONS = {
    "first_blood": {"name": "First Blood", "description": "Completed your first AI Mock Interview", "xp": 100, "type": "milestone"},
    "code_ninja": {"name": "Code Ninja", "description": "Scored 90%+ in a Technical Interview", "xp": 200, "type": "skill"},
    "smooth_talker": {"name": "Smooth Talker", "description": "Scored 95%+ in Communication", "xp": 200, "type": "skill"},
    "ice_veins": {"name": "Ice in the Veins", "description": "Maintained low pressure during a Hard question", "xp": 250, "type": "skill"},
    "system_architect": {"name": "System Architect", "description": "Successfully designed a scalable system", "xp": 300, "type": "skill"},
    "streak_3": {"name": "On Fire", "description": "3-day interview streak", "xp": 150, "type": "streak"},
    "streak_7": {"name": "Unstoppable", "description": "7-day interview streak", "xp": 350, "type": "streak"},
    "strong_hire": {"name": "Strong Hire", "description": "Received a Strong Hire recommendation", "xp": 500, "type": "milestone"},
}


def get_level_for_xp(total_xp: int) -> int:
    """Determine level based on total XP."""
    for i in range(len(LEVEL_THRESHOLDS) - 1, -1, -1):
        if total_xp >= LEVEL_THRESHOLDS[i]:
            return i + 1
    return 1


def get_xp_for_next_level(total_xp: int) -> int:
    """Get XP needed for the next level."""
    current_level = get_level_for_xp(total_xp)
    if current_level >= len(LEVEL_THRESHOLDS):
        return 0
    return LEVEL_THRESHOLDS[current_level] - total_xp


async def get_or_create_profile(db: AsyncSession, user_id: str) -> UserGamification:
    """Get or create a gamification profile."""
    result = await db.execute(select(UserGamification).where(UserGamification.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserGamification(user_id=user_id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


async def award_xp(db: AsyncSession, user_id: str, xp: int) -> UserGamification:
    """Award XP to a user and update their level."""
    profile = await get_or_create_profile(db, user_id)
    profile.total_xp += xp
    profile.level = get_level_for_xp(profile.total_xp)
    await db.commit()
    return profile


async def unlock_badge(db: AsyncSession, user_id: str, badge_key: str) -> Achievement | None:
    """Unlock a badge if it hasn't been unlocked already."""
    badge_def = BADGE_DEFINITIONS.get(badge_key)
    if not badge_def:
        return None

    # Check if already unlocked
    result = await db.execute(
        select(Achievement)
        .where(Achievement.user_id == user_id)
        .where(Achievement.badge_name == badge_def["name"])
    )
    if result.scalar_one_or_none():
        return None  # Already unlocked

    achievement = Achievement(
        user_id=user_id,
        badge_name=badge_def["name"],
        badge_type=badge_def["type"],
        description=badge_def["description"],
        xp_earned=badge_def["xp"],
    )
    db.add(achievement)

    # Award XP
    await award_xp(db, user_id, badge_def["xp"])
    await db.commit()
    await db.refresh(achievement)
    return achievement


async def check_post_interview_badges(
    db: AsyncSession,
    user_id: str,
    technical_score: float,
    communication_score: float,
    pressure_score: float,
    recommendation: str,
) -> list[str]:
    """Check and unlock badges after an interview."""
    unlocked = []

    # First Blood
    profile = await get_or_create_profile(db, user_id)
    if profile.interviews_completed <= 1:
        badge = await unlock_badge(db, user_id, "first_blood")
        if badge:
            unlocked.append("first_blood")

    # Code Ninja
    if technical_score >= 90:
        badge = await unlock_badge(db, user_id, "code_ninja")
        if badge:
            unlocked.append("code_ninja")

    # Smooth Talker
    if communication_score >= 95:
        badge = await unlock_badge(db, user_id, "smooth_talker")
        if badge:
            unlocked.append("smooth_talker")

    # Strong Hire
    if recommendation == "Strong Hire":
        badge = await unlock_badge(db, user_id, "strong_hire")
        if badge:
            unlocked.append("strong_hire")

    return unlocked
