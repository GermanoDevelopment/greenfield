from unittest.mock import AsyncMock, patch
from urllib.parse import parse_qs, urlparse

from app.core.security import decode_token, generate_oauth_state, verify_oauth_state
from app.services.github_service import GitHubServiceError


async def test_github_login_redirect_generates_signed_state(client):
    resp = await client.get("/api/v1/auth/github/login", follow_redirects=False)
    assert resp.status_code == 307

    location = resp.headers.get("location")
    assert location is not None
    parsed = urlparse(location)
    assert parsed.netloc == "github.com"
    assert parsed.path == "/login/oauth/authorize"

    qs = parse_qs(parsed.query)
    assert "state" in qs
    state = qs["state"][0]
    assert verify_oauth_state(state) is True
    assert "scope" in qs
    assert "public_repo" in qs["scope"][0]


async def test_github_login_preserves_custom_state(client):
    custom_state = "client_custom_state_nonce"
    resp = await client.get(
        f"/api/v1/auth/github/login?state={custom_state}", follow_redirects=False
    )
    assert resp.status_code == 307

    location = resp.headers.get("location")
    parsed = urlparse(location)
    qs = parse_qs(parsed.query)
    assert qs["state"][0] == custom_state


async def test_github_callback_missing_state_rejected_json(client):
    resp = await client.get(
        "/api/v1/auth/github/callback?code=dummy_code",
        headers={"Accept": "application/json"},
    )
    assert resp.status_code == 422
    assert "state" in resp.json()["detail"].lower()


async def test_github_callback_missing_state_redirects_error(client):
    resp = await client.get(
        "/api/v1/auth/github/callback?code=dummy_code",
        follow_redirects=False,
    )
    assert resp.status_code in (302, 307)
    location = resp.headers.get("location")
    assert "error=invalid_state" in location


async def test_github_callback_tampered_state_rejected(client):
    resp = await client.get(
        "/api/v1/auth/github/callback?code=dummy_code&state=tampered.state.jwt",
        headers={"Accept": "application/json"},
    )
    assert resp.status_code == 422
    assert "state" in resp.json()["detail"].lower()


async def test_github_callback_oauth_error_redirect(client):
    resp = await client.get(
        "/api/v1/auth/github/callback?error=access_denied",
        follow_redirects=False,
    )
    assert resp.status_code in (302, 307)
    location = resp.headers.get("location")
    assert "error=access_denied" in location


async def test_github_callback_missing_code_with_valid_state(client):
    state = generate_oauth_state()
    resp = await client.get(
        f"/api/v1/auth/github/callback?state={state}",
        follow_redirects=False,
    )
    assert resp.status_code in (302, 307)
    location = resp.headers.get("location")
    assert "error=missing_code" in location


async def test_github_callback_success_redirect_to_frontend(client):
    state = generate_oauth_state()
    fake_user = {
        "github_id": 12345678,
        "username": "oauth_tester",
        "avatar_url": "https://avatars.githubusercontent.com/u/12345678",
    }

    with (
        patch(
            "app.services.github_service.exchange_code_for_token",
            AsyncMock(return_value="gho_test_token"),
        ),
        patch(
            "app.services.github_service.get_authenticated_user", AsyncMock(return_value=fake_user)
        ),
    ):
        resp = await client.get(
            f"/api/v1/auth/github/callback?code=valid_gh_code&state={state}",
            follow_redirects=False,
        )

    assert resp.status_code in (302, 307)
    location = resp.headers.get("location")
    assert "/auth/callback" in location
    parsed = urlparse(location)
    qs = parse_qs(parsed.query)
    assert "token" in qs
    token = qs["token"][0]

    payload = decode_token(token)
    assert payload["username"] == "oauth_tester"


async def test_github_callback_success_json(client):
    state = generate_oauth_state()
    fake_user = {
        "github_id": 87654321,
        "username": "api_tester",
        "avatar_url": "https://avatars.githubusercontent.com/u/87654321",
    }

    with (
        patch(
            "app.services.github_service.exchange_code_for_token",
            AsyncMock(return_value="gho_test_token"),
        ),
        patch(
            "app.services.github_service.get_authenticated_user", AsyncMock(return_value=fake_user)
        ),
    ):
        resp = await client.get(
            f"/api/v1/auth/github/callback?code=valid_gh_code&state={state}",
            headers={"Accept": "application/json"},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["username"] == "api_tester"


async def test_github_callback_upstream_service_error(client):
    state = generate_oauth_state()
    with patch(
        "app.services.github_service.exchange_code_for_token",
        AsyncMock(side_effect=GitHubServiceError("GitHub token service down")),
    ):
        resp = await client.get(
            f"/api/v1/auth/github/callback?code=broken_code&state={state}",
            headers={"Accept": "application/json"},
        )

    assert resp.status_code == 422
    assert "github token service down" in resp.json()["detail"].lower()
