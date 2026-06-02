import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base
from app.core.base import *  # This registers all models
from app.dependencies.db import get_db
from app.core.security import get_password_hash
from app.routers.v1.auth.models.relational import User, UserSetting

# Test Database setup (In-memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=None
)

TestingSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

from main import app
app.dependency_overrides[get_db] = override_get_db

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def db_session():
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

from sqlalchemy import select

@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession):
    result = await db_session.execute(select(User).where(User.email == "testuser@example.com"))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            email="testuser@example.com",
            password_hash=get_password_hash("testpass123"),
            is_active=True
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        # Add UserSetting
        setting = UserSetting(user_id=user.id)
        db_session.add(setting)
        await db_session.commit()
    return user
