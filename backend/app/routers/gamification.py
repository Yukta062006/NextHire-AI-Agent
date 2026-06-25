from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.gamification import Achievement, UserGamification
from app.schemas.schemas import GamificationProfileResponse
from app.utils.auth_utils import get_current_user
from app.services.gamification_engine import get_or_create_profile, get_xp_for_next_level

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])


@router.get("/profile", response_model=GamificationProfileResponse)
async def get_gamification_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's gamification profile (XP, level, badges, streaks)."""
    profile = await get_or_create_profile(db, user.id)

    # Get achievements
    result = await db.execute(
        select(Achievement)
        .where(Achievement.user_id == user.id)
        .order_by(Achievement.unlocked_at.desc())
    )
    achievements = result.scalars().all()

    return GamificationProfileResponse(
        total_xp=profile.total_xp,
        level=profile.level,
        current_streak=profile.current_streak,
        longest_streak=profile.longest_streak,
        interviews_completed=profile.interviews_completed,
        achievements=[
            {
                "id": a.id,
                "badge_name": a.badge_name,
                "badge_type": a.badge_type,
                "description": a.description,
                "xp_earned": a.xp_earned,
                "unlocked_at": a.unlocked_at.isoformat() if a.unlocked_at else None,
            }
            for a in achievements
        ],
    )


@router.get("/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    """Get the global leaderboard ranked by XP."""
    result = await db.execute(
        select(UserGamification, User)
        .join(User, User.id == UserGamification.user_id)
        .order_by(UserGamification.total_xp.desc())
        .limit(20)
    )
    rows = result.all()

    return {
        "leaderboard": [
            {
                "rank": i + 1,
                "name": user.name,
                "level": profile.level,
                "total_xp": profile.total_xp,
                "interviews_completed": profile.interviews_completed,
                "current_streak": profile.current_streak,
            }
            for i, (profile, user) in enumerate(rows)
        ]
    }
