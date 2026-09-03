import hashlib
import hmac
import json

from app.core.config import get_settings

WEBHOOK_BODY = {
    "action": "closed",
    "pull_request": {"merged": True, "html_url": "https://github.com/o/r/pull/7"},
}


def _signature(body: bytes, secret: str) -> str:
    return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


async def test_webhook_ping(client):
    resp = await client.post(
        "/api/v1/webhooks/github",
        content=b"{}",
        headers={"X-GitHub-Event": "ping", "Content-Type": "application/json"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"detail": "pong"}


async def test_webhook_invalid_json(client):
    resp = await client.post(
        "/api/v1/webhooks/github",
        content=b"not-json",
        headers={"X-GitHub-Event": "push", "Content-Type": "application/json"},
    )
    assert resp.status_code == 400


async def test_webhook_ignores_other_events(client):
    resp = await client.post(
        "/api/v1/webhooks/github",
        content=json.dumps({"action": "opened", "pull_request": {"merged": False}}).encode(),
        headers={"X-GitHub-Event": "pull_request", "Content-Type": "application/json"},
    )
    assert resp.status_code == 200
    assert resp.json()["detail"] == "Event ignored"


async def test_webhook_signature_enforced_when_secret_set(client, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "github_webhook_secret", "webhook-secret-123")
    body = json.dumps(WEBHOOK_BODY).encode()

    resp = await client.post(
        "/api/v1/webhooks/github",
        content=body,
        headers={
            "X-GitHub-Event": "pull_request",
            "Content-Type": "application/json",
            "X-Hub-Signature-256": "sha256=bad",
        },
    )
    assert resp.status_code == 403

    resp = await client.post(
        "/api/v1/webhooks/github",
        content=body,
        headers={
            "X-GitHub-Event": "pull_request",
            "Content-Type": "application/json",
            "X-Hub-Signature-256": _signature(body, "webhook-secret-123"),
        },
    )
    assert resp.status_code == 200
