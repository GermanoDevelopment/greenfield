import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.core.security import create_access_token
from app.db.base import Base, UserModel
from app.db.session import get_db
from app.main import app


@pytest.fixture(autouse=True)
def _isolate_onchain_settings(monkeypatch):
    """
    Isola testes das chaves reais no .env local desativando
    chamadas on-chain nos testes unitários.
    """
    settings = get_settings()
    monkeypatch.setattr(settings, "solana_program_id", "")
    monkeypatch.setattr(settings, "solana_authority_secret_key", "")


@pytest.fixture
def mock_github_issue_open(monkeypatch):
    from app.services import github_service

    async def fake_issue_open(issue_url: str) -> bool | None:
        return True

    monkeypatch.setattr(github_service, "is_issue_open", fake_issue_open)


@pytest.fixture
def mock_github_pr_merged(monkeypatch):
    from app.services import github_service

    merged = {"result": True}

    async def fake_pr_merged(pr_url: str) -> bool | None:
        return merged["result"]

    monkeypatch.setattr(github_service, "is_pr_merged", fake_pr_merged)
    return merged


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
