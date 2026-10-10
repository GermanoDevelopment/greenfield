import pytest
from sqlalchemy import func, select

from app.cli import main as cli_main
from app.core.config import Settings, get_settings
from app.core.exceptions import ConflictError, ValidationError
from app.db.base import UserModel
from app.services.admin_provisioning import provision_admin

ADMIN_EMAIL = "ops@example.com"
ADMIN_PASSWORD = "a-long-operator-password"


async def _admin_count(session_factory) -> int:
    async with session_factory() as session:
        result = await session.execute(
            select(func.count()).select_from(UserModel).where(UserModel.role == "ADMIN")
        )
        return result.scalar_one()


@pytest.fixture
async def provisioned_admin(session_factory):
    async with session_factory() as session:
        return await provision_admin(session, ADMIN_EMAIL, "ops", ADMIN_PASSWORD)


# --- No privileged account by default ---------------------------------------


async def test_fresh_instance_has_no_admin(client, session_factory):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert await _admin_count(session_factory) == 0


@pytest.mark.parametrize(
    "email", ["germano@greenfield.com", "dione@greenfield.com", "kaue@greenfield.com"]
)
async def test_former_seed_credentials_do_not_work(client, email):
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "admin123"})
    assert resp.status_code == 401


def test_no_admin_github_usernames_by_default(monkeypatch):
    monkeypatch.delenv("ADMIN_GITHUB_USERNAMES", raising=False)
    assert Settings(_env_file=None).admin_github_usernames == []


# --- Registration and dev-login never grant ADMIN ----------------------------


@pytest.mark.parametrize("email", ["new@greenfield.com", "solana_builder@gmail.com"])
async def test_register_is_always_contributor(client, session_factory, email):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "mysecurepassword", "username": email.split("@")[0]},
    )
    assert resp.status_code == 201
    assert resp.json()["user"]["role"] == "CONTRIBUTOR"
    assert await _admin_count(session_factory) == 0


async def test_dev_login_never_grants_admin(client, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "enable_dev_login", True)
    monkeypatch.setattr(settings, "admin_github_usernames", ["GermanoDevelopment"])
    resp = await client.post("/api/v1/auth/dev-login", json={"username": "GermanoDevelopment"})
    assert resp.status_code == 200
    assert resp.json()["user"]["role"] == "CONTRIBUTOR"

    admin_resp = await client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {resp.json()['access_token']}"},
    )
    assert admin_resp.status_code == 403


# --- Operator provisioning ----------------------------------------------------


async def test_provisioned_admin_can_log_in(client, provisioned_admin):
    resp = await client.post(
        "/api/v1/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["role"] == "ADMIN"

    admin_resp = await client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert admin_resp.status_code == 200


async def test_provisioned_admin_wrong_password(client, provisioned_admin):
    resp = await client.post(
        "/api/v1/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
    )
    assert resp.status_code == 401
    assert "E-mail ou senha incorretos" in resp.json()["detail"]


async def test_provision_promotes_existing_user_keeping_password(client, session_factory):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "dev@example.com", "password": "mysecurepassword", "username": "dev"},
    )
    async with session_factory() as session:
        user = await provision_admin(session, "DEV@example.com")
    assert user.role == "ADMIN"

    resp = await client.post(
        "/api/v1/auth/login", json={"email": "dev@example.com", "password": "mysecurepassword"}
    )
    assert resp.json()["user"]["role"] == "ADMIN"


async def test_register_cannot_take_provisioned_email(client, provisioned_admin):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": ADMIN_EMAIL, "password": "mysecurepassword", "username": "ops2"},
    )
    assert resp.status_code == 409


@pytest.mark.parametrize(
    "kwargs,error",
    [
        ({"email": "not-an-email", "username": "x", "password": ADMIN_PASSWORD}, ValidationError),
        ({"email": "a@example.com", "username": "x", "password": "short"}, ValidationError),
        ({"email": "a@example.com", "username": None, "password": ADMIN_PASSWORD}, ValidationError),
        ({"email": "a@example.com", "username": "x", "password": None}, ValidationError),
        ({"email": "a@example.com", "username": "ops", "password": ADMIN_PASSWORD}, ConflictError),
    ],
)
async def test_provision_rejects_invalid_input(session_factory, provisioned_admin, kwargs, error):
    async with session_factory() as session:
        with pytest.raises(error):
            await provision_admin(session, **kwargs)
    assert await _admin_count(session_factory) == 1


async def test_cli_create_admin(session_factory, monkeypatch, capsys):
    import app.db.session as db_session

    monkeypatch.setattr(db_session, "async_session_factory", session_factory)
    monkeypatch.setenv("GREENFIELD_ADMIN_PASSWORD", ADMIN_PASSWORD)

    # asyncio.run needs its own loop; run the CLI in a worker thread.
    import asyncio

    code = await asyncio.to_thread(
        cli_main, ["create-admin", "--email", "cli@example.com", "--username", "cli"]
    )
    assert code == 0
    assert "Admin pronto: cli@example.com" in capsys.readouterr().out
    assert await _admin_count(session_factory) == 1
