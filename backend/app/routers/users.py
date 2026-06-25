from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.schemas import UserResponse, UserUpdate
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    update: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if update.name is not None:
        user.name = update.name
    if update.experience_level is not None:
        user.experience_level = update.experience_level
    if update.target_role is not None:
        user.target_role = update.target_role
    if update.career_goals is not None:
        user.career_goals = update.career_goals
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)
