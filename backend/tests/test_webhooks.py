import hashlib
import hmac
import json

import pytest

from app.core.config import get_settings

SECRET = "webhook-secret-123"
URL = "/api/v1/webhooks/github"
WEBHOOK_BODY = {
    "action": "closed",
    "pull_request": {"merged": True, "html_url": "https://github.com/o/r/pull/7"},
}


def _signature(body: bytes, secret: str = SECRET) -> str:
    return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def _headers(event: str, body: bytes | None = None, signature: str | None = None) -> dict:
    headers = {"X-GitHub-Event": event, "Content-Type": "application/json"}
    if signature is not None:
        headers["X-Hub-Signature-256"] = signature
    elif body is not None:
        headers["X-Hub-Signature-256"] = _signature(body)
    return headers


@pytest.fixture
def webhook_secret(monkeypatch):
    monkeypatch.setattr(get_settings(), "github_webhook_secret", SECRET)


async def test_webhook_ping(client, webhook_secret):
    body = b"{}"
    resp = await client.post(URL, content=body, headers=_headers("ping", body))
    assert resp.status_code == 200
    assert resp.json() == {"detail": "pong"}


async def test_webhook_invalid_json(client, webhook_secret):
    body = b"not-json"
    resp = await client.post(URL, content=body, headers=_headers("push", body))
    assert resp.status_code == 400


async def test_webhook_ignores_other_events(client, webhook_secret):
    body = json.dumps({"action": "opened", "pull_request": {"merged": False}}).encode()
    resp = await client.post(URL, content=body, headers=_headers("pull_request", body))
    assert resp.status_code == 200
    assert resp.json()["detail"] == "Event ignored"


async def test_webhook_accepts_valid_signature(client, webhook_secret):
    body = json.dumps(WEBHOOK_BODY).encode()
    resp = await client.post(URL, content=body, headers=_headers("pull_request", body))
    assert resp.status_code == 200


async def test_webhook_rejects_wrong_signature(client, webhook_secret):
    body = json.dumps(WEBHOOK_BODY).encode()
    resp = await client.post(
        URL, content=body, headers=_headers("pull_request", signature="sha256=bad")
    )
    assert resp.status_code == 403


async def test_webhook_rejects_signature_from_other_secret(client, webhook_secret):
    body = json.dumps(WEBHOOK_BODY).encode()
    resp = await client.post(
        URL,
        content=body,
        headers=_headers("pull_request", signature=_signature(body, "other-secret")),
    )
    assert resp.status_code == 403


async def test_webhook_rejects_missing_signature(client, webhook_secret):
    body = json.dumps(WEBHOOK_BODY).encode()
    resp = await client.post(URL, content=body, headers=_headers("pull_request"))
    assert resp.status_code == 403


async def test_webhook_rejects_everything_when_secret_unset(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "github_webhook_secret", "")
    body = json.dumps(WEBHOOK_BODY).encode()

    for headers in (
        _headers("pull_request"),
        _headers("pull_request", signature=_signature(body, "")),
        _headers("ping", signature="sha256=anything"),
    ):
        resp = await client.post(URL, content=body, headers=headers)
        assert resp.status_code == 403


async def test_webhook_merged_pr_completes_submitted_bounty(
    client,
    auth_headers,
    hunter_headers,
    webhook_secret,
    mock_github_issue_open,
    mock_github_pr_merged,
):
    issue_url = "https://github.com/GermanoDevelopment/greenfield/issues/1"
    pr_url = "https://github.com/GermanoDevelopment/greenfield/pull/7"

    # Create project
    proj_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield", "description": "MVP"},
        headers=auth_headers,
    )
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    # Create bounty
    bounty_resp = await client.post(
        "/api/v1/bounties",
        json={"project_id": project_id, "issue_url": issue_url, "points": 100},
        headers=auth_headers,
    )
    assert bounty_resp.status_code == 201
    bounty_id = bounty_resp.json()["id"]

    # Hunter assigns and submits
    await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers)
    submit_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": pr_url},
        headers=hunter_headers,
    )
    assert submit_resp.status_code == 200

    # Ensure bounty is in SUBMITTED state
    bounty_get = (await client.get(f"/api/v1/bounties/{bounty_id}")).json()
    assert bounty_get["status"] == "SUBMITTED"

    # Send webhook for merged PR
    webhook_payload = {
        "action": "closed",
        "pull_request": {"merged": True, "html_url": pr_url},
    }
    body = json.dumps(webhook_payload).encode()
    delivery_headers = _headers("pull_request", body)
    delivery_headers["X-GitHub-Delivery"] = "deliv-uuid-001"

    resp = await client.post(URL, content=body, headers=delivery_headers)
    assert resp.status_code == 200
    assert resp.json()["detail"] == f"Bounty {bounty_id} completed"

    # Verify bounty status is now COMPLETED
    bounty_after = (await client.get(f"/api/v1/bounties/{bounty_id}")).json()
    assert bounty_after["status"] == "COMPLETED"

    # Test duplicate delivery idempotency
    dup_resp = await client.post(URL, content=body, headers=delivery_headers)
    assert dup_resp.status_code == 200
    assert dup_resp.json()["detail"] == "Duplicate delivery ignored"
