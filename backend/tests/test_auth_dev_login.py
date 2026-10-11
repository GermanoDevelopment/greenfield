"""Dev-only login shortcut, enabled only by an explicit ENABLE_DEV_LOGIN=true."""

import os
import subprocess
import sys

import pytest

from app.api.v1.auth import _dev_github_id
from app.core.config import Settings, get_settings


@pytest.fixture
def dev_login_on(monkeypatch):
    monkeypatch.setattr(get_settings(), "enable_dev_login", True)


def test_dev_login_disabled_by_default(monkeypatch):
    monkeypatch.delenv("ENABLE_DEV_LOGIN", raising=False)
    assert Settings(_env_file=None).enable_dev_login is False


async def test_auth_config_reports_defaults(client):
    resp = await client.get("/api/v1/auth/config")
    assert resp.status_code == 200
    assert resp.json() == {"github_oauth_configured": False, "dev_login_enabled": False}


async def test_dev_login_404_when_flag_off(client):
    # OAuth is not configured here either: that alone no longer enables dev-login.
    resp = await client.post("/api/v1/auth/dev-login", json={"username": "dev-tester"})
    assert resp.status_code == 404


async def test_dev_login_creates_and_reuses_user(client, dev_login_on):
    config = await client.get("/api/v1/auth/config")
    assert config.json()["dev_login_enabled"] is True

    resp = await client.post("/api/v1/auth/dev-login", json={"username": "dev-tester"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["user"]["username"] == "dev-tester"
    assert body["user"]["github_id"] == _dev_github_id("dev-tester")

    me = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"}
    )
    assert me.status_code == 200
    assert me.json()["username"] == "dev-tester"

    resp2 = await client.post("/api/v1/auth/dev-login", json={"username": "dev-tester"})
    assert resp2.json()["user"]["id"] == body["user"]["id"]


async def test_dev_login_disabled_when_github_oauth_configured(client, dev_login_on, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "github_client_id", "some-id")
    monkeypatch.setattr(settings, "github_client_secret", "some-secret")

    resp = await client.post("/api/v1/auth/dev-login", json={"username": "dev-tester"})
    assert resp.status_code == 404
    assert (await client.get("/api/v1/auth/config")).json()["dev_login_enabled"] is False


@pytest.mark.parametrize("username", ["dev-tester", "GermanoDevelopment", "a", "ção"])
def test_dev_github_id_is_negative(username):
    # Real GitHub ids are positive, so a fake id can never collide with one.
    assert -(2**31) <= _dev_github_id(username) < 0


def test_dev_github_id_is_stable_across_processes():
    # hash() is salted per process (PYTHONHASHSEED); the fake id must not be.
    code = "from app.api.v1.auth import _dev_github_id; print(_dev_github_id('dev-tester'))"
    ids = {
        subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True,
            text=True,
            check=True,
            env={**os.environ, "PYTHONHASHSEED": seed},
        ).stdout.strip()
        for seed in ("1", "2", "3")
    }
    assert ids == {str(_dev_github_id("dev-tester"))}
