import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token
from app.db.base import Base, UserModel
from app.db.session import get_db
from app.main import app


@pytest.fixture
async def engine():
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def session_factory(engine):
    return async_sessionmaker(engine, expire_on_commit=False)


@pytest.fixture
async def client(app_db_override, session_factory):
    transport = ASGITransport(app=app_db_override)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def app_db_override(session_factory):
    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
async def user(session_factory):
    async with session_factory() as session:
        u = UserModel(github_id=123456, username="alice", avatar_url="https://avatar/alice.png")
        session.add(u)
        await session.commit()
        return {"id": u.id, "username": u.username}


@pytest.fixture
def auth_headers(user):
    token = create_access_token(user["id"], user["username"])
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def hunter_user(session_factory):
    async with session_factory() as session:
        u = UserModel(github_id=789, username="bob")
        session.add(u)
        await session.commit()
        return {"id": u.id, "username": u.username}


@pytest.fixture
def hunter_headers(hunter_user):
    token = create_access_token(hunter_user["id"], hunter_user["username"])
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def admin_user(session_factory):
    async with session_factory() as session:
        u = UserModel(github_id=999, username="germano_admin", role="ADMIN")
        session.add(u)
        await session.commit()
        return {"id": u.id, "username": u.username, "role": u.role}


@pytest.fixture
def admin_headers(admin_user):
    token = create_access_token(admin_user["id"], admin_user["username"])
    return {"Authorization": f"Bearer {token}"}
