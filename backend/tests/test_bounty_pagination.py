"""GET /bounties pagination (#13)."""

import pytest

from app.db.base import BountyModel


@pytest.fixture
async def many_bounties(client, auth_headers, session_factory):
    project = await client.post(
        "/api/v1/projects",
        json={"github_repo": "GermanoDevelopment/greenfield"},
        headers=auth_headers,
    )
    project_id = project.json()["id"]
    async with session_factory() as session:
        project_owner = (await client.get("/api/v1/auth/me", headers=auth_headers)).json()["id"]
        for n in range(1, 8):
            session.add(
                BountyModel(
                    project_id=project_id,
                    issuer_id=project_owner,
                    issue_url=f"https://github.com/GermanoDevelopment/greenfield/issues/{n}",
                    issue_number=n,
                    amount_usdc=1_000_000,
                    status="CANCELLED" if n % 3 == 0 else "OPEN",
                )
            )
        await session.commit()
    return project_id


async def test_pages_cover_every_bounty_once(client, many_bounties):
    seen = []
    offset = 0
    pages = 0
    while offset is not None:
        resp = await client.get(f"/api/v1/bounties?limit=3&offset={offset}")
        assert resp.status_code == 200
        assert resp.headers["X-Total-Count"] == "7"
        assert len(resp.json()) <= 3
        seen.extend(b["id"] for b in resp.json())
        next_offset = resp.headers.get("X-Next-Offset")
        offset = int(next_offset) if next_offset is not None else None
        pages += 1

    assert pages == 3
    assert len(seen) == len(set(seen)) == 7


async def test_last_page_has_no_next_offset(client, many_bounties):
    resp = await client.get("/api/v1/bounties?limit=3&offset=6")
    assert len(resp.json()) == 1
    assert "X-Next-Offset" not in resp.headers

    beyond = await client.get("/api/v1/bounties?offset=50")
    assert beyond.json() == []
    assert beyond.headers["X-Total-Count"] == "7"


async def test_total_respects_filters(client, many_bounties):
    resp = await client.get("/api/v1/bounties?status=CANCELLED&limit=1")
    assert resp.headers["X-Total-Count"] == "2"
    assert resp.headers["X-Next-Offset"] == "1"
    assert all(b["status"] == "CANCELLED" for b in resp.json())


async def test_default_page_returns_everything_when_small(client, many_bounties):
    resp = await client.get("/api/v1/bounties")
    assert len(resp.json()) == 7
    assert "X-Next-Offset" not in resp.headers


@pytest.mark.parametrize("query", ["limit=0", "limit=501", "offset=-1", "limit=abc"])
async def test_invalid_paging_params(client, query):
    resp = await client.get(f"/api/v1/bounties?{query}")
    assert resp.status_code == 422


async def test_paging_headers_exposed_to_browsers(client):
    resp = await client.get("/api/v1/bounties", headers={"Origin": "http://localhost:5173"})
    exposed = resp.headers["Access-Control-Expose-Headers"]
    assert "X-Total-Count" in exposed
    assert "X-Next-Offset" in exposed
