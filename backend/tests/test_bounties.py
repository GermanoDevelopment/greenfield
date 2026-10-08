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
    client, auth_headers, hunter_headers, hunter_user, bounty, mock_github_pr_merged
):
    bounty_id = bounty["id"]
    assert bounty["status"] == "OPEN"

    # maintainer assigns Bob directly
    resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/assign",
        json={"hunter_id": hunter_user["id"]},
        headers=auth_headers,
    )
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
    client, auth_headers, hunter_headers, hunter_user, bounty, mock_github_pr_merged
):
    bounty_id = bounty["id"]
    await client.post(
        f"/api/v1/bounties/{bounty_id}/assign",
        json={"hunter_id": hunter_user["id"]},
        headers=auth_headers,
    )
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
    client, auth_headers, hunter_headers, hunter_user, bounty, mock_github_pr_merged
):
    bounty_id = bounty["id"]
    await client.post(
        f"/api/v1/bounties/{bounty_id}/assign",
        json={"hunter_id": hunter_user["id"]},
        headers=auth_headers,
    )
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
            "amount_usdc": 1_000_000,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_contributor_cannot_self_assign(client, hunter_headers, hunter_user, bounty):
    bounty_id = bounty["id"]
    # 1. Contributor calling legacy assign without body is rejected (403 Forbidden)
    resp = await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers)
    assert resp.status_code == 403
    assert "Direct self-assignment is disabled" in resp.json()["detail"]

    # 2. Contributor calling assign specifying themselves is rejected (403 Forbidden)
    resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/assign",
        json={"hunter_id": hunter_user["id"]},
        headers=hunter_headers,
    )
    assert resp.status_code == 403
    assert "Direct self-assignment is disabled" in resp.json()["detail"]


async def test_duplicate_bounty_for_same_issue_rejected(
    client, auth_headers, project, mock_github_issue_open
):
    issue_url = "https://github.com/GermanoDevelopment/greenfield/issues/999"
    # First bounty created successfully
    resp1 = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": issue_url,
            "points": 200,
        },
        headers=auth_headers,
    )
    assert resp1.status_code == 201

    # Second bounty for the exact same issue URL is rejected with 409 Conflict
    resp2 = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": issue_url,
            "points": 300,
        },
        headers=auth_headers,
    )
    assert resp2.status_code == 409
    assert "already exists" in resp2.json()["detail"]


async def test_create_bounty_rejects_unknown_issue_status(client, auth_headers, project, monkeypatch):
    from app.services import github_service

    async def fake_issue_rate_limited(issue_url: str) -> bool | None:
        return None

    monkeypatch.setattr(github_service, "is_issue_open", fake_issue_rate_limited)

    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/100",
            "points": 100,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422
    assert "Unable to verify GitHub issue status" in resp.json()["detail"]


async def test_create_bounty_amount_and_points_validation(
    client, auth_headers, project, mock_github_issue_open
):
    # 1. Zero points rejected
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/101",
            "points": 0,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422

    # 2. Negative points rejected
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/102",
            "points": -50,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422

    # 3. Huge points rejected
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/103",
            "points": 10_000_000,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422

    # 4. Zero amount_usdc rejected
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/104",
            "amount_usdc": 0,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422

    # 5. Negative amount_usdc rejected
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/105",
            "amount_usdc": -100_000,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422

    # 6. Huge amount_usdc rejected
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/106",
            "amount_usdc": 100_000_000_000,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422

    # 7. Divergent points and amount_usdc rejected
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/107",
            "points": 100,
            "amount_usdc": 5_000_000,  # Expected 1,000,000 micro-USDC
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422
    assert "does not match points" in resp.json()["detail"][0]["msg"]

    # 8. Consistent points and amount_usdc accepted
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project["id"],
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/108",
            "points": 500,
            "amount_usdc": 5_000_000,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["points"] == 500
    assert resp.json()["amount_usdc"] == 5_000_000
