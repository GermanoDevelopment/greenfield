from unittest.mock import AsyncMock, patch

import pytest


@pytest.fixture
async def open_bounty(client, auth_headers):
    # Create project
    p_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "acme/app"},
        headers=auth_headers,
    )
    project_id = p_resp.json()["id"]

    with patch("app.services.github_service.is_issue_open", AsyncMock(return_value=True)):
        b_resp = await client.post(
            "/api/v1/bounties",
            json={
                "project_id": project_id,
                "issue_url": "https://github.com/acme/app/issues/42",
                "points": 500,
                "issue_title": "Improve database index performance",
            },
            headers=auth_headers,
        )
        assert b_resp.status_code == 201
        return b_resp.json()


async def test_developer_can_apply_to_bounty(client, hunter_headers, open_bounty):
    bounty_id = open_bounty["id"]
    resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/apply",
        json={"proposal": "I have experience with PostgreSQL indexes and can fix this today."},
        headers=hunter_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["bounty_id"] == bounty_id
    assert data["status"] == "PENDING"
    assert "PostgreSQL" in data["proposal"]
    assert data["user"]["username"] == "bob"


async def test_duplicate_application_rejected(client, hunter_headers, open_bounty):
    bounty_id = open_bounty["id"]
    await client.post(
        f"/api/v1/bounties/{bounty_id}/apply",
        json={"proposal": "First application"},
        headers=hunter_headers,
    )
    resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/apply",
        json={"proposal": "Second application"},
        headers=hunter_headers,
    )
    assert resp.status_code == 409


async def test_issuer_cannot_apply_to_own_bounty(client, auth_headers, open_bounty):
    bounty_id = open_bounty["id"]
    resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/apply",
        json={"proposal": "I am the maintainer"},
        headers=auth_headers,
    )
    assert resp.status_code == 403


async def test_maintainer_accepts_applicant_and_rejects_others(
    client, auth_headers, hunter_headers, admin_headers, open_bounty
):
    bounty_id = open_bounty["id"]

    # Hunter 1 (bob) applies
    app1_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/apply",
        json={"proposal": "Bob's solution proposal"},
        headers=hunter_headers,
    )
    app1_id = app1_resp.json()["id"]

    # Admin/Hunter 2 applies
    app2_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/apply",
        json={"proposal": "Admin also applying"},
        headers=admin_headers,
    )
    app2_id = app2_resp.json()["id"]

    # List applicants
    list_resp = await client.get(f"/api/v1/bounties/{bounty_id}/applicants")
    assert list_resp.status_code == 200
    applicants = list_resp.json()
    assert len(applicants) == 2

    # Maintainer accepts Bob (app1)
    accept_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/applicants/{app1_id}/accept",
        headers=auth_headers,
    )
    assert accept_resp.status_code == 200
    bounty = accept_resp.json()
    assert bounty["status"] == "ASSIGNED"
    assert bounty["hunter_id"] is not None

    # Check that app1 is ACCEPTED and app2 is REJECTED
    list_after = (await client.get(f"/api/v1/bounties/{bounty_id}/applicants")).json()
    app1 = next(a for a in list_after if a["id"] == app1_id)
    app2 = next(a for a in list_after if a["id"] == app2_id)
    assert app1["status"] == "ACCEPTED"
    assert app2["status"] == "REJECTED"
