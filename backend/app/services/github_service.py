import re
import time
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.exceptions import DomainError

GITHUB_API = "https://api.github.com"

_ISSUE_URL_RE = re.compile(r"github\.com/([\w.-]+)/([\w.-]+)/issues/(\d+)")
_PR_URL_RE = re.compile(r"github\.com/([\w.-]+)/([\w.-]+)/pull/(\d+)")

_ISSUES_CACHE: dict[str, tuple[float, list[dict[str, Any]]]] = {}
ISSUES_CACHE_TTL_SECONDS = 60.0


def clear_issues_cache() -> None:
    _ISSUES_CACHE.clear()


class GitHubServiceError(DomainError):
    def __init__(self, detail: str = "GitHub API error", status_code: int = 502):
        super().__init__(status_code=status_code, detail=detail)


def _auth_headers(access_token: str | None = None) -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = access_token or get_settings().github_token
    if token:
        headers["Authorization"] = f"Bearer {token}"
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


async def fetch_pull_request(pr_url: str) -> dict[str, Any] | None:
    """Dados do PR usados nas regras de vínculo PR→bounty; None se não der para consultar."""
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
    data = resp.json()
    user = data.get("user") or {}
    base_repo = (data.get("base") or {}).get("repo") or {}
    return {
        "html_url": data.get("html_url"),
        "number": data.get("number"),
        "state": data.get("state"),
        "merged": data.get("merged") is True,
        "author_id": user.get("id"),
        "author_login": user.get("login"),
        "base_repo": base_repo.get("full_name"),
        "title": data.get("title") or "",
        "body": data.get("body") or "",
    }


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


async def fetch_repository_issues(
    owner: str,
    repo: str,
    state: str = "open",
    access_token: str | None = None,
    bypass_cache: bool = False,
    per_page: int = 100,
) -> list[dict[str, Any]]:
    """
    Fetch issues from a GitHub repo, paginating results, filtering out PRs,
    and caching public listings.
    """
    cache_key = f"{owner.lower()}/{repo.lower()}:{state}"
    now = time.monotonic()
    if not bypass_cache and access_token is None:
        if cache_key in _ISSUES_CACHE:
            cached_time, cached_data = _ISSUES_CACHE[cache_key]
            if now - cached_time < ISSUES_CACHE_TTL_SECONDS:
                return cached_data

    issues: list[dict[str, Any]] = []
    page = 1
    max_pages = 50

    async with httpx.AsyncClient(timeout=15) as client:
        while page <= max_pages:
            try:
                resp = await client.get(
                    f"{GITHUB_API}/repos/{owner}/{repo}/issues",
                    params={"state": state, "per_page": per_page, "page": page},
                    headers=_auth_headers(access_token),
                )
            except httpx.HTTPError as err:
                raise GitHubServiceError(
                    f"Failed to communicate with GitHub: {err}", status_code=502
                ) from err

            if resp.status_code == 404:
                raise GitHubServiceError(
                    f"GitHub repository {owner}/{repo} not found", status_code=404
                )
            if resp.status_code in (403, 429):
                raise GitHubServiceError(
                    f"GitHub API rate limit exceeded ({resp.status_code})", status_code=429
                )
            if resp.status_code != 200:
                raise GitHubServiceError(
                    f"GitHub API returned error {resp.status_code}: {resp.text}",
                    status_code=502,
                )

            data = resp.json()
            if not isinstance(data, list):
                raise GitHubServiceError("Unexpected GitHub response format", status_code=502)

            for item in data:
                # GitHub /issues endpoint also returns pull requests; filter them out
                if "pull_request" in item:
                    continue

                raw_labels = item.get("labels", [])
                labels = [lbl["name"] if isinstance(lbl, dict) else str(lbl) for lbl in raw_labels]
                author_login = item.get("user", {}).get("login") if item.get("user") else None

                issues.append(
                    {
                        "number": item["number"],
                        "title": item.get("title", ""),
                        "body": item.get("body"),
                        "html_url": item["html_url"],
                        "state": item.get("state", state),
                        "author_username": author_login,
                        "labels": labels,
                    }
                )

            if len(data) < per_page:
                break
            page += 1

    if access_token is None:
        _ISSUES_CACHE[cache_key] = (now, issues)

    return issues


async def fetch_issue_details(
    owner: str, repo: str, number: int, access_token: str | None = None
) -> dict[str, Any] | None:
    """Fetch details of a single GitHub issue without comments."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/issues/{number}",
                headers=_auth_headers(access_token),
            )
    except httpx.HTTPError:
        return None

    if resp.status_code != 200:
        return None

    item = resp.json()
    if "pull_request" in item:
        return None

    raw_labels = item.get("labels", [])
    labels = [lbl["name"] if isinstance(lbl, dict) else str(lbl) for lbl in raw_labels]

    return {
        "number": item["number"],
        "title": item.get("title", ""),
        "body": item.get("body"),
        "html_url": item["html_url"],
        "state": item.get("state", "open"),
        "author_username": item.get("user", {}).get("login") if item.get("user") else None,
        "labels": labels,
    }


async def fetch_repository_details(
    owner: str, repo: str, access_token: str | None = None
) -> dict[str, Any] | None:
    """Fetch live metadata of a GitHub repository from the REST API."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}",
                headers=_auth_headers(access_token),
            )
    except httpx.HTTPError:
        return None

    if resp.status_code != 200:
        return None

    data = resp.json()
    return {
        "owner": data.get("owner", {}).get("login", owner),
        "name": data.get("name", repo),
        "full_name": data.get("full_name", f"{owner}/{repo}"),
        "github_repo_id": data.get("id"),
        "description": data.get("description"),
        "default_branch": data.get("default_branch", "main"),
        "open_issues_count": data.get("open_issues_count", 0),
        "stargazers_count": data.get("stargazers_count", 0),
        "html_url": data.get("html_url", f"https://github.com/{owner}/{repo}"),
    }
