VALID_WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"


async def test_get_me(client, auth_headers, user):
    resp = await client.get("/api/v1/users/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == user["id"]
    assert data["username"] == user["username"]


async def test_get_me_unauthorized(client):
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 401


async def test_update_me_wallet(client, auth_headers):
    resp = await client.patch(
        "/api/v1/users/me",
        json={"wallet": VALID_WALLET},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["wallet"] == VALID_WALLET


async def test_get_user_by_id(client, auth_headers, hunter_user):
    resp = await client.get(f"/api/v1/users/{hunter_user['id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == hunter_user["id"]
    assert data["username"] == hunter_user["username"]


async def test_get_user_by_id_not_found(client):
    resp = await client.get("/api/v1/users/999999")
    assert resp.status_code == 404


async def test_list_users_pagination(client, user, hunter_user):
    resp = await client.get("/api/v1/users?limit=10&offset=0")
    assert resp.status_code == 200
    users = resp.json()
    assert isinstance(users, list)
    assert len(users) >= 2
    usernames = [u["username"] for u in users]
    assert user["username"] in usernames
    assert hunter_user["username"] in usernames
