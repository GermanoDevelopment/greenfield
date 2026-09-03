import re
from typing import Any

import httpx

from app.core.config import get_settings

GITHUB_API = "https://api.github.com"

_ISSUE_URL_RE = re.compile(r"github\.com/([\w.-]+)/([\w.-]+)/issues/(\d+)")
_PR_URL_RE = re.compile(r"github\.com/([\w.-]+)/([\w.-]+)/pull/(\d+)")


class GitHubServiceError(Exception):
    pass


def _auth_headers(access_token: str | None = None) -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    return headers


async def exchange_code_for_token(code: str) -> str:
    settings = get_settings()
    if not settings.github_client_id or not settings.github_client_secret:
        raise GitHubServiceError("GitHub OAuth is not configured")

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
                "redirect_uri": settings.github_redirect_uri,
            },
            headers={"Accept": "application/json"},
        )
    if resp.status_code != 200:
        raise GitHubServiceError(f"GitHub OAuth token exchange failed ({resp.status_code})")
    data = resp.json()
    if "access_token" not in data:
        raise GitHubServiceError(f"GitHub OAuth error: {data.get('error_description', data)}")
    return data["access_token"]


async def get_authenticated_user(access_token: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{GITHUB_API}/user", headers=_auth_headers(access_token))
    if resp.status_code != 200:
        raise GitHubServiceError("Failed to fetch GitHub user")
    data = resp.json()
    return {
        "github_id": data["id"],
        "username": data["login"],
        "avatar_url": data.get("avatar_url"),
    }


def parse_issue_url(url: str) -> tuple[str, str, int] | None:
    match = _ISSUE_URL_RE.search(url)
    if not match:
        return None
    owner, repo, number = match.group(1), match.group(2), int(match.group(3))
    return owner, repo, number


def parse_pr_url(url: str) -> tuple[str, str, int] | None:
    match = _PR_URL_RE.search(url)
    if not match:
        return None
    owner, repo, number = match.group(1), match.group(2), int(match.group(3))
    return owner, repo, number


async def is_issue_open(issue_url: str) -> bool | None:
    """Return True if the issue is open, False otherwise, None if it cannot be checked."""
    parsed = parse_issue_url(issue_url)
    if parsed is None:
        return None
    owner, repo, number = parsed
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/issues/{number}", headers=_auth_headers()
        )
    if resp.status_code != 200:
        return None
    return resp.json().get("state") == "open"


async def is_pr_merged(pr_url: str) -> bool | None:
    """Return True if the PR is merged, False otherwise, None if it cannot be checked."""
    parsed = parse_pr_url(pr_url)
    if parsed is None:
        return None
    owner, repo, number = parsed
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{number}", headers=_auth_headers()
        )
    if resp.status_code != 200:
        return None
    return resp.json().get("merged") is True


async def build_login_url(state: str | None = None) -> str:
    settings = get_settings()
    from urllib.parse import urlencode

    params: dict[str, str] = {
        "client_id": settings.github_client_id,
        "redirect_uri": settings.github_redirect_uri,
        "scope": "read:user",
    }
    if state:
        params["state"] = state
    return f"https://github.com/login/oauth/authorize?{urlencode(params)}"
