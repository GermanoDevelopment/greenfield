"""Exercises the greenfield escrow program wiring in bounty_service.py.

Default settings run with on-chain integration disabled (empty
SOLANA_PROGRAM_ID/SOLANA_AUTHORITY_SECRET_KEY — see test_bounties.py), so
these tests force `solana_service.is_onchain_enabled()` on and mock the
actual RPC calls, the same way test_bounties.py already mocks GitHub/escrow
checks.
"""

import pytest

from app.core.security import create_access_token
from app.db.base import UserModel
from app.services import solana_service
from app.services.solana_service import SolanaServiceError

FAKE_SIGNATURE = "5" * 88


@pytest.fixture
def onchain_enabled(monkeypatch):
    monkeypatch.setattr(solana_service, "is_onchain_enabled", lambda *a, **k: True)


@pytest.fixture
def mock_onchain_calls(monkeypatch, onchain_enabled):
    calls: list[tuple[str, tuple]] = []

    monkeypatch.setattr(
        solana_service, "create_bounty_onchain", _tracked(calls, "create_bounty_onchain")
    )
    monkeypatch.setattr(
        solana_service, "assign_developer_onchain", _tracked(calls, "assign_developer_onchain")
    )
    monkeypatch.setattr(
        solana_service, "approve_claim_onchain", _tracked(calls, "approve_claim_onchain")
    )
    monkeypatch.setattr(
        solana_service, "cancel_bounty_onchain", _tracked(calls, "cancel_bounty_onchain")
    )
    return calls


def _tracked(calls: list, name: str):
    async def fake(*args):
        calls.append((name, args))
        return FAKE_SIGNATURE

    return fake


@pytest.fixture
async def wallet_issuer(session_factory):
    async with session_factory() as session:
        u = UserModel(
            github_id=111,
            username="maintainer",
            wallet="4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
        )
        session.add(u)
        await session.commit()
        return {"id": u.id, "username": u.username}


@pytest.fixture
def issuer_headers(wallet_issuer):
    token = create_access_token(wallet_issuer["id"], wallet_issuer["username"])
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def wallet_hunter(session_factory):
    async with session_factory() as session:
        u = UserModel(
            github_id=222,
            username="developer",
            wallet="9drGEUx7RqXb8iATtX2CP6NU1FHyoppF3LyMF8UPzhLb",
        )
        session.add(u)
        await session.commit()
        return {"id": u.id, "username": u.username}


@pytest.fixture
def hunter_wallet_headers(wallet_hunter):
    token = create_access_token(wallet_hunter["id"], wallet_hunter["username"])
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def onchain_project(client, issuer_headers):
    resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield", "description": "MVP"},
        headers=issuer_headers,
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture
async def onchain_bounty(client, issuer_headers, onchain_project, mock_github_issue_open):
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": onchain_project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/1",
            "amount_usdc": 50_000_000,
        },
        headers=issuer_headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def test_create_bounty_calls_create_bounty_onchain(
    client, issuer_headers, onchain_project, mock_github_issue_open, mock_onchain_calls
):
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": onchain_project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/9",
            "amount_usdc": 50_000_000,
        },
        headers=issuer_headers,
    )
    assert resp.status_code == 201
    bounty_id = resp.json()["id"]

    assert len(mock_onchain_calls) == 1
    name, args = mock_onchain_calls[0]
    assert name == "create_bounty_onchain"
    assert args == (bounty_id, 50_000_000, "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU")


async def test_create_bounty_requires_maintainer_wallet(
    client, auth_headers, mock_github_issue_open, onchain_enabled
):
    # `auth_headers` comes from conftest's plain `user` fixture, which has no
    # wallet set — with on-chain integration enabled, create_bounty must
    # refuse rather than reserve funds for a maintainer with no known address.
    project_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield", "description": "MVP"},
        headers=auth_headers,
    )
    assert project_resp.status_code == 201

    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project_resp.json()["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/9",
            "amount_usdc": 50_000_000,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422
    assert "Connect a Solana wallet" in resp.json()["detail"]


async def test_create_bounty_rolls_back_on_chain_rejection(
    client, issuer_headers, onchain_project, mock_github_issue_open, onchain_enabled, monkeypatch
):
    async def fail(*args):
        raise SolanaServiceError("insufficient treasury balance")

    monkeypatch.setattr(solana_service, "create_bounty_onchain", fail)

    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": onchain_project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/10",
            "amount_usdc": 50_000_000,
        },
        headers=issuer_headers,
    )
    assert resp.status_code == 422
    assert "On-chain transaction failed" in resp.json()["detail"]

    # No orphaned row was left behind by the failed on-chain reservation.
    list_resp = await client.get(
        f"/api/v1/bounties?project_id={onchain_project['id']}&status=OPEN"
    )
    assert list_resp.json() == []


async def test_assign_bounty_calls_assign_developer_onchain(
    client, issuer_headers, hunter_wallet_headers, onchain_bounty, mock_onchain_calls
):
    resp = await client.post(
        f"/api/v1/bounties/{onchain_bounty['id']}/assign", headers=hunter_wallet_headers
    )
    assert resp.status_code == 200
    assert len(mock_onchain_calls) == 1
    name, args = mock_onchain_calls[0]
    assert name == "assign_developer_onchain"
    assert args == (onchain_bounty["id"], "9drGEUx7RqXb8iATtX2CP6NU1FHyoppF3LyMF8UPzhLb")


async def test_complete_bounty_calls_approve_claim_onchain(
    client,
    issuer_headers,
    hunter_wallet_headers,
    onchain_bounty,
    mock_onchain_calls,
    mock_github_pr_merged,
):
    bounty_id = onchain_bounty["id"]
    await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_wallet_headers)
    await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/GermanoDevelopment/greenfield/pull/1"},
        headers=hunter_wallet_headers,
    )

    resp = await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=issuer_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "COMPLETED"

    onchain_names = [name for name, _ in mock_onchain_calls]
    assert "assign_developer_onchain" in onchain_names
    assert "approve_claim_onchain" in onchain_names


async def test_record_claim_requires_onchain_confirmation(
    client,
    issuer_headers,
    hunter_wallet_headers,
    onchain_bounty,
    mock_onchain_calls,
    mock_github_pr_merged,
    monkeypatch,
):
    bounty_id = onchain_bounty["id"]
    await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_wallet_headers)
    await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/GermanoDevelopment/greenfield/pull/1"},
        headers=hunter_wallet_headers,
    )
    await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=issuer_headers)

    async def not_yet_claimed(bounty_id):
        return {"status": solana_service.BOUNTY_STATUS_READY_TO_CLAIM}

    monkeypatch.setattr(solana_service, "get_bounty_account", not_yet_claimed)

    resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/claimed",
        json={"tx_signature": FAKE_SIGNATURE},
        headers=hunter_wallet_headers,
    )
    assert resp.status_code == 422
    assert "not been confirmed" in resp.json()["detail"]

    async def claimed(bounty_id):
        return {"status": solana_service.BOUNTY_STATUS_CLAIMED}

    monkeypatch.setattr(solana_service, "get_bounty_account", claimed)

    resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/claimed",
        json={"tx_signature": FAKE_SIGNATURE},
        headers=hunter_wallet_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "CLAIMED"
    assert resp.json()["claim_signature"] == FAKE_SIGNATURE


async def test_record_claim_forbidden_for_non_hunter(
    client,
    issuer_headers,
    hunter_wallet_headers,
    onchain_bounty,
    mock_onchain_calls,
    mock_github_pr_merged,
):
    bounty_id = onchain_bounty["id"]
    await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_wallet_headers)
    await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/GermanoDevelopment/greenfield/pull/1"},
        headers=hunter_wallet_headers,
    )
    await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=issuer_headers)

    resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/claimed",
        json={"tx_signature": FAKE_SIGNATURE},
        headers=issuer_headers,
    )
    assert resp.status_code == 403
