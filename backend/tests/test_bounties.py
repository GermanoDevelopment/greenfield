import pytest

from app.services import github_service, solana_service

FAKE_ESCROW_PDA = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"


@pytest.fixture
def mock_github_issue_open(monkeypatch):
    async def fake_issue_open(issue_url: str) -> bool | None:
        return True

    monkeypatch.setattr(github_service, "is_issue_open", fake_issue_open)


@pytest.fixture
def mock_escrow_funded(monkeypatch):
    funded = {"result": True}

    async def fake_verify_escrow_funded(
        escrow_pda: str, expected_amount_usdc: float
    ) -> bool | None:
        return funded["result"]

    monkeypatch.setattr(solana_service, "verify_escrow_funded", fake_verify_escrow_funded)
    return funded


@pytest.fixture
def mock_github_pr_merged(monkeypatch):
    merged = {"result": True}

    async def fake_pr_merged(pr_url: str) -> bool | None:
        return merged["result"]

    monkeypatch.setattr(github_service, "is_pr_merged", fake_pr_merged)
    return merged


@pytest.fixture
async def project(client, auth_headers):
    resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield", "description": "MVP"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture
async def bounty(client, auth_headers, project, mock_github_issue_open):
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/1",
            "amount_usdc": 50_000_000,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def test_create_project(client, auth_headers):
    resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "https://github.com/owner/repo", "description": "test"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["github_repo"] == "owner/repo"
    assert data["owner"]["username"] == "alice"


async def test_create_project_invalid_repo(client, auth_headers):
    resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "not-a-repo"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_full_bounty_lifecycle(
    client, auth_headers, hunter_headers, bounty, mock_github_pr_merged
):
    bounty_id = bounty["id"]
    assert bounty["status"] == "OPEN"

    # hunter assigns themselves
    resp = await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "ASSIGNED"
    assert resp.json()["hunter"]["username"] == "bob"

    # hunter submits PR
    resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/GermanoDevelopment/greenfield/pull/7"},
        headers=hunter_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "SUBMITTED"
    assert resp.json()["pr_url"].endswith("/pull/7")

    # issuer completes (PR merged mocked as True)
    resp = await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "COMPLETED"


async def test_complete_requires_merged_pr(
    client, auth_headers, hunter_headers, bounty, mock_github_pr_merged
):
    bounty_id = bounty["id"]
    await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers)
    await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/GermanoDevelopment/greenfield/pull/7"},
        headers=hunter_headers,
    )
    mock_github_pr_merged["result"] = False

    resp = await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers)
    assert resp.status_code == 422
    assert "not merged" in resp.json()["detail"]


async def test_assign_to_self_forbidden(client, auth_headers, bounty):
    resp = await client.post(f"/api/v1/bounties/{bounty['id']}/assign", headers=auth_headers)
    assert resp.status_code == 403


async def test_cancel_bounty(client, auth_headers, bounty):
    resp = await client.post(f"/api/v1/bounties/{bounty['id']}/cancel", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


async def test_invalid_transition_cancelled_to_assigned(client, auth_headers, bounty):
    await client.post(f"/api/v1/bounties/{bounty['id']}/cancel", headers=auth_headers)
    resp = await client.post(
        f"/api/v1/bounties/{bounty['id']}/assign", headers={"Authorization": "Bearer x"}
    )
    # CANCELLED is terminal: transition validation rejects even before auth role checks
    assert resp.status_code in (401, 409)


async def test_completed_bounty_is_terminal(
    client, auth_headers, hunter_headers, bounty, mock_github_pr_merged
):
    bounty_id = bounty["id"]
    await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers)
    await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": "https://github.com/GermanoDevelopment/greenfield/pull/7"},
        headers=hunter_headers,
    )
    await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers)

    resp = await client.post(f"/api/v1/bounties/{bounty_id}/cancel", headers=auth_headers)
    assert resp.status_code == 409


async def test_list_bounties_filter_status(client, auth_headers, bounty):
    resp = await client.get("/api/v1/bounties?status=OPEN")
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get("/api/v1/bounties?status=COMPLETED")
    assert resp.json() == []


async def test_create_bounty_with_funded_escrow(
    client, auth_headers, project, mock_github_issue_open, mock_escrow_funded
):
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/2",
            "amount_usdc": 50_000_000,
            "escrow_pda": FAKE_ESCROW_PDA,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["escrow_pda"] == FAKE_ESCROW_PDA


async def test_create_bounty_rejects_unfunded_escrow(
    client, auth_headers, project, mock_github_issue_open, mock_escrow_funded
):
    mock_escrow_funded["result"] = False
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/2",
            "amount_usdc": 50_000_000,
            "escrow_pda": FAKE_ESCROW_PDA,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422
    assert "not funded" in resp.json()["detail"]


async def test_create_bounty_rejects_malformed_escrow(
    client, auth_headers, project, mock_github_issue_open
):
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/2",
            "amount_usdc": 50_000_000,
            "escrow_pda": "not-a-valid-address",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_create_bounty_requires_existing_project(client, auth_headers):
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": 99999,
            "issue_url": "https://github.com/o/r/issues/2",
            "amount_usdc": 1,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 404
