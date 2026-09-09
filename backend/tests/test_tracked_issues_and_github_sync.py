import json
from unittest.mock import AsyncMock, patch

import pytest

pytestmark = pytest.mark.asyncio


async def test_admin_projects_crud(client, admin_headers, auth_headers):
    # Non-admin forbidden
    resp_forbidden = await client.post(
        "/api/v1/admin/projects",
        json={"github_repo": "solana-labs/solana-program-library"},
        headers=auth_headers,
    )
    assert resp_forbidden.status_code == 403

    # Admin creates project
    create_resp = await client.post(
        "/api/v1/admin/projects",
        json={
            "github_repo": "solana-labs/solana-program-library",
            "description": "Core Solana programs",
            "default_branch": "master",
        },
        headers=admin_headers,
    )
    assert create_resp.status_code == 201
    proj_data = create_resp.json()
    project_id = proj_data["id"]
    assert proj_data["github_repo"] == "solana-labs/solana-program-library"
    assert proj_data["total_repositories"] == 1
    assert proj_data["unrewarded_issues"] == 0

    # List projects
    list_resp = await client.get("/api/v1/admin/projects", headers=admin_headers)
    assert list_resp.status_code == 200
    projects = list_resp.json()
    assert any(p["id"] == project_id for p in projects)

    # Update project
    update_resp = await client.patch(
        f"/api/v1/admin/projects/{project_id}",
        json={"description": "Updated description"},
        headers=admin_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["description"] == "Updated description"

    # Delete project
    del_resp = await client.delete(
        f"/api/v1/admin/projects/{project_id}",
        headers=admin_headers,
    )
    assert del_resp.status_code == 204


async def test_webhook_issues_opened_and_closed(client, admin_headers):
    # 1. Create project with repository
    create_resp = await client.post(
        "/api/v1/admin/projects",
        json={
            "github_repo": "solana-labs/solinpy",
            "description": "Python SDK for Solana",
        },
        headers=admin_headers,
    )
    assert create_resp.status_code == 201
    project_id = create_resp.json()["id"]

    # 2. Webhook delivers issues.opened
    issue_payload = {
        "action": "opened",
        "issue": {
            "number": 42,
            "title": "Add support for v1 transactions (SIMD-0385)",
            "body": "We need to support 4096-byte transactions.",
            "html_url": "https://github.com/solana-labs/solinpy/issues/42",
            "user": {"login": "solana_fan"},
            "labels": [{"name": "enhancement"}, {"name": "good first issue"}],
            "state": "open",
        },
        "repository": {
            "full_name": "solana-labs/solinpy",
            "name": "solinpy",
            "owner": {"login": "solana-labs"},
        },
    }

    wh_resp = await client.post(
        "/api/v1/webhooks/github",
        content=json.dumps(issue_payload).encode(),
        headers={"X-GitHub-Event": "issues", "Content-Type": "application/json"},
    )
    assert wh_resp.status_code == 200
    assert "recorded" in wh_resp.json()["detail"]

    # 3. Check issue appears in unrewarded issues
    unrewarded_resp = await client.get(
        f"/api/v1/admin/unrewarded-issues?project_id={project_id}",
        headers=admin_headers,
    )
    assert unrewarded_resp.status_code == 200
    issues = unrewarded_resp.json()
    assert len(issues) == 1
    issue_item = issues[0]
    assert issue_item["issue_number"] == 42
    assert issue_item["title"] == "Add support for v1 transactions (SIMD-0385)"
    assert issue_item["has_bounty"] is False
    assert "enhancement" in issue_item["labels"]

    # 4. Webhook delivers issues.closed
    close_payload = {
        "action": "closed",
        "issue": {
            "number": 42,
            "state": "closed",
        },
        "repository": {
            "full_name": "solana-labs/solinpy",
            "name": "solinpy",
            "owner": {"login": "solana-labs"},
        },
    }
    wh_close = await client.post(
        "/api/v1/webhooks/github",
        content=json.dumps(close_payload).encode(),
        headers={"X-GitHub-Event": "issues", "Content-Type": "application/json"},
    )
    assert wh_close.status_code == 200

    # 5. Closed issue is no longer listed in open unrewarded issues
    unrewarded_after = await client.get(
        f"/api/v1/admin/unrewarded-issues?project_id={project_id}",
        headers=admin_headers,
    )
    assert len(unrewarded_after.json()) == 0


async def test_github_sync_and_reward_assignment(client, admin_headers):
    # 1. Create project
    create_resp = await client.post(
        "/api/v1/admin/projects",
        json={
            "github_repo": "solana-labs/solinpy-testing",
            "description": "Testing project",
        },
        headers=admin_headers,
    )
    assert create_resp.status_code == 201
    project_id = create_resp.json()["id"]

    # Get repositories for this project
    p_resp = await client.get(f"/api/v1/projects/{project_id}")
    repos = p_resp.json()["repositories"]
    assert len(repos) >= 1
    repo_id = repos[0]["id"]

    # 2. Mock GitHub API fetch and trigger sync
    mock_issues = [
        {
            "number": 101,
            "title": "Bug in transaction serialization",
            "body": "Serialization fails with large accounts.",
            "html_url": "https://github.com/solana-labs/solinpy-testing/issues/101",
            "user": {"login": "tester1"},
            "labels": [{"name": "bug"}],
            "state": "open",
        },
        {
            "number": 102,
            "title": "Add documentation for LiteSVM testing",
            "body": "How to use LiteSVM with greenfield.",
            "html_url": "https://github.com/solana-labs/solinpy-testing/issues/102",
            "user": {"login": "tester2"},
            "labels": [{"name": "docs"}],
            "state": "open",
        },
    ]

    with patch(
        "app.services.github_service.fetch_repository_issues",
        AsyncMock(return_value=mock_issues),
    ):
        sync_resp = await client.post(
            f"/api/v1/admin/repositories/{repo_id}/sync",
            headers=admin_headers,
        )
        assert sync_resp.status_code == 200
        sync_data = sync_resp.json()
        assert sync_data["total_synced"] == 2
        assert sync_data["new_issues"] == 2

    # 3. Check unrewarded issues list
    unrewarded_resp = await client.get(
        f"/api/v1/admin/unrewarded-issues?repository_id={repo_id}",
        headers=admin_headers,
    )
    assert unrewarded_resp.status_code == 200
    unrewarded = unrewarded_resp.json()
    assert len(unrewarded) == 2

    target_issue = next(i for i in unrewarded if i["issue_number"] == 101)
    target_id = target_issue["id"]

    # 4. Admin assigns reward to issue 101
    assign_resp = await client.post(
        f"/api/v1/admin/unrewarded-issues/{target_id}/assign-reward",
        json={"points": 500},
        headers=admin_headers,
    )
    assert assign_resp.status_code == 201
    bounty = assign_resp.json()
    assert bounty["status"] == "OPEN"
    assert bounty["points"] == 500
    assert bounty["amount_usdc"] == 5_000_000
    assert bounty["issue_number"] == 101

    # 5. Cannot assign reward again to the same issue (Conflict)
    double_assign = await client.post(
        f"/api/v1/admin/unrewarded-issues/{target_id}/assign-reward",
        json={"points": 300},
        headers=admin_headers,
    )
    assert double_assign.status_code == 409

    # 6. Unrewarded issues now only has issue 102
    unrewarded_remaining = await client.get(
        f"/api/v1/admin/unrewarded-issues?repository_id={repo_id}",
        headers=admin_headers,
    )
    assert len(unrewarded_remaining.json()) == 1
    assert unrewarded_remaining.json()[0]["issue_number"] == 102

    # 7. Admin stats includes unrewarded_issues and total_tracked_issues
    stats_resp = await client.get("/api/v1/admin/stats", headers=admin_headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["unrewarded_issues"] >= 1
    assert stats["total_tracked_issues"] >= 2
