"""Payment state machine: CLAIMABLE, CLAIMED and CLAIM_FAILED (#20)."""

from unittest.mock import AsyncMock, patch

import pytest

from app.core.config import get_settings
from app.services import solana_service

WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
PAYOUT = "app.services.solana_service.execute_bounty_payout"


@pytest.fixture
async def submitted_bounty(
    client, auth_headers, hunter_headers, mock_github_issue_open, mock_github_pr_merged
):
    project = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield"},
        headers=auth_headers,
    )
    bounty = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project.json()["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/1",
            "amount_usdc": 50_000_000,
        },
        headers=auth_headers,
    )
    bounty_id = bounty.json()["id"]
    await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers)
    resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/GermanoDevelopment/greenfield/pull/7"},
        headers=hunter_headers,
    )
    assert resp.json()["status"] == "SUBMITTED"
    return bounty_id


@pytest.fixture
async def hunter_wallet(client, hunter_headers):
    resp = await client.patch("/api/v1/users/me", json={"wallet": WALLET}, headers=hunter_headers)
    assert resp.status_code == 200


async def _complete(client, bounty_id, headers):
    return await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=headers)


# --- Custodial payouts --------------------------------------------------------


async def test_confirmed_payout_marks_claimed(
    client, submitted_bounty, auth_headers, hunter_wallet, custodial
):
    payout = AsyncMock(return_value="confirmed_sig_123")
    with patch(PAYOUT, payout):
        resp = await _complete(client, submitted_bounty, auth_headers)
    data = resp.json()
    assert data["status"] == "CLAIMED"
    assert data["tx_signature"] == "confirmed_sig_123"
    assert data["claimed_at"] is not None
    assert data["claim_error"] is None
    payout.assert_awaited_once_with(destination_wallet=WALLET, amount_micro_usdc=50_000_000)


@pytest.mark.parametrize(
    "error,reason",
    [
        (
            solana_service.SolanaServiceError("Solana payout failed: insufficient funds"),
            "insufficient",
        ),
        (solana_service.SolanaServiceError("Confirmation timeout (30.0s) for abc"), "timeout"),
        (RuntimeError("connection reset"), "connection reset"),
    ],
)
async def test_failed_payout_is_claim_failed_with_reason(
    client, submitted_bounty, auth_headers, hunter_wallet, custodial, error, reason
):
    with patch(PAYOUT, AsyncMock(side_effect=error)):
        resp = await _complete(client, submitted_bounty, auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "CLAIM_FAILED"
    assert reason in data["claim_error"]
    assert data["tx_signature"] is None
    assert data["claimed_at"] is None


async def test_no_wallet_stays_claimable_without_paying(
    client, submitted_bounty, auth_headers, custodial
):
    payout = AsyncMock()
    with patch(PAYOUT, payout):
        resp = await _complete(client, submitted_bounty, auth_headers)
    assert resp.json()["status"] == "CLAIMABLE"
    payout.assert_not_called()


async def test_no_treasury_stays_claimable_without_paying(
    client, submitted_bounty, auth_headers, hunter_wallet
):
    payout = AsyncMock()
    with patch(PAYOUT, payout):
        resp = await _complete(client, submitted_bounty, auth_headers)
    assert resp.json()["status"] == "CLAIMABLE"
    payout.assert_not_called()


async def test_failed_payout_cannot_be_cancelled_or_completed_again(
    client, submitted_bounty, auth_headers, hunter_wallet, custodial
):
    with patch(PAYOUT, AsyncMock(side_effect=RuntimeError("boom"))):
        await _complete(client, submitted_bounty, auth_headers)
    resp = await client.post(f"/api/v1/bounties/{submitted_bounty}/cancel", headers=auth_headers)
    assert resp.status_code == 409
    resp = await _complete(client, submitted_bounty, auth_headers)
    assert resp.status_code == 409


async def test_reported_claim_rejected_in_custodial_mode(
    client, submitted_bounty, auth_headers, hunter_headers
):
    await _complete(client, submitted_bounty, auth_headers)
    resp = await client.post(
        f"/api/v1/bounties/{submitted_bounty}/claimed",
        json={"tx_signature": "5" * 88},
        headers=hunter_headers,
    )
    assert resp.status_code == 409
    assert "escrow mode" in resp.json()["detail"]
    bounty = await client.get(f"/api/v1/bounties/{submitted_bounty}")
    assert bounty.json()["status"] == "CLAIMABLE"


# --- Admin stats ----------------------------------------------------------------


async def test_stats_count_new_states_and_only_claimed_as_paid(
    client, submitted_bounty, auth_headers, admin_headers, hunter_wallet, custodial
):
    with patch(PAYOUT, AsyncMock(side_effect=RuntimeError("boom"))):
        await _complete(client, submitted_bounty, auth_headers)

    stats = (await client.get("/api/v1/admin/stats", headers=admin_headers)).json()
    assert stats["bounties_by_status"]["CLAIM_FAILED"] == 1
    assert set(stats["bounties_by_status"]) == {
        "OPEN",
        "ASSIGNED",
        "SUBMITTED",
        "CLAIMABLE",
        "CLAIMED",
        "CLAIM_FAILED",
        "CANCELLED",
    }
    assert stats["total_usdc_paid"] == 0


# --- Solana service -------------------------------------------------------------


def test_treasury_key_is_never_generated(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "solana_authority_secret_key", "")
    monkeypatch.setattr(settings, "solana_treasury_keypair_path", None)
    monkeypatch.setattr(settings, "solana_treasury_private_key", None)
    assert solana_service.is_custodial_enabled() is False
    with pytest.raises(solana_service.SolanaNotConfiguredError):
        solana_service.get_treasury_keypair()


def test_invalid_treasury_key_raises(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "solana_authority_secret_key", "")
    monkeypatch.setattr(settings, "solana_treasury_keypair_path", None)
    monkeypatch.setattr(settings, "solana_treasury_private_key", "not-base58-!!!")
    with pytest.raises(solana_service.SolanaServiceError, match="Invalid treasury key"):
        solana_service.get_treasury_keypair()


async def test_payout_waits_for_confirmation(monkeypatch):
    """execute_bounty_payout returns only after _confirm_signature succeeds."""
    from solders.keypair import Keypair

    monkeypatch.setattr(solana_service, "get_treasury_keypair", Keypair)

    class FakeRpc:
        def __init__(self, *args, **kwargs):
            pass

        async def get_account_info(self, _):
            return type("R", (), {"value": object()})()

        async def get_latest_blockhash(self):
            return "11111111111111111111111111111111"

        async def send_transaction(self, _):
            return "sent_sig"

    monkeypatch.setattr(solana_service, "SolanaAsyncRPCClient", FakeRpc)

    confirm = AsyncMock(
        side_effect=solana_service.SolanaServiceError("tx failed: InstructionError")
    )
    monkeypatch.setattr(solana_service, "_confirm_signature", confirm)
    with pytest.raises(solana_service.SolanaServiceError, match="InstructionError"):
        await solana_service.execute_bounty_payout(WALLET, 1_000_000)
    confirm.assert_awaited_once_with("sent_sig")

    confirm.side_effect = None
    assert await solana_service.execute_bounty_payout(WALLET, 1_000_000) == "sent_sig"
