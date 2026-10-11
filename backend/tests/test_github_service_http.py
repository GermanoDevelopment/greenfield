import pytest
import respx

from app.core.config import get_settings
from app.services.github_service import (
    GITHUB_API,
    GitHubServiceError,
    _auth_headers,
    build_login_url,
    exchange_code_for_token,
    fetch_issue_details,
    fetch_pull_request,
    fetch_repository_details,
    fetch_repository_issues,
    get_authenticated_user,
    is_issue_open,
    parse_issue_url,
    parse_pr_url,
)


def test_auth_headers(monkeypatch):
    monkeypatch.setattr(get_settings(), "github_token", "default-token")
    headers = _auth_headers()
    assert headers["Authorization"] == "Bearer default-token"

    custom_headers = _auth_headers("custom-token")
    assert custom_headers["Authorization"] == "Bearer custom-token"

    monkeypatch.setattr(get_settings(), "github_token", "")
    no_token_headers = _auth_headers()
    assert "Authorization" not in no_token_headers


def test_parse_urls():
    assert parse_issue_url("https://github.com/owner/repo/issues/123") == ("owner", "repo", 123)
    assert parse_issue_url("https://gitlab.com/owner/repo/issues/123") is None
    assert parse_issue_url("https://github.com/owner/repo") is None

    assert parse_pr_url("https://github.com/owner/repo/pull/456") == ("owner", "repo", 456)
    assert parse_pr_url("https://github.com/owner/repo/issues/456") is None


async def test_build_login_url(monkeypatch):
    monkeypatch.setattr(get_settings(), "github_client_id", "my-client-id")
    url_no_state = await build_login_url()
    assert "client_id=my-client-id" in url_no_state
    assert "state=" not in url_no_state

    url_with_state = await build_login_url(state="xyz123")
    assert "state=xyz123" in url_with_state


@respx.mock
async def test_exchange_code_for_token_success(monkeypatch):
    monkeypatch.setattr(get_settings(), "github_client_id", "cid")
    monkeypatch.setattr(get_settings(), "github_client_secret", "csecret")

    respx.post("https://github.com/login/oauth/access_token").respond(
        status_code=200, json={"access_token": "gho_test12345", "token_type": "bearer"}
    )

    token = await exchange_code_for_token("test-code")
    assert token == "gho_test12345"


async def test_exchange_code_for_token_not_configured(monkeypatch):
    monkeypatch.setattr(get_settings(), "github_client_id", "")
    monkeypatch.setattr(get_settings(), "github_client_secret", "")

    with pytest.raises(GitHubServiceError, match="GitHub OAuth is not configured"):
        await exchange_code_for_token("any-code")


@respx.mock
async def test_exchange_code_for_token_failure_status(monkeypatch):
    monkeypatch.setattr(get_settings(), "github_client_id", "cid")
    monkeypatch.setattr(get_settings(), "github_client_secret", "csecret")

    respx.post("https://github.com/login/oauth/access_token").respond(status_code=400)

    with pytest.raises(GitHubServiceError, match="GitHub OAuth token exchange failed"):
        await exchange_code_for_token("bad-code")


@respx.mock
async def test_exchange_code_for_token_error_body(monkeypatch):
    monkeypatch.setattr(get_settings(), "github_client_id", "cid")
    monkeypatch.setattr(get_settings(), "github_client_secret", "csecret")

    respx.post("https://github.com/login/oauth/access_token").respond(
        status_code=200, json={"error_description": "The code passed is incorrect or expired."}
    )

    with pytest.raises(GitHubServiceError, match="The code passed is incorrect"):
        await exchange_code_for_token("bad-code")


@respx.mock
async def test_get_authenticated_user_success():
    respx.get(f"{GITHUB_API}/user").respond(
        status_code=200,
        json={"id": 12345, "login": "octocat", "avatar_url": "https://avatar.url/octocat"},
    )

    user = await get_authenticated_user("gho_test")
    assert user["github_id"] == 12345
    assert user["username"] == "octocat"
    assert user["avatar_url"] == "https://avatar.url/octocat"


@respx.mock
async def test_get_authenticated_user_failure():
    respx.get(f"{GITHUB_API}/user").respond(status_code=401)

    with pytest.raises(GitHubServiceError, match="Failed to fetch GitHub user"):
        await get_authenticated_user("invalid-token")


@respx.mock
async def test_is_issue_open():
    respx.get(f"{GITHUB_API}/repos/owner/repo/issues/1").respond(
        status_code=200, json={"state": "open"}
    )
    respx.get(f"{GITHUB_API}/repos/owner/repo/issues/2").respond(
        status_code=200, json={"state": "closed"}
    )
    respx.get(f"{GITHUB_API}/repos/owner/repo/issues/3").respond(status_code=404)

    assert await is_issue_open("https://github.com/owner/repo/issues/1") is True
    assert await is_issue_open("https://github.com/owner/repo/issues/2") is False
    assert await is_issue_open("https://github.com/owner/repo/issues/3") is None
    assert await is_issue_open("not-a-valid-url") is None


@respx.mock
async def test_fetch_pull_request():
    respx.get(f"{GITHUB_API}/repos/owner/repo/pulls/10").respond(
        status_code=200,
        json={
            "html_url": "https://github.com/owner/repo/pull/10",
            "number": 10,
            "state": "closed",
            "merged": True,
            "user": {"id": 99, "login": "pr-author"},
            "base": {"repo": {"full_name": "owner/repo"}},
            "title": "Fix bug",
            "body": "Fixes #1",
        },
    )
    respx.get(f"{GITHUB_API}/repos/owner/repo/pulls/11").respond(status_code=404)

    pr = await fetch_pull_request("https://github.com/owner/repo/pull/10")
    assert pr is not None
    assert pr["number"] == 10
    assert pr["merged"] is True
    assert pr["author_login"] == "pr-author"
    assert pr["base_repo"] == "owner/repo"

    assert await fetch_pull_request("https://github.com/owner/repo/pull/11") is None
    assert await fetch_pull_request("not-a-pr") is None


@respx.mock
async def test_fetch_repository_issues():
    respx.get(f"{GITHUB_API}/repos/owner/repo/issues?state=open&per_page=100").respond(
        status_code=200,
        json=[
            {
                "number": 1,
                "title": "Issue 1",
                "body": "Body 1",
                "html_url": "https://github.com/owner/repo/issues/1",
                "state": "open",
                "user": {"login": "user1"},
                "labels": [{"name": "bug"}, {"name": "p0"}],
            },
            {
                "number": 2,
                "title": "A Pull Request mistakenly returned",
                "pull_request": {"url": "https://api.github.com/repos/owner/repo/pulls/2"},
            },
        ],
    )

    issues = await fetch_repository_issues("owner", "repo")
    assert len(issues) == 1
    assert issues[0]["number"] == 1
    assert issues[0]["labels"] == ["bug", "p0"]
    assert issues[0]["author_username"] == "user1"

    respx.get(f"{GITHUB_API}/repos/owner/error_repo/issues?state=open&per_page=100").respond(
        status_code=500
    )
    assert await fetch_repository_issues("owner", "error_repo") == []


@respx.mock
async def test_fetch_issue_details():
    respx.get(f"{GITHUB_API}/repos/owner/repo/issues/1").respond(
        status_code=200,
        json={
            "number": 1,
            "title": "Issue Title",
            "body": "Issue Body",
            "html_url": "https://github.com/owner/repo/issues/1",
            "state": "open",
            "user": {"login": "issue_author"},
            "labels": [{"name": "feature"}],
        },
    )
    respx.get(f"{GITHUB_API}/repos/owner/repo/issues/2").respond(
        status_code=200,
        json={
            "number": 2,
            "pull_request": {"url": "..."},
        },
    )
    respx.get(f"{GITHUB_API}/repos/owner/repo/issues/3").respond(status_code=404)

    item1 = await fetch_issue_details("owner", "repo", 1)
    assert item1 is not None
    assert item1["number"] == 1
    assert item1["author_username"] == "issue_author"

    assert await fetch_issue_details("owner", "repo", 2) is None
    assert await fetch_issue_details("owner", "repo", 3) is None


@respx.mock
async def test_fetch_repository_details():
    respx.get(f"{GITHUB_API}/repos/owner/repo").respond(
        status_code=200,
        json={
            "id": 8888,
            "name": "repo",
            "full_name": "owner/repo",
            "description": "Awesome repo",
            "default_branch": "main",
            "open_issues_count": 5,
            "stargazers_count": 42,
            "html_url": "https://github.com/owner/repo",
            "owner": {"login": "owner"},
        },
    )
    respx.get(f"{GITHUB_API}/repos/owner/nonexistent").respond(status_code=404)

    details = await fetch_repository_details("owner", "repo")
    assert details is not None
    assert details["github_repo_id"] == 8888
    assert details["stargazers_count"] == 42

    assert await fetch_repository_details("owner", "nonexistent") is None
