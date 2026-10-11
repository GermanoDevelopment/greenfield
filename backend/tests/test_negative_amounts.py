async def test_create_bounty_negative_points_rejected(client, auth_headers):
    proj_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield"},
        headers=auth_headers,
    )
    project_id = proj_resp.json()["id"]

    # Negative points rejected by schema validation
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project_id,
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/1",
            "points": -100,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_create_bounty_zero_points_rejected(client, auth_headers):
    proj_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield"},
        headers=auth_headers,
    )
    project_id = proj_resp.json()["id"]

    # Zero points rejected
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project_id,
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/1",
            "points": 0,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_create_bounty_negative_amount_rejected(client, auth_headers):
    proj_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield"},
        headers=auth_headers,
    )
    project_id = proj_resp.json()["id"]

    # Negative amount_usdc rejected
    resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project_id,
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/1",
            "points": 100,
            "amount_usdc": -5_000_000,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_update_bounty_negative_reward_rejected(client, auth_headers, mock_github_issue_open):
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
            "issue_url": "https://github.com/GermanoDevelopment/greenfield/issues/1",
            "points": 100,
        },
        headers=auth_headers,
    )
    bounty_id = bounty_resp.json()["id"]

    # Negative points update
    resp_neg = await client.patch(
        f"/api/v1/bounties/{bounty_id}/reward",
        json={"points": -200},
        headers=auth_headers,
    )
    assert resp_neg.status_code == 422

    # Zero points update
    resp_zero = await client.patch(
        f"/api/v1/bounties/{bounty_id}/reward",
        json={"points": 0},
        headers=auth_headers,
    )
    assert resp_zero.status_code == 422
