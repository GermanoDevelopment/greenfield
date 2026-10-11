"""Test suite for Issue #24: Reconcile failed approvals and hunters without a wallet.

Tests cover:
1. Deferral of on-chain assignment when applicant has no wallet at accept time.
2. Safe failure transition to CLAIM_FAILED on complete when wallet is missing.
3. Automatic reconciliation and auto-retry when hunter connects their wallet via PATCH /users/me.
4. Manual retry endpoint (POST /bounties/{id}/retry) with exponential backoff enforcement.
5. Admin tooling for failed approvals (diagnostic list & batch retry endpoints).
6. Comprehensive audit trail logging (GET /bounties/{id}/audit-logs).
"""

from unittest.mock import AsyncMock, patch

import pytest

from app.services import solana_service

FAKE_SIGNATURE = "5" * 88
VALID_SOLANA_WALLET = "9drGEUx7RqXb8iATtX2CP6NU1FHyoppF3LyMF8UPzhLb"
MAINTAINER_WALLET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"


@pytest.fixture
def onchain_enabled(monkeypatch):
    monkeypatch.setattr(solana_service, "is_onchain_enabled", lambda *a, **k: True)


@pytest.fixture
def mock_onchain_tracker(monkeypatch, onchain_enabled):
    calls: list[tuple[str, tuple]] = []

    def _tracked(name: str):
        async def fake(*args):
            calls.append((name, args))
            return FAKE_SIGNATURE

        return fake

    monkeypatch.setattr(solana_service, "create_bounty_onchain", _tracked("create_bounty_onchain"))
    monkeypatch.setattr(
        solana_service, "assign_developer_onchain", _tracked("assign_developer_onchain")
    )
    monkeypatch.setattr(solana_service, "approve_claim_onchain", _tracked("approve_claim_onchain"))
    monkeypatch.setattr(solana_service, "cancel_bounty_onchain", _tracked("cancel_bounty_onchain"))
    return calls


@pytest.fixture
async def setup_bounty(client, auth_headers, mock_onchain_tracker):
    # Maintainer creates project
    p_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "acme/reconciliation-app"},
        headers=auth_headers,
    )
    assert p_resp.status_code == 201
    project_id = p_resp.json()["id"]

    # Maintainer connects wallet
    await client.patch(
        "/api/v1/users/me",
        json={"wallet": MAINTAINER_WALLET},
        headers=auth_headers,
    )

    # Maintainer creates bounty
    with patch("app.services.github_service.is_issue_open", AsyncMock(return_value=True)):
        b_resp = await client.post(
            "/api/v1/bounties",
            json={
                "project_id": project_id,
                "issue_url": "https://github.com/acme/reconciliation-app/issues/1",
                "points": 500,
                "issue_title": "Fix wallet reconciliation",
            },
            headers=auth_headers,
        )
        assert b_resp.status_code == 201
        return b_resp.json()


async def test_accept_applicant_without_wallet_defers_and_records_audit(
    client, auth_headers, hunter_headers, setup_bounty, mock_onchain_tracker
):
    bounty_id = setup_bounty["id"]

    # Hunter (bob, has no wallet) applies
    app_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/apply",
        json={"proposal": "I will fix this but I don't have a wallet configured yet."},
        headers=hunter_headers,
    )
    assert app_resp.status_code == 201
    applicant_id = app_resp.json()["id"]

    # Maintainer accepts bob
    accept_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/applicants/{applicant_id}/accept",
        headers=auth_headers,
    )
    assert accept_resp.status_code == 200
    bounty = accept_resp.json()
    assert bounty["status"] == "ASSIGNED"

    # On-chain assign was NOT called because wallet was missing, but bounty is not stuck
    onchain_assigns = [
        call for call in mock_onchain_tracker if call[0] == "assign_developer_onchain"
    ]
    assert len(onchain_assigns) == 0

    # Audit log was created recording deferred assignment
    logs_resp = await client.get(
        f"/api/v1/bounties/{bounty_id}/audit-logs",
        headers=auth_headers,
    )
    assert logs_resp.status_code == 200
    logs = logs_resp.json()
    assert len(logs) >= 1
    assert any(log["action"] == "ACCEPT_APPLICANT_DEFERRED_WALLET" for log in logs)


async def test_complete_without_wallet_moves_to_claim_failed_with_clear_error(
    client, auth_headers, hunter_headers, setup_bounty, mock_onchain_tracker, mock_github_pr_merged
):
    bounty_id = setup_bounty["id"]

    # Hunter applies and is accepted without wallet
    app_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/apply",
        json={"proposal": "Proposal"},
        headers=hunter_headers,
    )
    applicant_id = app_resp.json()["id"]
    await client.post(
        f"/api/v1/bounties/{bounty_id}/applicants/{applicant_id}/accept",
        headers=auth_headers,
    )

    # Hunter submits PR
    sub_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/acme/reconciliation-app/pull/1"},
        headers=hunter_headers,
    )
    assert sub_resp.status_code == 200

    # Maintainer completes with merged PR
    comp_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/complete",
        headers=auth_headers,
    )
    assert comp_resp.status_code == 200
    bounty = comp_resp.json()
    assert bounty["status"] == "CLAIM_FAILED"
    assert "wallet" in bounty["claim_error"].lower()

    # Audit log recorded approval failure
    logs_resp = await client.get(
        f"/api/v1/bounties/{bounty_id}/audit-logs",
        headers=auth_headers,
    )
    assert logs_resp.status_code == 200
    logs = logs_resp.json()
    assert any(log["action"] == "APPROVAL_FAILED" for log in logs)


async def test_hunter_connects_wallet_reconciles_onchain_and_auto_retries(
    client, auth_headers, hunter_headers, setup_bounty, mock_onchain_tracker, mock_github_pr_merged
):
    bounty_id = setup_bounty["id"]

    # Hunter applies, accepted, submits, and completes into CLAIM_FAILED
    app_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/apply",
        json={"proposal": "Proposal"},
        headers=hunter_headers,
    )
    applicant_id = app_resp.json()["id"]
    await client.post(
        f"/api/v1/bounties/{bounty_id}/applicants/{applicant_id}/accept",
        headers=auth_headers,
    )
    sub_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/acme/reconciliation-app/pull/1"},
        headers=hunter_headers,
    )
    assert sub_resp.status_code == 200

    comp_resp = await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers)
    assert comp_resp.status_code == 200

    # Verify bounty is currently CLAIM_FAILED
    b_before = (await client.get(f"/api/v1/bounties/{bounty_id}")).json()
    assert b_before["status"] == "CLAIM_FAILED"

    # Hunter now connects wallet via PATCH /users/me
    patch_resp = await client.patch(
        "/api/v1/users/me",
        json={"wallet": VALID_SOLANA_WALLET},
        headers=hunter_headers,
    )
    assert patch_resp.status_code == 200

    # On-chain assign was called with the new wallet
    assign_calls = [c for c in mock_onchain_tracker if c[0] == "assign_developer_onchain"]
    assert len(assign_calls) >= 1
    assert assign_calls[-1][1] == (bounty_id, VALID_SOLANA_WALLET)

    # Bounty was auto-retried and is now CLAIMABLE!
    b_after = (await client.get(f"/api/v1/bounties/{bounty_id}")).json()
    assert b_after["status"] == "CLAIMABLE"
    assert b_after["claim_error"] is None


async def test_manual_retry_endpoint_with_backoff_and_admin_force(
    client,
    auth_headers,
    hunter_headers,
    admin_headers,
    setup_bounty,
    mock_onchain_tracker,
    mock_github_pr_merged,
):
    bounty_id = setup_bounty["id"]

    # Hunter applies, accepted, submits, and completes into CLAIM_FAILED
    app_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/apply",
        json={"proposal": "Proposal"},
        headers=hunter_headers,
    )
    applicant_id = app_resp.json()["id"]
    await client.post(
        f"/api/v1/bounties/{bounty_id}/applicants/{applicant_id}/accept",
        headers=auth_headers,
    )
    sub_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/acme/reconciliation-app/pull/1"},
        headers=hunter_headers,
    )
    assert sub_resp.status_code == 200

    comp_resp = await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers)
    assert comp_resp.status_code == 200

    # First retry without wallet still fails and records retry attempt
    r1 = await client.post(f"/api/v1/bounties/{bounty_id}/retry", headers=hunter_headers)
    assert r1.status_code == 200
    assert r1.json()["status"] == "CLAIM_FAILED"
    assert r1.json()["retry_count"] == 1

    # Immediate second retry by hunter hits exponential backoff rate limit
    r2 = await client.post(f"/api/v1/bounties/{bounty_id}/retry", headers=hunter_headers)
    assert r2.status_code == 409
    assert "backoff" in r2.json()["detail"].lower()

    # Now hunter connects wallet
    await client.patch(
        "/api/v1/users/me",
        json={"wallet": VALID_SOLANA_WALLET},
        headers=hunter_headers,
    )

    # Admin bypasses backoff with force=true
    r3 = await client.post(
        f"/api/v1/bounties/{bounty_id}/retry?force=true",
        headers=admin_headers,
    )
    assert r3.status_code == 200
    assert r3.json()["status"] == "CLAIMABLE"
    assert r3.json()["claim_error"] is None


async def test_admin_failed_approvals_tooling(
    client,
    auth_headers,
    hunter_headers,
    admin_headers,
    setup_bounty,
    mock_onchain_tracker,
    mock_github_pr_merged,
):
    bounty_id = setup_bounty["id"]

    # Hunter applies, accepted, submits, and completes into CLAIM_FAILED
    app_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/apply",
        json={"proposal": "Proposal"},
        headers=hunter_headers,
    )
    applicant_id = app_resp.json()["id"]
    await client.post(
        f"/api/v1/bounties/{bounty_id}/applicants/{applicant_id}/accept",
        headers=auth_headers,
    )
    sub_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/acme/reconciliation-app/pull/1"},
        headers=hunter_headers,
    )
    assert sub_resp.status_code == 200

    comp_resp = await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers)
    assert comp_resp.status_code == 200

    # Admin lists failed approvals
    list_resp = await client.get("/api/v1/admin/failed-approvals", headers=admin_headers)
    assert list_resp.status_code == 200
    failed_items = list_resp.json()
    assert len(failed_items) >= 1
    target = next((item for item in failed_items if item["bounty_id"] == bounty_id), None)
    assert target is not None
    assert target["status"] == "CLAIM_FAILED"
    assert target["hunter_username"] == "bob"

    # Admin runs batch retry while hunter has no wallet -> retry is attempted and fails safely
    batch_resp = await client.post(
        "/api/v1/admin/retry-failed-approvals?force=true",
        headers=admin_headers,
    )
    assert batch_resp.status_code == 200
    batch_data = batch_resp.json()
    assert batch_data["total_failed"] >= 1
    assert batch_data["failed_count"] >= 1

    # Hunter links wallet -> automatically reconciles on-chain and auto-retries
    await client.patch(
        "/api/v1/users/me",
        json={"wallet": VALID_SOLANA_WALLET},
        headers=hunter_headers,
    )

    b_healed = (await client.get(f"/api/v1/bounties/{bounty_id}")).json()
    assert b_healed["status"] == "CLAIMABLE"


async def test_audit_logs_permissions(client, auth_headers, hunter_headers, setup_bounty):
    bounty_id = setup_bounty["id"]

    # Anonymous / unauthorized user gets 401
    anon_resp = await client.get(f"/api/v1/bounties/{bounty_id}/audit-logs")
    assert anon_resp.status_code == 401

    # Hunter (not assigned yet) gets 403
    h_resp = await client.get(
        f"/api/v1/bounties/{bounty_id}/audit-logs",
        headers=hunter_headers,
    )
    assert h_resp.status_code == 403

    # Maintainer / issuer gets 200
    m_resp = await client.get(
        f"/api/v1/bounties/{bounty_id}/audit-logs",
        headers=auth_headers,
    )
    assert m_resp.status_code == 200
    assert isinstance(m_resp.json(), list)
