import pytest


async def test_me_requires_auth(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


async def test_me_with_token(client, auth_headers, user):
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == user["id"]
    assert data["username"] == "alice"


async def test_me_with_invalid_token(client):
    headers = {"Authorization": "Bearer invalid.token.here"}
    resp = await client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 401


async def test_update_wallet(client, auth_headers):
    wallet = "Gh9ZwEmdLJ8D4K57kFk3GdW5Z5xktf7P7S8cmXscn7dd"
    resp = await client.patch("/api/v1/users/me", json={"wallet": wallet}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["wallet"] == wallet

    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.json()["wallet"] == wallet


@pytest.mark.parametrize(
    "wallet",
    ["invalid-wallet", "", "abc123xyz"],
)
async def test_update_wallet_invalid(client, auth_headers, wallet):
    resp = await client.patch("/api/v1/users/me", json={"wallet": wallet}, headers=auth_headers)
    assert resp.status_code == 422


async def test_get_user_public(client, user):
    resp = await client.get(f"/api/v1/users/{user['id']}")
    assert resp.status_code == 200
    assert resp.json()["username"] == "alice"


async def test_get_user_not_found(client):
    resp = await client.get("/api/v1/users/99999")
    assert resp.status_code == 404
