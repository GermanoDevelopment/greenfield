import respx

from app.core.config import get_settings
from app.services.github_service import GITHUB_API


async def test_github_login_redirect(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "github_client_id", "test-client-id")
    resp = await client.get("/api/v1/auth/github/login", follow_redirects=False)
    assert resp.status_code == 307
    assert "https://github.com/login/oauth/authorize" in resp.headers["location"]
    assert "client_id=test-client-id" in resp.headers["location"]

    resp_state = await client.get(
        "/api/v1/auth/github/login?state=csrf_xyz", follow_redirects=False
    )
    assert resp_state.status_code == 307
    assert "state=csrf_xyz" in resp_state.headers["location"]


@respx.mock
async def test_github_callback_success_json(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "github_client_id", "cid")
    monkeypatch.setattr(get_settings(), "github_client_secret", "csec")

    respx.post("https://github.com/login/oauth/access_token").respond(
        status_code=200, json={"access_token": "gho_mock_token"}
    )
    respx.get(f"{GITHUB_API}/user").respond(
        status_code=200,
        json={"id": 445566, "login": "new_contributor", "avatar_url": "https://avatar.url/nc"},
    )

    resp = await client.get(
        "/api/v1/auth/github/callback?code=valid_code",
        headers={"Accept": "application/json"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["username"] == "new_contributor"
    assert data["user"]["role"] == "CONTRIBUTOR"


@respx.mock
async def test_github_callback_success_browser_redirect(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "github_client_id", "cid")
    monkeypatch.setattr(get_settings(), "github_client_secret", "csec")

    respx.post("https://github.com/login/oauth/access_token").respond(
        status_code=200, json={"access_token": "gho_mock_token"}
    )
    respx.get(f"{GITHUB_API}/user").respond(
        status_code=200,
        json={"id": 778899, "login": "browser_user", "avatar_url": None},
    )

    resp = await client.get(
        "/api/v1/auth/github/callback?code=valid_code",
        follow_redirects=False,
    )
    assert resp.status_code == 307
    assert "token=" in resp.headers["location"]


@respx.mock
async def test_github_callback_admin_user(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "github_client_id", "cid")
    monkeypatch.setattr(get_settings(), "github_client_secret", "csec")
    monkeypatch.setattr(get_settings(), "admin_github_usernames", ["super_admin"])

    respx.post("https://github.com/login/oauth/access_token").respond(
        status_code=200, json={"access_token": "gho_admin"}
    )
    respx.get(f"{GITHUB_API}/user").respond(
        status_code=200,
        json={"id": 111222, "login": "super_admin", "avatar_url": None},
    )

    resp = await client.get(
        "/api/v1/auth/github/callback?code=admin_code",
        headers={"Accept": "application/json"},
    )
    assert resp.status_code == 200
    assert resp.json()["user"]["role"] == "ADMIN"


async def test_github_callback_missing_code(client):
    resp_json = await client.get(
        "/api/v1/auth/github/callback",
        headers={"Accept": "application/json"},
    )
    assert resp_json.status_code == 422

    resp_html = await client.get(
        "/api/v1/auth/github/callback",
        follow_redirects=False,
    )
    assert resp_html.status_code == 307
    assert "error=missing_code" in resp_html.headers["location"]


async def test_github_callback_error_param(client):
    resp_json = await client.get(
        "/api/v1/auth/github/callback?error=access_denied",
        headers={"Accept": "application/json"},
    )
    assert resp_json.status_code == 422

    resp_html = await client.get(
        "/api/v1/auth/github/callback?error=access_denied",
        follow_redirects=False,
    )
    assert resp_html.status_code == 307
    assert "error=access_denied" in resp_html.headers["location"]


@respx.mock
async def test_github_callback_service_error(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "github_client_id", "cid")
    monkeypatch.setattr(get_settings(), "github_client_secret", "csec")

    respx.post("https://github.com/login/oauth/access_token").respond(status_code=500)

    resp_json = await client.get(
        "/api/v1/auth/github/callback?code=failing_code",
        headers={"Accept": "application/json"},
    )
    assert resp_json.status_code == 422
