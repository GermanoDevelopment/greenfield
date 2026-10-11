"""PR-to-bounty binding rules and webhook idempotency (#28)."""

import hashlib
import hmac
import json

import pytest

from app.core.config import get_settings
from app.core.security import create_access_token
from app.db.base import BountyModel, UserModel
from app.services.bounty_service import _references_issue

ISSUE_URL = "https://github.com/GermanoDevelopment/greenfield/issues/1"
PR_URL = "https://github.com/GermanoDevelopment/greenfield/pull/7"
WEBHOOK_SECRET = "webhook-secret-123"


@pytest.fixture
async def assigned_bounty(client, auth_headers, hunter_headers, mock_github_issue_open):
    project = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield"},
        headers=auth_headers,
    )
    bounty = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project.json()["id"],
            "issue_url": ISSUE_URL,
            "amount_usdc": 50_000_000,
        },
        headers=auth_headers,
    )
    bounty_id = bounty.json()["id"]
    resp = await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers)
    assert resp.status_code == 200
    return bounty_id


async def _submit(client, bounty_id, headers, pr_url=PR_URL):
    return await client.post(
        f"/api/v1/bounties/{bounty_id}/submit", json={"pr_url": pr_url}, headers=headers
    )


async def _status(session_factory, bounty_id) -> str:
    async with session_factory() as session:
        return (await session.get(BountyModel, bounty_id)).status


# --- Submit -----------------------------------------------------------------


async def test_submit_valid_pr_stores_canonical_url(
    client, assigned_bounty, hunter_headers, mock_github_pr_merged
):
    mock_github_pr_merged["result"] = False  # still open is fine at submit time
    resp = await _submit(client, assigned_bounty, hunter_headers, PR_URL + "/files")
    assert resp.status_code == 200
    assert resp.json()["status"] == "SUBMITTED"
    assert resp.json()["pr_url"] == PR_URL


@pytest.mark.parametrize(
    "pr_url,overrides,message",
    [
        ("https://github.com/someone/fork/pull/7", {}, "must target"),
        (PR_URL, {"base_repo": "someone/fork"}, "must target"),
        (PR_URL, {"author_id": 4242}, "authored by the assigned hunter"),
        (PR_URL, {"body": "Small cleanup", "title": "Refactor"}, "reference issue #1"),
        (PR_URL, {"body": "Closes #12"}, "reference issue #1"),
        (PR_URL, {"body": "Closes other/repo#1"}, "reference issue #1"),
        (PR_URL, {"result": False, "state": "closed"}, "closed without being merged"),
    ],
)
async def test_submit_rejects_unbound_pr(
    client, assigned_bounty, hunter_headers, mock_github_pr_merged, pr_url, overrides, message
):
    mock_github_pr_merged.update(overrides)
    resp = await _submit(client, assigned_bounty, hunter_headers, pr_url)
    assert resp.status_code == 422
    assert message in resp.json()["detail"]


async def test_submit_requires_linked_github_account(
    client, assigned_bounty, session_factory, mock_github_pr_merged
):
    # Email/password users have no github_id; move the assignment to one.
    async with session_factory() as session:
        user = UserModel(username="carol", email="carol@example.com")
        session.add(user)
        await session.flush()
        bounty = await session.get(BountyModel, assigned_bounty)
        bounty.hunter_id = user.id
        await session.commit()
        token = create_access_token(user.id, user.username)

    resp = await _submit(client, assigned_bounty, {"Authorization": f"Bearer {token}"}, PR_URL)
    assert resp.status_code == 422
    assert "Link your GitHub account" in resp.json()["detail"]


async def test_submit_when_github_unreachable(
    client, assigned_bounty, hunter_headers, mock_github_pr_merged
):
    mock_github_pr_merged["result"] = None
    resp = await _submit(client, assigned_bounty, hunter_headers)
    assert resp.status_code == 409


async def test_same_pr_cannot_back_two_bounties(
    client, auth_headers, hunter_headers, assigned_bounty, session_factory, mock_github_pr_merged
):
    assert (await _submit(client, assigned_bounty, hunter_headers)).status_code == 200

    async with session_factory() as session:
        first = await session.get(BountyModel, assigned_bounty)
        second = BountyModel(
            project_id=first.project_id,
            issuer_id=first.issuer_id,
            hunter_id=first.hunter_id,
            issue_url=ISSUE_URL,
            amount_usdc=1,
            status="ASSIGNED",
        )
        session.add(second)
        await session.commit()
        second_id = second.id

    resp = await _submit(client, second_id, hunter_headers)
    assert resp.status_code == 409
    assert "already linked" in resp.json()["detail"]


# --- Complete re-checks the binding -------------------------------------------


async def test_complete_rechecks_binding(
    client, assigned_bounty, auth_headers, hunter_headers, session_factory, mock_github_pr_merged
):
    assert (await _submit(client, assigned_bounty, hunter_headers)).status_code == 200

    # PR edited after submission so it no longer references the issue.
    mock_github_pr_merged["body"] = "Unrelated change"
    resp = await client.post(f"/api/v1/bounties/{assigned_bounty}/complete", headers=auth_headers)
    assert resp.status_code == 422
    assert await _status(session_factory, assigned_bounty) == "SUBMITTED"

    mock_github_pr_merged["body"] = "Fixes GermanoDevelopment/greenfield#1"
    resp = await client.post(f"/api/v1/bounties/{assigned_bounty}/complete", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "CLAIMABLE"


# --- Webhook ----------------------------------------------------------------


def _webhook_headers(body: bytes, event: str, delivery: str | None) -> dict:
    signature = hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    headers = {
        "X-GitHub-Event": event,
        "Content-Type": "application/json",
        "X-Hub-Signature-256": f"sha256={signature}",
    }
    if delivery:
        headers["X-GitHub-Delivery"] = delivery
    return headers


async def _send_merged(client, delivery: str | None = None):
    body = json.dumps(
        {"action": "closed", "pull_request": {"merged": True, "html_url": PR_URL}}
    ).encode()
    return await client.post(
        "/api/v1/webhooks/github",
        content=body,
        headers=_webhook_headers(body, "pull_request", delivery),
    )


@pytest.fixture
def webhook_secret(monkeypatch):
    monkeypatch.setattr(get_settings(), "github_webhook_secret", WEBHOOK_SECRET)


async def test_webhook_merge_with_broken_binding_does_not_complete(
    client, assigned_bounty, hunter_headers, session_factory, mock_github_pr_merged, webhook_secret
):
    assert (await _submit(client, assigned_bounty, hunter_headers)).status_code == 200
    mock_github_pr_merged["author_id"] = 4242

    resp = await _send_merged(client, "delivery-1")
    assert resp.status_code == 200
    assert "not completed" in resp.json()["detail"]
    assert await _status(session_factory, assigned_bounty) == "SUBMITTED"


async def test_webhook_merge_completes_bounty(
    client, assigned_bounty, hunter_headers, session_factory, mock_github_pr_merged, webhook_secret
):
    assert (await _submit(client, assigned_bounty, hunter_headers)).status_code == 200
    resp = await _send_merged(client, "delivery-1")
    assert resp.json()["detail"] == f"Bounty {assigned_bounty} completed"
    assert await _status(session_factory, assigned_bounty) == "CLAIMABLE"


async def test_webhook_replayed_delivery_is_ignored(
    client, assigned_bounty, hunter_headers, session_factory, mock_github_pr_merged, webhook_secret
):
    assert (await _submit(client, assigned_bounty, hunter_headers)).status_code == 200

    # First delivery is processed (binding fails, so the bounty stays SUBMITTED)...
    mock_github_pr_merged["author_id"] = 4242
    first = await _send_merged(client, "delivery-1")
    assert "not completed" in first.json()["detail"]

    # ...and replaying the same delivery has no effect, even if it would now succeed.
    mock_github_pr_merged["author_id"] = 789
    replay = await _send_merged(client, "delivery-1")
    assert replay.json()["detail"] == "Duplicate delivery ignored"
    assert await _status(session_factory, assigned_bounty) == "SUBMITTED"

    # A new delivery is processed normally.
    fresh = await _send_merged(client, "delivery-2")
    assert fresh.json()["detail"] == f"Bounty {assigned_bounty} completed"


async def test_issue_webhook_matches_repository_by_full_name_only(
    client, admin_headers, webhook_secret
):
    resp = await client.post(
        "/api/v1/admin/projects",
        json={"github_repo": "solana-labs/solinpy"},
        headers=admin_headers,
    )
    assert resp.status_code == 201

    def payload(full_name: str) -> bytes:
        owner, name = full_name.split("/")
        return json.dumps(
            {
                "action": "opened",
                "issue": {
                    "number": 5,
                    "title": "t",
                    "html_url": f"https://github.com/{full_name}/issues/5",
                    "state": "open",
                },
                "repository": {"full_name": full_name, "name": name, "owner": {"login": owner}},
            }
        ).encode()

    # Same short name, different owner: must not be attributed to solana-labs/solinpy.
    other = payload("someone-else/solinpy")
    resp = await client.post(
        "/api/v1/webhooks/github", content=other, headers=_webhook_headers(other, "issues", None)
    )
    assert resp.json()["detail"] == "Event ignored"

    # Full name match is case-insensitive.
    same = payload("Solana-Labs/solinpy")
    resp = await client.post(
        "/api/v1/webhooks/github", content=same, headers=_webhook_headers(same, "issues", None)
    )
    assert "recorded" in resp.json()["detail"]


# --- Issue reference parsing --------------------------------------------------


@pytest.mark.parametrize(
    "text,expected",
    [
        ("Closes #1", True),
        ("fixes #1.", True),
        ("(#1)", True),
        ("Resolves GermanoDevelopment/greenfield#1", True),
        ("resolves germanodevelopment/GREENFIELD#1", True),
        ("See https://github.com/GermanoDevelopment/greenfield/issues/1", True),
        ("Closes #12", False),
        ("Closes #10", False),
        ("Closes other/greenfield#1", False),
        ("Closes GermanoDevelopment/greenfield-fork#1", False),
        ("See https://github.com/GermanoDevelopment/greenfield/issues/10", False),
        ("abc#1", False),
        ("", False),
    ],
)
def test_references_issue(text, expected):
    assert _references_issue(text, "GermanoDevelopment", "greenfield", 1) is expected
