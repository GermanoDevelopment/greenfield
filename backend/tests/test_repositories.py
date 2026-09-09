from unittest.mock import AsyncMock, patch

import pytest


@pytest.fixture
async def sample_project(client, auth_headers):
    resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "owner/main-project", "description": "Main ecosystem project"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def test_add_repository_to_project(client, auth_headers, sample_project):
    project_id = sample_project["id"]
    resp = await client.post(
        f"/api/v1/projects/{project_id}/repositories",
        json={
            "github_repo": "owner/sub-repo-backend",
            "description": "Backend services",
            "default_branch": "main",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["project_id"] == project_id
    assert data["github_owner"] == "owner"
    assert data["github_name"] == "sub-repo-backend"
    assert data["github_repo"] == "owner/sub-repo-backend"
    assert data["is_active"] is True


async def test_add_duplicate_repository_rejected(client, auth_headers, sample_project):
    project_id = sample_project["id"]
    await client.post(
        f"/api/v1/projects/{project_id}/repositories",
        json={"github_repo": "owner/sub-repo-1"},
        headers=auth_headers,
    )
    resp = await client.post(
        f"/api/v1/projects/{project_id}/repositories",
        json={"github_repo": "owner/sub-repo-1"},
        headers=auth_headers,
    )
    assert resp.status_code == 409


async def test_add_repository_non_owner_forbidden(client, hunter_headers, sample_project):
    project_id = sample_project["id"]
    resp = await client.post(
        f"/api/v1/projects/{project_id}/repositories",
        json={"github_repo": "owner/sub-repo-unauth"},
        headers=hunter_headers,
    )
    assert resp.status_code == 403


async def test_admin_can_add_repository_to_any_project(client, admin_headers, sample_project):
    project_id = sample_project["id"]
    resp = await client.post(
        f"/api/v1/projects/{project_id}/repositories",
        json={"github_repo": "owner/admin-added-repo"},
        headers=admin_headers,
    )
    assert resp.status_code == 201


async def test_list_and_delete_repositories(client, auth_headers, sample_project):
    project_id = sample_project["id"]
    # Add repo
    create_resp = await client.post(
        f"/api/v1/projects/{project_id}/repositories",
        json={"github_repo": "owner/repo-to-delete"},
        headers=auth_headers,
    )
    repo_id = create_resp.json()["id"]

    # List repos
    list_resp = await client.get(f"/api/v1/projects/{project_id}/repositories")
    assert list_resp.status_code == 200
    repos = list_resp.json()
    assert any(r["id"] == repo_id for r in repos)

    # Delete repo
    del_resp = await client.delete(f"/api/v1/repositories/{repo_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    # Verify deleted
    get_resp = await client.get(f"/api/v1/repositories/{repo_id}")
    assert get_resp.status_code == 404


async def test_list_repository_issues_without_comments(client, auth_headers, sample_project):
    project_id = sample_project["id"]
    create_resp = await client.post(
        f"/api/v1/projects/{project_id}/repositories",
        json={"github_repo": "acme/awesome-lib"},
        headers=auth_headers,
    )
    repo_id = create_resp.json()["id"]

    mock_issues = [
        {
            "number": 101,
            "title": "Fix token transfer edge case",
            "body": "Detailed description of the issue",
            "html_url": "https://github.com/acme/awesome-lib/issues/101",
            "state": "open",
            "author_username": "dev1",
            "labels": ["bug", "greenfield"],
        },
        {
            "number": 102,
            "title": "Implement caching layer",
            "body": "Need redis or memory cache",
            "html_url": "https://github.com/acme/awesome-lib/issues/102",
            "state": "open",
            "author_username": "dev2",
            "labels": ["enhancement"],
        },
    ]

    with patch(
        "app.services.github_service.fetch_repository_issues", AsyncMock(return_value=mock_issues)
    ):
        resp = await client.get(f"/api/v1/repositories/{repo_id}/issues")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]["number"] == 101
        assert data[0]["title"] == "Fix token transfer edge case"
        assert data[0]["has_bounty"] is False
        assert "comments" not in data[0]  # strictly no comments fetched
