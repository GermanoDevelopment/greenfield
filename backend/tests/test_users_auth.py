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


async def test_wallet_challenge_issuance(client, auth_headers):
    resp = await client.post("/api/v1/users/me/wallet/challenge", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "nonce" in data and len(data["nonce"]) == 32
    assert "message" in data and data["nonce"] in data["message"]
    assert "expires_at" in data


async def test_update_wallet_with_proof(client, auth_headers):
    from solders.keypair import Keypair

    kp = Keypair()
    wallet = str(kp.pubkey())

    # 1. Request challenge
    c_resp = await client.post("/api/v1/users/me/wallet/challenge", headers=auth_headers)
    assert c_resp.status_code == 200
    challenge = c_resp.json()

    # 2. Sign message
    sig = str(kp.sign_message(challenge["message"].encode("utf-8")))

    # 3. Verify and link
    resp = await client.post(
        "/api/v1/users/me/wallet/verify",
        json={"wallet": wallet, "nonce": challenge["nonce"], "signature": sig},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["wallet"] == wallet

    # 4. Check /auth/me reflects the updated wallet
    me_resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_resp.json()["wallet"] == wallet


async def test_update_wallet_via_patch_with_proof(client, auth_headers):
    from solders.keypair import Keypair

    kp = Keypair()
    wallet = str(kp.pubkey())

    c_resp = await client.post("/api/v1/users/me/wallet/challenge", headers=auth_headers)
    challenge = c_resp.json()
    sig = str(kp.sign_message(challenge["message"].encode("utf-8")))

    resp = await client.patch(
        "/api/v1/users/me",
        json={"wallet": wallet, "nonce": challenge["nonce"], "signature": sig},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["wallet"] == wallet


async def test_update_wallet_without_proof_rejected(client, auth_headers):
    wallet = "Gh9ZwEmdLJ8D4K57kFk3GdW5Z5xktf7P7S8cmXscn7dd"
    resp = await client.patch("/api/v1/users/me", json={"wallet": wallet}, headers=auth_headers)
    assert resp.status_code == 422
    assert "cryptographic proof of ownership" in resp.json()["detail"]


async def test_replayed_nonce_rejected(client, auth_headers):
    from solders.keypair import Keypair

    kp = Keypair()
    wallet = str(kp.pubkey())

    c_resp = await client.post("/api/v1/users/me/wallet/challenge", headers=auth_headers)
    challenge = c_resp.json()
    sig = str(kp.sign_message(challenge["message"].encode("utf-8")))

    # First use succeeds
    resp1 = await client.post(
        "/api/v1/users/me/wallet/verify",
        json={"wallet": wallet, "nonce": challenge["nonce"], "signature": sig},
        headers=auth_headers,
    )
    assert resp1.status_code == 200

    # Second use with same nonce is rejected as replay
    resp2 = await client.post(
        "/api/v1/users/me/wallet/verify",
        json={"wallet": wallet, "nonce": challenge["nonce"], "signature": sig},
        headers=auth_headers,
    )
    assert resp2.status_code == 422
    assert "already been used" in resp2.json()["detail"]


async def test_expired_nonce_rejected(client, auth_headers, monkeypatch):
    import time

    from solders.keypair import Keypair

    kp = Keypair()
    wallet = str(kp.pubkey())

    c_resp = await client.post("/api/v1/users/me/wallet/challenge", headers=auth_headers)
    challenge = c_resp.json()
    sig = str(kp.sign_message(challenge["message"].encode("utf-8")))

    # Advance time past expiration (10 min + 1 sec)
    future_time = time.time() + 601
    monkeypatch.setattr(time, "time", lambda: future_time)

    resp = await client.post(
        "/api/v1/users/me/wallet/verify",
        json={"wallet": wallet, "nonce": challenge["nonce"], "signature": sig},
        headers=auth_headers,
    )
    assert resp.status_code == 422
    assert "expired" in resp.json()["detail"]


async def test_invalid_signature_rejected(client, auth_headers):
    from solders.keypair import Keypair

    kp1 = Keypair()
    kp2 = Keypair()
    wallet1 = str(kp1.pubkey())

    c_resp = await client.post("/api/v1/users/me/wallet/challenge", headers=auth_headers)
    challenge = c_resp.json()

    # Sign with kp2 instead of kp1
    sig_wrong = str(kp2.sign_message(challenge["message"].encode("utf-8")))

    resp = await client.post(
        "/api/v1/users/me/wallet/verify",
        json={"wallet": wallet1, "nonce": challenge["nonce"], "signature": sig_wrong},
        headers=auth_headers,
    )
    assert resp.status_code == 422
    assert "Signature does not match" in resp.json()["detail"]


async def test_change_wallet_blocked_with_active_bounty(client, hunter_headers, auth_headers):
    from solders.keypair import Keypair

    p_resp = await client.post(
        "/api/v1/projects",
        json={"github_repo": "owner/main-project"},
        headers=auth_headers,
    )
    assert p_resp.status_code == 201
    project_id = p_resp.json()["id"]

    # Hunter links initial wallet
    kp1 = Keypair()
    c_resp = await client.post("/api/v1/users/me/wallet/challenge", headers=hunter_headers)
    sig1 = str(kp1.sign_message(c_resp.json()["message"].encode("utf-8")))
    await client.post(
        "/api/v1/users/me/wallet/verify",
        json={"wallet": str(kp1.pubkey()), "nonce": c_resp.json()["nonce"], "signature": sig1},
        headers=hunter_headers,
    )

    # Maintainer creates and assigns bounty to hunter
    bounty_resp = await client.post(
        "/api/v1/bounties",
        json={
            "project_id": project_id,
            "issue_url": "https://github.com/owner/main-project/issues/50",
            "amount_usdc": 100_000_000,
        },
        headers=auth_headers,
    )
    bounty_id = bounty_resp.json()["id"]
    await client.post(f"/api/v1/bounties/{bounty_id}/assign", headers=hunter_headers)

    # Hunter tries to change wallet to a new address while assigned
    kp2 = Keypair()
    c_resp2 = await client.post("/api/v1/users/me/wallet/challenge", headers=hunter_headers)
    sig2 = str(kp2.sign_message(c_resp2.json()["message"].encode("utf-8")))
    change_resp = await client.post(
        "/api/v1/users/me/wallet/verify",
        json={"wallet": str(kp2.pubkey()), "nonce": c_resp2.json()["nonce"], "signature": sig2},
        headers=hunter_headers,
    )
    assert change_resp.status_code == 403
    assert "Cannot change wallet while assigned to an active" in change_resp.json()["detail"]


@pytest.mark.parametrize(
    "wallet",
    ["invalid-wallet", "", "abc123xyz"],
)
async def test_update_wallet_invalid(client, auth_headers, wallet):
    resp = await client.patch(
        "/api/v1/users/me",
        json={"wallet": wallet, "nonce": "dummy", "signature": "dummy"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_get_user_public(client, user):
    resp = await client.get(f"/api/v1/users/{user['id']}")
    assert resp.status_code == 200
    assert resp.json()["username"] == "alice"


async def test_get_user_not_found(client):
    resp = await client.get("/api/v1/users/99999")
    assert resp.status_code == 404
