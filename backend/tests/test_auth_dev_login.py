"""Dev-only login shortcut used by the frontend when GitHub OAuth isn't
configured locally (empty GITHUB_CLIENT_ID/SECRET, the default in this repo)."""

from app.core.config import get_settings


async def test_auth_config_reports_no_github_oauth_by_default(client):
    resp = await client.get("/api/v1/auth/config")
    assert resp.status_code == 200
    assert resp.json() == {"github_oauth_configured": False}


async def test_dev_login_creates_and_reuses_user(client):
    resp = await client.post("/api/v1/auth/dev-login", json={"username": "dev-tester"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["user"]["username"] == "dev-tester"
    assert body["access_token"]

    me = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"}
    )
    assert me.status_code == 200
    assert me.json()["username"] == "dev-tester"

    # Logging in again with the same username reuses the same user id.
    resp2 = await client.post("/api/v1/auth/dev-login", json={"username": "dev-tester"})
    assert resp2.json()["user"]["id"] == body["user"]["id"]


async def test_dev_login_disabled_when_github_oauth_configured(client, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "github_client_id", "some-id")
    monkeypatch.setattr(settings, "github_client_secret", "some-secret")

    resp = await client.post("/api/v1/auth/dev-login", json={"username": "dev-tester"})
    assert resp.status_code == 404
