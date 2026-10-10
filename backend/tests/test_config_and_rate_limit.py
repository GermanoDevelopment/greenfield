import pytest

from app.core.config import (
    DEFAULT_DATABASE_URL,
    DEFAULT_JWT_SECRET,
    ConfigurationError,
    Settings,
    get_settings,
    validate_settings,
)

STRONG_SECRET = "x" * 48
PROD_DB = "postgresql+asyncpg://app:s3cret@db.internal:5432/greenfield"


def _prod_settings(**overrides) -> Settings:
    values = {
        "environment": "production",
        "jwt_secret": STRONG_SECRET,
        "github_webhook_secret": "webhook-secret",
        "database_url": PROD_DB,
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)


# --- Startup configuration validation -------------------------------------


def test_dev_environment_accepts_defaults():
    validate_settings(Settings(_env_file=None, environment="development"))


def test_production_accepts_strong_configuration():
    validate_settings(_prod_settings())


@pytest.mark.parametrize(
    "overrides,message",
    [
        ({"jwt_secret": DEFAULT_JWT_SECRET}, "JWT_SECRET"),
        ({"jwt_secret": "short"}, "JWT_SECRET"),
        ({"github_webhook_secret": ""}, "GITHUB_WEBHOOK_SECRET"),
        ({"database_url": DEFAULT_DATABASE_URL}, "DATABASE_URL"),
        ({"github_client_id": "id", "github_client_secret": ""}, "GITHUB_CLIENT_ID"),
    ],
)
def test_production_rejects_unsafe_configuration(overrides, message):
    with pytest.raises(ConfigurationError, match=message):
        validate_settings(_prod_settings(**overrides))


def test_create_app_refuses_to_start_outside_dev(monkeypatch):
    from app.main import create_app

    settings = get_settings()
    monkeypatch.setattr(settings, "environment", "production")
    with pytest.raises(ConfigurationError):
        create_app()


# --- Rate limiting --------------------------------------------------------


@pytest.fixture
def tight_limits(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "rate_limit_auth_per_minute", 3)
    monkeypatch.setattr(settings, "rate_limit_webhook_per_minute", 2)
    monkeypatch.setattr(settings, "rate_limit_github_per_minute", 2)
    return settings


async def test_auth_routes_are_rate_limited(client, tight_limits):
    body = {"email": "nobody@example.com", "password": "whatever-password"}
    for _ in range(3):
        resp = await client.post("/api/v1/auth/register", json={**body, "username": "x"})
        assert resp.status_code != 429

    resp = await client.post("/api/v1/auth/login", json=body)
    assert resp.status_code == 429
    assert int(resp.headers["Retry-After"]) >= 1

    # Other scopes are counted separately.
    assert (await client.get("/api/v1/health")).status_code == 200


async def test_webhook_is_rate_limited(client, tight_limits):
    for _ in range(2):
        resp = await client.post("/api/v1/webhooks/github", content=b"{}")
        assert resp.status_code != 429
    resp = await client.post("/api/v1/webhooks/github", content=b"{}")
    assert resp.status_code == 429


async def test_github_backed_routes_are_rate_limited(client, tight_limits, auth_headers):
    for _ in range(2):
        resp = await client.get("/api/v1/repositories/999/issues", headers=auth_headers)
        assert resp.status_code != 429
    resp = await client.post("/api/v1/bounties/999/complete", headers=auth_headers)
    assert resp.status_code == 429


async def test_rate_limit_can_be_disabled(client, tight_limits, monkeypatch):
    monkeypatch.setattr(tight_limits, "rate_limit_enabled", False)
    for _ in range(5):
        resp = await client.post("/api/v1/webhooks/github", content=b"{}")
        assert resp.status_code != 429


# --- Login lockout --------------------------------------------------------


async def _register(client, email="victim@example.com", password="correct-password"):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "username": "victim"},
    )
    assert resp.status_code == 201


async def test_login_locks_after_repeated_failures(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "login_max_failures", 3)
    await _register(client)

    for _ in range(3):
        resp = await client.post(
            "/api/v1/auth/login", json={"email": "victim@example.com", "password": "wrong-password"}
        )
        assert resp.status_code == 401

    # Locked even with the right password (and regardless of email casing).
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "VICTIM@example.com", "password": "correct-password"},
    )
    assert resp.status_code == 429
    assert int(resp.headers["Retry-After"]) > 60


async def test_successful_login_resets_failure_count(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "login_max_failures", 3)
    await _register(client)
    wrong = {"email": "victim@example.com", "password": "wrong-password"}
    right = {"email": "victim@example.com", "password": "correct-password"}

    for _ in range(2):
        assert (await client.post("/api/v1/auth/login", json=wrong)).status_code == 401
    assert (await client.post("/api/v1/auth/login", json=right)).status_code == 200
    for _ in range(2):
        assert (await client.post("/api/v1/auth/login", json=wrong)).status_code == 401
    assert (await client.post("/api/v1/auth/login", json=right)).status_code == 200


async def test_lockout_is_per_email(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "login_max_failures", 2)
    await _register(client)
    for _ in range(2):
        await client.post(
            "/api/v1/auth/login", json={"email": "other@example.com", "password": "wrong-password"}
        )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "victim@example.com", "password": "correct-password"},
    )
    assert resp.status_code == 200


def test_lockout_expires():
    from app.core import rate_limit

    lockout = rate_limit.LoginLockout()
    now = [1000.0]
    original = rate_limit.time.monotonic
    rate_limit.time.monotonic = lambda: now[0]
    try:
        settings = get_settings()
        for _ in range(settings.login_max_failures):
            lockout.record_failure("a@example.com")
        with pytest.raises(Exception) as exc:
            lockout.check("a@example.com")
        assert exc.value.status_code == 429

        now[0] += settings.login_lockout_minutes * 60 + 1
        lockout.check("a@example.com")
    finally:
        rate_limit.time.monotonic = original
