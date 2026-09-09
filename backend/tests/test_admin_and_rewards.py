from unittest.mock import AsyncMock, patch

import pytest


@pytest.fixture
async def open_bounty_fixture(client, auth_headers):
    p_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "acme/governance-repo"},
        headers=auth_headers,
    )
    project_id = p_resp.json()["id"]

    with patch("app.services.github_service.is_issue_open", AsyncMock(return_value=True)):
        b_resp = await client.post(
            "/api/v1/bounties",
            json={
                "project_id": project_id,
                "issue_url": "https://github.com/acme/governance-repo/issues/10",
                "points": 250,
            },
            headers=auth_headers,
        )
        assert b_resp.status_code == 201
        data = b_resp.json()
        assert data["points"] == 250
        assert data["amount_usdc"] == 2_500_000  # 250 pts * 10_000 = $2.5 USDC
        return data


async def test_admin_and_owner_can_update_reward_while_open(
    client, auth_headers, admin_headers, open_bounty_fixture
):
    bounty_id = open_bounty_fixture["id"]

    # Owner updates points to 600
    owner_patch = await client.patch(
        f"/api/v1/bounties/{bounty_id}/reward",
        json={"points": 600},
        headers=auth_headers,
    )
    assert owner_patch.status_code == 200
    assert owner_patch.json()["points"] == 600
    assert owner_patch.json()["amount_usdc"] == 6_000_000

    # Admin updates points to 1000 ($10 USDC)
    admin_patch = await client.patch(
        f"/api/v1/bounties/{bounty_id}/reward",
        json={"points": 1000},
        headers=admin_headers,
    )
    assert admin_patch.status_code == 200
    assert admin_patch.json()["points"] == 1000
    assert admin_patch.json()["amount_usdc"] == 10_000_000


async def test_cannot_update_reward_after_assigned(
    client, auth_headers, hunter_headers, open_bounty_fixture
):
    bounty_id = open_bounty_fixture["id"]

    # Assign bounty
    assign_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/assign",
        headers=hunter_headers,
    )
    assert assign_resp.status_code == 200
    assert assign_resp.json()["status"] == "ASSIGNED"

    # Attempt to change reward must fail with 409 (Invariant 2)
    patch_resp = await client.patch(
        f"/api/v1/bounties/{bounty_id}/reward",
        json={"points": 800},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 409


async def test_non_owner_non_admin_cannot_update_reward(
    client, hunter_headers, open_bounty_fixture
):
    bounty_id = open_bounty_fixture["id"]
    patch_resp = await client.patch(
        f"/api/v1/bounties/{bounty_id}/reward",
        json={"points": 999},
        headers=hunter_headers,
    )
    assert patch_resp.status_code == 403


async def test_solinpy_payout_on_complete(
    client, auth_headers, hunter_headers, open_bounty_fixture
):
    bounty_id = open_bounty_fixture["id"]

    # 1. Hunter configures a Solana wallet
    wallet_addr = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
    await client.patch("/api/v1/users/me", json={"wallet": wallet_addr}, headers=hunter_headers)

    # 2. Assign and Submit
    await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers)
    await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/acme/governance-repo/pull/1"},
        headers=hunter_headers,
    )

    # 3. Complete bounty (PR merged)
    with (
        patch("app.services.github_service.is_pr_merged", AsyncMock(return_value=True)),
        patch(
            "app.services.solana_service.execute_bounty_payout",
            AsyncMock(return_value="tx_sig_test_solinpy_abc123"),
        ),
    ):
        complete_resp = await client.post(
            f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers
        )
        assert complete_resp.status_code == 200
        data = complete_resp.json()
        assert data["status"] == "COMPLETED"
        assert data["tx_signature"] == "tx_sig_test_solinpy_abc123"
        assert data["claimed_at"] is not None


async def test_admin_stats_and_permissions(client, admin_headers, hunter_headers):
    # Non-admin gets 403
    forbidden_resp = await client.get("/api/v1/admin/stats", headers=hunter_headers)
    assert forbidden_resp.status_code == 403

    # Admin gets stats
    stats_resp = await client.get("/api/v1/admin/stats", headers=admin_headers)
    assert stats_resp.status_code == 200
    data = stats_resp.json()
    assert "total_projects" in data
    assert "total_repositories" in data
    assert "bounties_by_status" in data
    assert "total_usdc_allocated" in data
    assert "total_usdc_paid" in data


async def test_admin_review_submission_reject_and_approve(
    client, admin_headers, hunter_headers, open_bounty_fixture
):
    bounty_id = open_bounty_fixture["id"]

    # Hunter configures wallet and submits
    wallet_addr = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
    await client.patch("/api/v1/users/me", json={"wallet": wallet_addr}, headers=hunter_headers)
    await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers)
    await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/acme/governance-repo/pull/42"},
        headers=hunter_headers,
    )

    # 1. Admin rejects the submission
    reject_resp = await client.post(
        f"/api/v1/admin/bounties/{bounty_id}/review",
        json={"action": "REJECT", "reason": "PR precisa de testes adicionais"},
        headers=admin_headers,
    )
    assert reject_resp.status_code == 200
    assert reject_resp.json()["status"] == "ASSIGNED"
    assert reject_resp.json()["pr_url"] is None

    # 2. Hunter resubmits corrected PR
    await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/acme/governance-repo/pull/43"},
        headers=hunter_headers,
    )

    # 3. Admin approves with force_payout
    with patch(
        "app.services.solana_service.execute_bounty_payout",
        AsyncMock(return_value="tx_sig_admin_approved_123"),
    ):
        approve_resp = await client.post(
            f"/api/v1/admin/bounties/{bounty_id}/review",
            json={"action": "APPROVE", "force_payout": True},
            headers=admin_headers,
        )
        assert approve_resp.status_code == 200
        approved_data = approve_resp.json()
        assert approved_data["status"] == "COMPLETED"
        assert approved_data["tx_signature"] == "tx_sig_admin_approved_123"

