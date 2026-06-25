from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

# Use the helper method that handles postgres:// -> postgresql+asyncpg:// conversion
_db_url = settings.get_database_url()

_connect_args = {}
if "sqlite" in _db_url:
    _connect_args = {"check_same_thread": False}

engine = create_async_engine(
    _db_url,
    echo=False,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        from app.models import user, resume, job_description, interview, question, answer, evaluation, report, gamification, autopilot  # noqa
        await conn.run_sync(Base.metadata.create_all)
        
        # Run automatic migrations to handle schema upgrades on Railway
        def run_migrations(connection):
            from sqlalchemy import inspect, text
            inspector = inspect(connection)
            
            # Migrate evaluations table
            if "evaluations" in inspector.get_table_names():
                columns = [c["name"] for c in inspector.get_columns("evaluations")]
                new_eval_cols = [
                    "company_context",
                    "war_room",
                    "predictions",
                    "risks",
                    "benchmarks",
                    "learning_velocity"
                ]
                for col in new_eval_cols:
                    if col not in columns:
                        connection.execute(text(f"ALTER TABLE evaluations ADD COLUMN {col} JSON"))
            
            # Migrate interviews table
            if "interviews" in inspector.get_table_names():
                columns = [c["name"] for c in inspector.get_columns("interviews")]
                if "company" not in columns:
                    connection.execute(text("ALTER TABLE interviews ADD COLUMN company VARCHAR(50) DEFAULT 'Standard'"))

        await conn.run_sync(run_migrations)
