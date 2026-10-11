import pytest

from app.core.config import Settings
from app.services import solana_service

FAKE_ESCROW_PDA = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"


@pytest.fixture
def mock_github_issue_open(monkeypatch):
    from app.services import github_service

    async def fake_issue_open(issue_url: str) -> bool | None:
        return True

    monkeypatch.setattr(github_service, "is_issue_open", fake_issue_open)


@pytest.fixture
async def project(client, auth_headers):
    resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield", "description": "MVP"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    return resp.json()


# ---------------------------------------------------------------------------
# Configurable Mint per Cluster & Vault Validation Tests
# ---------------------------------------------------------------------------


def test_configurable_mint_per_cluster():
    # Devnet default
    dev_settings = Settings(
        solana_cluster="devnet",
        solana_rpc_url="https://api.devnet.solana.com",
    )
    assert dev_settings.current_usdc_mint == dev_settings.usdc_mint_devnet

    # Mainnet auto-detection
    main_settings = Settings(
        solana_cluster="mainnet",
        solana_rpc_url="https://api.mainnet-beta.solana.com",
    )
    assert main_settings.current_usdc_mint == main_settings.usdc_mint_mainnet

    # Explicit override
    custom_settings = Settings(usdc_mint="CustomUSDC1111111111111111111111111111111")
    assert custom_settings.current_usdc_mint == "CustomUSDC1111111111111111111111111111111"


async def test_verify_escrow_funded_rejects_non_vault_when_program_configured(monkeypatch):
    program_id = "8rV2P64d4xN9w7qDqG8p3aQYFwE61oNn6J9Q2zN1abcd"
    monkeypatch.setattr(solana_service.get_settings(), "solana_program_id", program_id)
    monkeypatch.setattr(solana_service.get_settings(), "solana_cluster", "devnet")

    # Derive real vault PDA
    vault_pda = solana_service.get_vault_pda()
    assert vault_pda is not None
    real_vault_str = str(vault_pda[0])

    # Arbitrary random address should be rejected immediately (returns False)
    arbitrary_address = "9drGEUx7RqXb8iATtX2CP6NU1FHyoppF3LyMF8UPzhLb"
    assert real_vault_str != arbitrary_address
    res = await solana_service.verify_escrow_funded(arbitrary_address, 10.0)
    assert res is False


# ---------------------------------------------------------------------------
# Treasury Endpoint Tests
# ---------------------------------------------------------------------------


async def test_treasury_balance_endpoint_returns_onchain_values(client, monkeypatch):
    async def fake_get_treasury():
        return {
            "authority": "11111111111111111111111111111111",
            "mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
            "vault": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
            "total_deposited": 25_000_000_000,
            "total_reserved": 5_000_000_000,
            "total_claimed": 1_000_000_000,
            "bump": 255,
        }

    monkeypatch.setattr(solana_service, "get_treasury_account", fake_get_treasury)

    resp = await client.get("/api/v1/treasury/balance")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_deposited"] == 25_000_000_000
    assert data["total_reserved"] == 5_000_000_000
    assert data["total_claimed"] == 1_000_000_000
    assert data["available"] == 20_000_000_000
    assert data["total_deposited_usdc"] == 25000.0
    assert data["total_reserved_usdc"] == 5000.0
    assert data["total_claimed_usdc"] == 1000.0
    assert data["available_usdc"] == 20000.0

    # Also check base alias /api/v1/treasury
    resp_alias = await client.get("/api/v1/treasury")
    assert resp_alias.status_code == 200
    assert resp_alias.json() == data


async def test_treasury_balance_endpoint_returns_503_on_rpc_failure(client, monkeypatch):
    async def fake_fail_treasury():
        return None

    monkeypatch.setattr(solana_service, "get_treasury_account", fake_fail_treasury)

    resp = await client.get("/api/v1/treasury/balance")
    assert resp.status_code == 503
    assert "Unable to read treasury state" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Fail-Closed Bounty Creation Tests
# ---------------------------------------------------------------------------


async def test_create_bounty_fail_closed_on_rpc_failure(
    client, auth_headers, project, mock_github_issue_open, monkeypatch
):
    # RPC failure returns None -> Must fail closed!
    async def fake_verify_none(escrow_pda, expected_amount_usdc):
        return None

    monkeypatch.setattr(solana_service, "verify_escrow_funded", fake_verify_none)

    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/101",
            "amount_usdc": 50_000_000,
            "escrow_pda": FAKE_ESCROW_PDA,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422
    assert "Unable to verify escrow funding" in resp.json()["detail"]


async def test_create_bounty_rejects_unfunded_escrow(
    client, auth_headers, project, mock_github_issue_open, monkeypatch
):
    async def fake_verify_false(escrow_pda, expected_amount_usdc):
        return False

    monkeypatch.setattr(solana_service, "verify_escrow_funded", fake_verify_false)

    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/102",
            "amount_usdc": 50_000_000,
            "escrow_pda": FAKE_ESCROW_PDA,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422
    assert "not funded" in resp.json()["detail"]


@pytest.fixture
async def wallet_user(session_factory):
    from app.db.base import UserModel

    async with session_factory() as session:
        u = UserModel(
            github_id=555444,
            username="solana_maintainer",
            wallet="4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
        )
        session.add(u)
        await session.commit()
        return {"id": u.id, "username": u.username}


@pytest.fixture
def wallet_headers(wallet_user):
    from app.core.security import create_access_token

    token = create_access_token(wallet_user["id"], wallet_user["username"])
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def wallet_project(client, wallet_headers):
    resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield", "description": "MVP"},
        headers=wallet_headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def test_create_bounty_onchain_rejects_when_treasury_insufficient(
    client, wallet_headers, wallet_project, mock_github_issue_open, monkeypatch
):
    monkeypatch.setattr(solana_service, "is_onchain_enabled", lambda *a, **k: True)

    async def fake_treasury_empty():
        return {
            "authority": "11111111111111111111111111111111",
            "mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
            "vault": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
            "total_deposited": 10_000_000,
            "total_reserved": 10_000_000,  # available = 0
            "total_claimed": 0,
            "bump": 255,
        }

    monkeypatch.setattr(solana_service, "get_treasury_account", fake_treasury_empty)

    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": wallet_project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/103",
            "amount_usdc": 50_000_000,
        },
        headers=wallet_headers,
    )
    assert resp.status_code == 422
    assert "exceeds available treasury balance" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Revalidation on Reward Changes Tests
# ---------------------------------------------------------------------------


async def test_update_reward_rejects_when_escrow_unfunded(
    client, auth_headers, project, mock_github_issue_open, monkeypatch
):
    # Initially created with funded escrow
    async def fake_verify_initial(escrow_pda, expected_amount_usdc):
        return True

    monkeypatch.setattr(solana_service, "verify_escrow_funded", fake_verify_initial)

    create_resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/104",
            "points": 100,
            "escrow_pda": FAKE_ESCROW_PDA,
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    bounty_id = create_resp.json()["id"]

    # When trying to raise reward to 500 points, escrow check fails
    async def fake_verify_unfunded(escrow_pda, expected_amount_usdc):
        return False

    monkeypatch.setattr(solana_service, "verify_escrow_funded", fake_verify_unfunded)

    update_resp = await client.patch(
        f"/api/v1/bounties/{bounty_id}/reward",
        json={"points": 500},
        headers=auth_headers,
    )
    assert update_resp.status_code == 422
    assert "not funded with the required USDC amount" in update_resp.json()["detail"]


async def test_update_reward_rejects_on_rpc_failure(
    client, auth_headers, project, mock_github_issue_open, monkeypatch
):
    async def fake_verify_initial(escrow_pda, expected_amount_usdc):
        return True

    monkeypatch.setattr(solana_service, "verify_escrow_funded", fake_verify_initial)

    create_resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/105",
            "points": 100,
            "escrow_pda": FAKE_ESCROW_PDA,
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    bounty_id = create_resp.json()["id"]

    # RPC failure on reward raise
    async def fake_verify_rpc_error(escrow_pda, expected_amount_usdc):
        return None

    monkeypatch.setattr(solana_service, "verify_escrow_funded", fake_verify_rpc_error)

    update_resp = await client.patch(
        f"/api/v1/bounties/{bounty_id}/reward",
        json={"points": 300},
        headers=auth_headers,
    )
    assert update_resp.status_code == 422
    assert "Unable to verify escrow funding" in update_resp.json()["detail"]


async def test_update_reward_rejects_when_treasury_solvency_exceeded(
    client, wallet_headers, wallet_project, mock_github_issue_open, monkeypatch
):
    monkeypatch.setattr(solana_service, "is_onchain_enabled", lambda *a, **k: True)

    async def fake_initial_treasury():
        return {
            "authority": "11111111111111111111111111111111",
            "mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
            "vault": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
            "total_deposited": 50_000_000,
            "total_reserved": 0,
            "total_claimed": 0,
            "bump": 255,
        }

    monkeypatch.setattr(solana_service, "get_treasury_account", fake_initial_treasury)

    create_resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": wallet_project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/106",
            "points": 100,  # 1_000_000 micro-USDC
        },
        headers=wallet_headers,
    )
    assert create_resp.status_code == 201
    bounty_id = create_resp.json()["id"]

    # Now treasury only has 500_000 micro-USDC left available
    async def fake_depleted_treasury():
        return {
            "authority": "11111111111111111111111111111111",
            "mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
            "vault": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
            "total_deposited": 50_000_000,
            "total_reserved": 49_500_000,  # only 500_000 available
            "total_claimed": 0,
            "bump": 255,
        }

    monkeypatch.setattr(solana_service, "get_treasury_account", fake_depleted_treasury)

    # Trying to raise by 100 points (1_000_000 micro-USDC delta > 500_000 available)
    update_resp = await client.patch(
        f"/api/v1/bounties/{bounty_id}/reward",
        json={"points": 200},
        headers=wallet_headers,
    )
    assert update_resp.status_code == 422
    assert "exceeds available treasury balance" in update_resp.json()["detail"]


async def test_update_reward_allows_lowering_without_recheck(
    client, auth_headers, project, mock_github_issue_open
):
    create_resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/107",
            "points": 500,
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    bounty_id = create_resp.json()["id"]

    # Lowering points from 500 to 200 should always succeed without requiring funding checks
    update_resp = await client.patch(
        f"/api/v1/bounties/{bounty_id}/reward",
        json={"points": 200},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["points"] == 200
    assert update_resp.json()["amount_usdc"] == 2_000_000
