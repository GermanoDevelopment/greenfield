import pytest

from app.services.admin_seed import seed_default_admins


@pytest.fixture(autouse=True)
async def seed_admins(session_factory):
    async with session_factory() as session:
        await seed_default_admins(session)


@pytest.mark.parametrize(
    "email,username",
    [
        ("germano@greenfield.com", "germano"),
        ("dione@greenfield.com", "dione"),
        ("kaue@greenfield.com", "kaue"),
        ("pedro@greenfield.com", "pedro"),
    ],
)
async def test_admin_login_success(client, email, username):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "admin123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == email
    assert data["user"]["username"] == username
    assert data["user"]["role"] == "ADMIN"


async def test_admin_login_wrong_password(client):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "germano@greenfield.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401
    assert "E-mail ou senha incorretos" in resp.json()["detail"]


async def test_admin_login_nonexistent_email(client):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "desconhecido@greenfield.com", "password": "admin123"},
    )
    assert resp.status_code == 401
    assert "E-mail ou senha incorretos" in resp.json()["detail"]


async def test_register_and_login_new_user(client):
    # Registrar novo dev
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "solana_builder@gmail.com",
            "password": "mysecurepassword",
            "username": "solanabuilder",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["user"]["email"] == "solana_builder@gmail.com"
    assert data["user"]["role"] == "CONTRIBUTOR"

    # Login com o novo dev
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "solana_builder@gmail.com", "password": "mysecurepassword"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # Validar /me com o token
    me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "solana_builder@gmail.com"


async def test_register_duplicate_email(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "germano@greenfield.com",
            "password": "admin123",
            "username": "germano_dup",
        },
    )
    assert resp.status_code == 409
    assert "já está cadastrado" in resp.json()["detail"]


async def test_admin_access_protected_endpoint(client):
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "germano@greenfield.com", "password": "admin123"},
    )
    token = login_resp.json()["access_token"]

    admin_resp = await client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert admin_resp.status_code == 200
