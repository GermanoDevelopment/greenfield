from unittest.mock import patch

import httpx
import pytest

from app.core.config import get_settings
from app.services.github_service import (
    GitHubServiceError,
    clear_issues_cache,
    fetch_issue_details,
    fetch_repository_details,
    fetch_repository_issues,
)


@pytest.fixture(autouse=True)
def clean_cache():
    clear_issues_cache()
    yield
    clear_issues_cache()


def _make_github_issue(number: int, is_pr: bool = False, author: str = "coder"):
    item = {
        "number": number,
        "title": f"Issue #{number}",
        "body": f"Description for #{number}",
        "html_url": f"https://github.com/org/repo/issues/{number}",
        "state": "open",
        "user": {"login": author},
        "labels": [{"name": "bug"}, "help-wanted"],
    }
    if is_pr:
        item["pull_request"] = {"url": f"https://api.github.com/repos/org/repo/pulls/{number}"}
    return item


@pytest.mark.asyncio
async def test_fetch_repository_issues_pagination_and_pr_filter():
    """Verify that > 100 issues are paginated, PRs are ignored, and authors kept."""
    # Page 1: 100 issues (including 5 PRs)
    page_1 = [
        _make_github_issue(i, is_pr=(i % 20 == 0), author=f"user_{i}") for i in range(1, 101)
    ]
    # Page 2: 25 issues (including 2 PRs)
    page_2 = [
        _make_github_issue(i, is_pr=(i % 10 == 0), author=f"user_{i}") for i in range(101, 126)
    ]

    async def mock_get(url, params=None, headers=None):
        page = params.get("page", 1)
        if page == 1:
            return httpx.Response(200, json=page_1, request=httpx.Request("GET", url))
        elif page == 2:
            return httpx.Response(200, json=page_2, request=httpx.Request("GET", url))
        return httpx.Response(200, json=[], request=httpx.Request("GET", url))

    with patch.object(httpx.AsyncClient, "get", side_effect=mock_get):
        issues = await fetch_repository_issues("org", "repo", state="open", bypass_cache=True)

    # 125 total items minus 7 PRs -> 118 issues
    assert len(issues) == 118
    assert issues[0]["number"] == 1
    assert issues[0]["author_username"] == "user_1"
    assert issues[0]["labels"] == ["bug", "help-wanted"]
    assert issues[-1]["number"] == 125
    assert issues[-1]["author_username"] == "user_125"


@pytest.mark.asyncio
async def test_fetch_repository_issues_caching():
    """Verify public repo listing is cached and bypass_cache forces a refresh."""
    mock_data = [_make_github_issue(1, author="alice")]
    call_count = 0

    async def mock_get(url, params=None, headers=None):
        nonlocal call_count
        call_count += 1
        return httpx.Response(200, json=mock_data, request=httpx.Request("GET", url))

    with patch.object(httpx.AsyncClient, "get", side_effect=mock_get):
        # 1. First call fetches from HTTP
        res1 = await fetch_repository_issues("org", "cached-repo")
        assert len(res1) == 1
        assert call_count == 1

        # 2. Second call uses cache (call_count unchanged)
        res2 = await fetch_repository_issues("org", "cached-repo")
        assert len(res2) == 1
        assert call_count == 1

        # 3. bypass_cache=True forces an HTTP call
        res3 = await fetch_repository_issues("org", "cached-repo", bypass_cache=True)
        assert len(res3) == 1
        assert call_count == 2


@pytest.mark.asyncio
async def test_fetch_repository_issues_uses_github_token(monkeypatch):
    """Verify Authorization header uses settings.github_token when configured."""
    monkeypatch.setattr(get_settings(), "github_token", "ghp_secret_token_123")
    captured_headers = {}

    async def mock_get(url, params=None, headers=None):
        nonlocal captured_headers
        captured_headers = headers or {}
        return httpx.Response(200, json=[], request=httpx.Request("GET", url))

    with patch.object(httpx.AsyncClient, "get", side_effect=mock_get):
        await fetch_repository_issues("org", "repo", bypass_cache=True)

    assert captured_headers.get("Authorization") == "Bearer ghp_secret_token_123"


@pytest.mark.asyncio
async def test_fetch_repository_issues_error_handling():
    """Verify network failures, 404, rate limits, and outages raise GitHubServiceError."""
    # 1. 404 Not Found
    with patch.object(
        httpx.AsyncClient,
        "get",
        return_value=httpx.Response(404, text="Not Found", request=httpx.Request("GET", "https://api.github.com")),
    ):
        with pytest.raises(GitHubServiceError) as exc_info:
            await fetch_repository_issues("org", "nonexistent", bypass_cache=True)
        assert exc_info.value.status_code == 404

    # 2. 403 Rate Limit
    with patch.object(
        httpx.AsyncClient,
        "get",
        return_value=httpx.Response(403, text="rate limit exceeded", request=httpx.Request("GET", "https://api.github.com")),
    ):
        with pytest.raises(GitHubServiceError) as exc_info:
            await fetch_repository_issues("org", "repo", bypass_cache=True)
        assert exc_info.value.status_code == 429

    # 3. 500 Server Outage
    with patch.object(
        httpx.AsyncClient,
        "get",
        return_value=httpx.Response(500, text="Internal Server Error", request=httpx.Request("GET", "https://api.github.com")),
    ):
        with pytest.raises(GitHubServiceError) as exc_info:
            await fetch_repository_issues("org", "repo", bypass_cache=True)
        assert exc_info.value.status_code == 502

    # 4. Network error (Timeout / Connection failure)
    with patch.object(
        httpx.AsyncClient,
        "get",
        side_effect=httpx.ConnectError("Network unreachable"),
    ):
        with pytest.raises(GitHubServiceError) as exc_info:
            await fetch_repository_issues("org", "repo", bypass_cache=True)
        assert exc_info.value.status_code == 502


@pytest.mark.asyncio
async def test_fetch_issue_details_and_repository_details():
    """Verify fetch_issue_details and fetch_repository_details gracefully return None on error."""
    # Network error on issue details returns None
    with patch.object(httpx.AsyncClient, "get", side_effect=httpx.ReadTimeout("Timed out")):
        res = await fetch_issue_details("org", "repo", 42)
        assert res is None

    # Network error on repo details returns None
    with patch.object(
        httpx.AsyncClient, "get", side_effect=httpx.ConnectError("Connection refused")
    ):
        res = await fetch_repository_details("org", "repo")
        assert res is None


@pytest.mark.asyncio
async def test_admin_sync_github_outage_returns_502(client, admin_headers):
    """Admin sync endpoint must return 502 on GitHub outage, never 500 or silent success."""
    # Create project and repository first
    proj_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "outage-org/main-repo", "description": "Testing sync failure"},
        headers=admin_headers,
    )
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    repo_resp = await client.post(
        f"/api/v1/projects/{project_id}/repositories",
        json={"github_repo": "outage-org/outage-repo"},
        headers=admin_headers,
    )
    assert repo_resp.status_code == 201
    repo_id = repo_resp.json()["id"]

    # Simulate GitHub 503 outage during sync
    outage_resp = httpx.Response(
        503, text="Service Unavailable", request=httpx.Request("GET", "https://api.github.com")
    )
    with patch.object(httpx.AsyncClient, "get", return_value=outage_resp):
        sync_resp = await client.post(
            f"/api/v1/admin/repositories/{repo_id}/sync",
            headers=admin_headers,
        )
        assert sync_resp.status_code == 502
        assert "GitHub API returned error 503" in sync_resp.json()["detail"]


@pytest.mark.asyncio
async def test_public_repo_issues_github_outage_returns_502(client, admin_headers):
    """GET /repositories/{id}/issues must return 502 on outage, never 500 or silent empty list."""
    proj_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "public-org/main-repo", "description": "Public listing outage"},
        headers=admin_headers,
    )
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    repo_resp = await client.post(
        f"/api/v1/projects/{project_id}/repositories",
        json={"github_repo": "public-org/public-repo"},
        headers=admin_headers,
    )
    assert repo_resp.status_code == 201
    repo_id = repo_resp.json()["id"]

    # Simulate network failure only on GitHub calls, not the test client
    orig_get = httpx.AsyncClient.get

    async def mock_github_failure(self, url, *args, **kwargs):
        if "api.github.com" in str(url):
            raise httpx.ConnectError("Connection refused")
        return await orig_get(self, url, *args, **kwargs)

    with patch.object(httpx.AsyncClient, "get", mock_github_failure):
        resp = await client.get(f"/api/v1/repositories/{repo_id}/issues")
        assert resp.status_code == 502
        assert "Failed to communicate with GitHub" in resp.json()["detail"]
