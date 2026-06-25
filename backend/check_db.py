import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models.user import User
from app.models.resume import Resume

async def check():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Check users
        user_result = await db.execute(select(User))
        users = user_result.scalars().all()
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"- User: ID={u.id}, Name={u.name}, Email={u.email}")
            
        # Check resumes
        resume_result = await db.execute(select(Resume))
        resumes = resume_result.scalars().all()
        print(f"Total resumes: {len(resumes)}")
        for r in resumes:
            print(f"- Resume: ID={r.id}, UserID={r.user_id}, Score={r.resume_score}, CreatedAt={r.created_at}")

if __name__ == "__main__":
    asyncio.run(check())
