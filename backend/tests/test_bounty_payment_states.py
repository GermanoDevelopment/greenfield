"""Payment states for the bounty lifecycle.

Completing a bounty validates the reward (PR merged, claim approved). The
payout itself is a separate step: CLAIMABLE means the payment is validated and
unlocked, CLAIMED means the transaction executed, CLAIM_FAILED means it ran
and failed — none of which COMPLETED alone could express.
"""

from unittest.mock import AsyncMock, patch

import pytest

from app.schemas.bounty import BOUNTY_TRANSITIONS, BountyStatus


@pytest.fixture
async def bounty(client, auth_headers, mock_github_issue_open):
    project = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield", "description": "MVP"},
        headers=auth_headers,
    )
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project.json()["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/77",
            "amount_usdc": 50_000_000,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture
async def assigned_with_wallet(client, auth_headers, hunter_headers, bounty):
    """A bounty that is assigned to a hunter with a registered wallet."""
    wallet_addr = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
    await client.patch("/api/v1/users/me", json={"wallet": wallet_addr}, headers=hunter_headers)
    await client.post(f"/api/v1/bounties/{bounty['id']}/assign", headers=hunter_headers)
    await client.post(
        f"/api/v1/bounties/{bounty['id']}/submit",
        json={"pr_url": "https://github.com/GermanoDevelopment/greenfield/pull/11"},
        headers=hunter_headers,
    )
    return bounty


async def test_failed_payout_is_claim_failed_not_silently_completed(
    client, auth_headers, assigned_with_wallet, mock_github_pr_merged
):
    bounty_id = assigned_with_wallet["id"]

    with (
        patch("app.services.github_service.is_pr_merged", AsyncMock(return_value=True)),
        patch(
            "app.services.solana_service.execute_bounty_payout",
            AsyncMock(side_effect=RuntimeError("RPC unreachable")),
        ),
    ):
        resp = await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers)

    assert resp.status_code == 409
    assert "CLAIM_FAILED" in resp.json()["detail"]

    # The failed state is durable, not just an in-memory flag on the response.
    state = await client.get(f"/api/v1/bounties/{bounty_id}", headers=auth_headers)
    assert state.status_code == 200
    assert state.json()["status"] == "CLAIM_FAILED"
    assert state.json()["tx_signature"] is None


async def test_successful_payout_sets_claimed(
    client, auth_headers, assigned_with_wallet, mock_github_pr_merged
):
    bounty_id = assigned_with_wallet["id"]

    with (
        patch("app.services.github_service.is_pr_merged", AsyncMock(return_value=True)),
        patch(
            "app.services.solana_service.execute_bounty_payout",
            AsyncMock(return_value="tx_sig_payment_states_ok"),
        ),
    ):
        resp = await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers)

    assert resp.status_code == 200
    body = resp.json()
    # The transfer executed, so the bounty is past validated into executed.
    assert body["status"] == "CLAIMED"
    assert body["tx_signature"] == "tx_sig_payment_states_ok"
    assert body["claimed_at"] is not None


async def test_failed_payout_can_be_retried_via_claim(
    client, auth_headers, hunter_headers, assigned_with_wallet, mock_github_pr_merged
):
    bounty_id = assigned_with_wallet["id"]

    with (
        patch("app.services.github_service.is_pr_merged", AsyncMock(return_value=True)),
        patch(
            "app.services.solana_service.execute_bounty_payout",
            AsyncMock(side_effect=RuntimeError("RPC unreachable")),
        ),
    ):
        await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers)

    # The claim path picks the bounty back up from CLAIM_FAILED and records the
    # claim once its transaction is confirmed on-chain.
    with patch("app.services.solana_service.is_onchain_enabled", lambda *a, **k: True):
        with patch(
            "app.services.solana_service.get_bounty_account",
            AsyncMock(return_value={"status": 2}),  # BOUNTY_STATUS_CLAIMED
        ):
            resp = await client.post(
                f"/api/v1/bounties/{bounty_id}/claimed",
                json={"tx_signature": "5" * 88},
                headers=hunter_headers,
            )

    assert resp.status_code == 200
    assert resp.json()["status"] == "CLAIMED"
    assert resp.json()["claim_signature"] == "5" * 88


def test_payment_state_transitions():
    # Reward validated → payment validated / executed / failed.
    assert BountyStatus.CLAIMABLE in BOUNTY_TRANSITIONS[BountyStatus.COMPLETED]
    assert BountyStatus.CLAIMED in BOUNTY_TRANSITIONS[BountyStatus.COMPLETED]
    assert BountyStatus.CLAIM_FAILED in BOUNTY_TRANSITIONS[BountyStatus.COMPLETED]
    # A failed payment can be validated again (retry) or eventually executed.
    assert BOUNTY_TRANSITIONS[BountyStatus.CLAIM_FAILED] == {
        BountyStatus.CLAIMABLE,
        BountyStatus.CLAIMED,
    }
    # Once the payment is executed or cancelled the lifecycle is terminal.
    assert BOUNTY_TRANSITIONS[BountyStatus.CLAIMED] == set()
    assert BOUNTY_TRANSITIONS[BountyStatus.CLAIMABLE] == {
        BountyStatus.CLAIMED,
        BountyStatus.CLAIM_FAILED,
    }
