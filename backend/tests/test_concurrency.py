import asyncio

import pytest


@pytest.fixture
async def submitted_bounty_id(
    client, auth_headers, hunter_headers, mock_github_issue_open, mock_github_pr_merged
):
    issue_url = "https://github.com/GermanoDevelopment/greenfield/issues/1"
    pr_url = "https://github.com/GermanoDevelopment/greenfield/pull/7"

    proj_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield"},
        headers=auth_headers,
    )
    project_id = proj_resp.json()["id"]

    bounty_resp = await client.post(
        "/api/v1/bounties",
        json={"project_id": project_id, "issue_url": issue_url, "points": 100},
        headers=auth_headers,
    )
    bounty_id = bounty_resp.json()["id"]

    await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers)
    await client.post(
        f"/api/v1/bounties/{bounty_id}/submit",
        json={"pr_url": pr_url},
        headers=hunter_headers,
    )
    return bounty_id


async def test_concurrent_double_complete(
    client, auth_headers, submitted_bounty_id, mock_github_pr_merged
):
    bounty_id = submitted_bounty_id

    # Two concurrent requests attempting to complete/approve the same bounty
    results = await asyncio.gather(
        client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers),
        client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers),
        return_exceptions=True,
    )

    status_codes = [r.status_code for r in results if not isinstance(r, Exception)]
    assert 200 in status_codes
    assert 409 in status_codes


async def test_concurrent_double_claim(
    client, auth_headers, hunter_headers, submitted_bounty_id, mock_github_pr_merged
):
    bounty_id = submitted_bounty_id

    # First complete the bounty
    comp_resp = await client.post(f"/api/v1/bounties/{bounty_id}/complete", headers=auth_headers)
    assert comp_resp.status_code == 200

    # Two concurrent requests to claim the bounty
    claim_payload = {"tx_signature": "5" * 88}
    results = await asyncio.gather(
        client.post(
            f"/api/v1/bounties/{bounty_id}/claimed", json=claim_payload, headers=hunter_headers
        ),
        client.post(
            f"/api/v1/bounties/{bounty_id}/claimed", json=claim_payload, headers=hunter_headers
        ),
        return_exceptions=True,
    )

    status_codes = [r.status_code for r in results if not isinstance(r, Exception)]
    assert 200 in status_codes
    assert 409 in status_codes


async def test_concurrent_double_assign(
    client, auth_headers, hunter_headers, mock_github_issue_open
):
    proj_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield"},
        headers=auth_headers,
    )
    project_id = proj_resp.json()["id"]

    bounty_resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project_id,
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/50",
            "points": 100,
        },
        headers=auth_headers,
    )
    bounty_id = bounty_resp.json()["id"]

    # Two concurrent assign attempts
    results = await asyncio.gather(
        client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers),
        client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers),
        return_exceptions=True,
    )

    status_codes = [r.status_code for r in results if not isinstance(r, Exception)]
    assert 200 in status_codes
    assert 409 in status_codes
