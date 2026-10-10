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
