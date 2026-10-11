import pytest

from app.schemas.bounty import BountyStatus

ISSUE_URL = "https://github.com/GermanoDevelopment/greenfield/issues/1"
PR_URL = "https://github.com/GermanoDevelopment/greenfield/pull/7"


@pytest.fixture
async def submitted_bounty(
    client, auth_headers, hunter_headers, mock_github_issue_open, mock_github_pr_merged
):
    # Create project
    proj_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield", "description": "MVP"},
        headers=auth_headers,
    )
    assert proj_resp.status_code == 201
    project_id = proj_resp.json()["id"]

    # Create bounty
    bounty_resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project_id,
            "issue_url": ISSUE_URL,
            "points": 100,
        },
        headers=auth_headers,
    )
    assert bounty_resp.status_code == 201
    bounty_id = bounty_resp.json()["id"]

    # Hunter assigns/applies
    assign_resp = await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers)
    assert assign_resp.status_code == 200

    # Hunter submits solution PR
    submit_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": PR_URL},
        headers=hunter_headers,
    )
    assert submit_resp.status_code == 200
    assert submit_resp.json()["status"] == BountyStatus.SUBMITTED.value
    assert submit_resp.json()["pr_url"] == PR_URL
    return bounty_id


async def test_reject_submission_by_issuer(client, auth_headers, submitted_bounty):
    bounty_id = submitted_bounty
    reject_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/reject-submission",
        headers=auth_headers,
    )
    assert reject_resp.status_code == 200
    rejected_data = reject_resp.json()
    assert rejected_data["status"] == BountyStatus.ASSIGNED.value
    assert rejected_data["pr_url"] is None


async def test_reject_submission_by_admin(client, admin_headers, submitted_bounty):
    bounty_id = submitted_bounty
    reject_resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/reject-submission",
        headers=admin_headers,
    )
    assert reject_resp.status_code == 200
    assert reject_resp.json()["status"] == BountyStatus.ASSIGNED.value
    assert reject_resp.json()["pr_url"] is None


async def test_reject_submission_forbidden_for_non_issuer(client, hunter_headers, submitted_bounty):
    bounty_id = submitted_bounty
    resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/reject-submission",
        headers=hunter_headers,
    )
    assert resp.status_code == 403


async def test_reject_submission_conflict_when_not_submitted(
    client, auth_headers, mock_github_issue_open
):
    proj_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield", "description": "MVP"},
        headers=auth_headers,
    )
    project_id = proj_resp.json()["id"]

    bounty_resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project_id,
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/99",
            "points": 100,
        },
        headers=auth_headers,
    )
    bounty_id = bounty_resp.json()["id"]

    # Attempt to reject OPEN bounty
    resp = await client.post(
        f"/api/v1/bounties/{bounty_id}/reject-submission",
        headers=auth_headers,
    )
    assert resp.status_code == 409


async def test_reject_submission_not_found(client, auth_headers):
    resp = await client.post(
        "/api/v1/bounties/999999/reject-submission",
        headers=auth_headers,
    )
    assert resp.status_code == 404
