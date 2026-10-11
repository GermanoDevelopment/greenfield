import base58
import pytest
import respx
from httpx import Response
from solders.keypair import Keypair
from solders.pubkey import Pubkey

from app.core.config import Settings, get_settings
from app.services.solana_service import (
    BOUNTY_STATUS_CLAIMED,
    BOUNTY_STATUS_OPEN,
    SolanaNotConfiguredError,
    SolanaServiceError,
    _anchor_discriminator,
    _confirm_signature,
    _rpc_request,
    approve_claim_onchain,
    assign_developer_onchain,
    cancel_bounty_onchain,
    create_bounty_onchain,
    decode_bounty_account,
    decode_treasury_account,
    execute_bounty_payout,
    find_bounty_pda,
    find_treasury_pda,
    find_vault_pda,
    get_authority_keypair,
    get_bounty_account,
    get_token_balance,
    get_treasury_account,
    get_treasury_keypair,
    initialize_treasury_onchain,
    is_onchain_enabled,
    validate_wallet_address,
    verify_escrow_funded,
)

VALID_WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
PROGRAM_ID_STR = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"


def test_validate_wallet_address():
    assert validate_wallet_address(VALID_WALLET) is True
    assert validate_wallet_address("invalid-base58-!@#$") is False
    assert validate_wallet_address("") is False
    # Base58 string that decodes to 10 bytes instead of 32
    short_b58 = base58.b58encode(b"short").decode("ascii")
    assert validate_wallet_address(short_b58) is False


def test_anchor_discriminator():
    disc = _anchor_discriminator("initialize_treasury")
    assert len(disc) == 8
    assert isinstance(disc, bytes)


def test_pda_derivations():
    prog = Pubkey.from_string(PROGRAM_ID_STR)
    mint = Pubkey.from_string(VALID_WALLET)

    treasury, bump1 = find_treasury_pda(prog, mint)
    assert isinstance(treasury, Pubkey)
    assert 0 <= bump1 <= 255

    vault, bump2 = find_vault_pda(prog, treasury)
    assert isinstance(vault, Pubkey)
    assert 0 <= bump2 <= 255

    bounty, bump3 = find_bounty_pda(prog, treasury, 42)
    assert isinstance(bounty, Pubkey)
    assert 0 <= bump3 <= 255


@respx.mock
async def test_rpc_request_success():
    rpc_url = get_settings().solana_rpc_url
    route = respx.post(rpc_url).respond(
        status_code=200,
        json={"jsonrpc": "2.0", "id": 1, "result": {"value": 12345}},
    )
    result = await _rpc_request("getBalance", [VALID_WALLET])
    assert result == {"value": 12345}
    assert route.called


@respx.mock
async def test_rpc_request_http_error():
    rpc_url = get_settings().solana_rpc_url
    respx.post(rpc_url).respond(status_code=500)
    with pytest.raises(SolanaServiceError, match="Solana RPC error \\(500\\)"):
        await _rpc_request("getBalance", [VALID_WALLET])


@respx.mock
async def test_rpc_request_rpc_error_payload():
    rpc_url = get_settings().solana_rpc_url
    respx.post(rpc_url).respond(
        status_code=200,
        json={"jsonrpc": "2.0", "id": 1, "error": {"code": -32600, "message": "Invalid request"}},
    )
    with pytest.raises(SolanaServiceError, match="Solana RPC error"):
        await _rpc_request("getBalance", [VALID_WALLET])


@respx.mock
async def test_get_token_balance():
    rpc_url = get_settings().solana_rpc_url
    respx.post(rpc_url).respond(
        status_code=200,
        json={
            "jsonrpc": "2.0",
            "id": 1,
            "result": {
                "value": [
                    {
                        "account": {
                            "data": {
                                "parsed": {
                                    "info": {"tokenAmount": {"uiAmount": 25.5}},
                                }
                            }
                        }
                    },
                    {
                        "account": {
                            "data": {
                                "parsed": {
                                    "info": {"tokenAmount": {"uiAmount": 10.0}},
                                }
                            }
                        }
                    },
                ]
            },
        },
    )

    balance = await get_token_balance(VALID_WALLET)
    assert balance == 35.5


async def test_get_token_balance_invalid_wallet():
    with pytest.raises(SolanaServiceError, match="Invalid Solana wallet address"):
        await get_token_balance("bad-wallet")


@respx.mock
async def test_verify_escrow_funded():
    rpc_url = get_settings().solana_rpc_url
    respx.post(rpc_url).respond(
        status_code=200,
        json={
            "jsonrpc": "2.0",
            "id": 1,
            "result": {
                "value": [
                    {
                        "account": {
                            "data": {
                                "parsed": {
                                    "info": {"tokenAmount": {"uiAmount": 50.0}},
                                }
                            }
                        }
                    }
                ]
            },
        },
    )

    assert await verify_escrow_funded(VALID_WALLET, 50.0) is True
    assert await verify_escrow_funded(VALID_WALLET, 100.0) is False
    assert await verify_escrow_funded("invalid-wallet", 50.0) is None


def test_get_treasury_keypair(monkeypatch, tmp_path):
    kp = Keypair()
    b58_key = base58.b58encode(bytes(kp)).decode("ascii")

    # 1. From settings.solana_treasury_private_key
    monkeypatch.setattr(get_settings(), "solana_authority_secret_key", "")
    monkeypatch.setattr(get_settings(), "solana_treasury_keypair_path", None)
    monkeypatch.setattr(get_settings(), "solana_treasury_private_key", b58_key)
    treasury_kp = get_treasury_keypair()
    assert str(treasury_kp.pubkey()) == str(kp.pubkey())

    # 2. From settings.solana_authority_secret_key
    monkeypatch.setattr(get_settings(), "solana_authority_secret_key", b58_key)
    monkeypatch.setattr(get_settings(), "solana_program_id", PROGRAM_ID_STR)
    treasury_kp2 = get_treasury_keypair()
    assert str(treasury_kp2.pubkey()) == str(kp.pubkey())


def test_is_onchain_enabled(monkeypatch):
    monkeypatch.setattr(get_settings(), "solana_program_id", "")
    monkeypatch.setattr(get_settings(), "solana_authority_secret_key", "")
    assert is_onchain_enabled() is False

    monkeypatch.setattr(get_settings(), "solana_program_id", PROGRAM_ID_STR)
    monkeypatch.setattr(get_settings(), "solana_authority_secret_key", "secret")
    assert is_onchain_enabled() is True


def test_get_authority_keypair_json_format():
    kp = Keypair()
    kp_bytes = list(bytes(kp))
    import json

    settings = Settings(solana_authority_secret_key=json.dumps(kp_bytes))
    loaded = get_authority_keypair(settings)
    assert str(loaded.pubkey()) == str(kp.pubkey())


def test_get_authority_keypair_not_configured():
    settings = Settings(solana_authority_secret_key="")
    with pytest.raises(SolanaNotConfiguredError):
        get_authority_keypair(settings)


@respx.mock
async def test_confirm_signature_success():
    rpc_url = get_settings().solana_rpc_url
    respx.post(rpc_url).respond(
        status_code=200,
        json={
            "jsonrpc": "2.0",
            "id": 1,
            "result": {"value": [{"err": None, "confirmationStatus": "confirmed"}]},
        },
    )
    # Should complete without error
    await _confirm_signature("fake-signature", timeout_s=5.0)


@respx.mock
async def test_confirm_signature_error():
    rpc_url = get_settings().solana_rpc_url
    respx.post(rpc_url).respond(
        status_code=200,
        json={
            "jsonrpc": "2.0",
            "id": 1,
            "result": {
                "value": [
                    {"err": {"InstructionError": [0, "Custom"]}, "confirmationStatus": "confirmed"}
                ]
            },
        },
    )
    with pytest.raises(SolanaServiceError, match="On-chain transaction failed"):
        await _confirm_signature("fake-signature", timeout_s=5.0)


@respx.mock
async def test_onchain_bounty_operations(monkeypatch):
    kp = Keypair()
    b58_key = base58.b58encode(bytes(kp)).decode("ascii")
    monkeypatch.setattr(get_settings(), "solana_program_id", PROGRAM_ID_STR)
    monkeypatch.setattr(get_settings(), "solana_authority_secret_key", b58_key)

    rpc_url = get_settings().solana_rpc_url

    # Mock getLatestBlockhash, sendTransaction, getSignatureStatuses
    blockhash = str(Pubkey.from_string(VALID_WALLET))
    respx.post(rpc_url).mock(side_effect=lambda request: _mock_rpc_dispatcher(request, blockhash))

    sig1 = await initialize_treasury_onchain()
    assert sig1 == "fake-tx-sig"

    sig2 = await create_bounty_onchain(101, 10_000_000, VALID_WALLET)
    assert sig2 == "fake-tx-sig"

    sig3 = await assign_developer_onchain(101, VALID_WALLET)
    assert sig3 == "fake-tx-sig"

    sig4 = await approve_claim_onchain(101)
    assert sig4 == "fake-tx-sig"

    sig5 = await cancel_bounty_onchain(101)
    assert sig5 == "fake-tx-sig"


def _mock_rpc_dispatcher(request, blockhash):
    import json

    data = json.loads(request.content)
    method = data.get("method")
    if method == "getLatestBlockhash":
        return Response(
            200, json={"jsonrpc": "2.0", "id": 1, "result": {"value": {"blockhash": blockhash}}}
        )
    elif method == "sendTransaction":
        return Response(200, json={"jsonrpc": "2.0", "id": 1, "result": "fake-tx-sig"})
    elif method == "getSignatureStatuses":
        return Response(
            200,
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "result": {"value": [{"err": None, "confirmationStatus": "finalized"}]},
            },
        )
    return Response(200, json={"jsonrpc": "2.0", "id": 1, "result": None})


def test_decode_treasury_account():
    import struct

    auth = Pubkey.from_string(VALID_WALLET)
    mint = Pubkey.from_string(VALID_WALLET)
    vault = Pubkey.from_string(VALID_WALLET)
    raw = (
        b"0" * 8
        + bytes(auth)
        + bytes(mint)
        + bytes(vault)
        + struct.pack("<QQQB", 1000, 500, 200, 254)
    )
    decoded = decode_treasury_account(raw)
    assert decoded["authority"] == VALID_WALLET
    assert decoded["mint"] == VALID_WALLET
    assert decoded["vault"] == VALID_WALLET
    assert decoded["total_deposited"] == 1000
    assert decoded["total_reserved"] == 500
    assert decoded["total_claimed"] == 200
    assert decoded["bump"] == 254


def test_decode_bounty_account():
    import struct

    treasury = Pubkey.from_string(VALID_WALLET)
    maintainer = Pubkey.from_string(VALID_WALLET)
    dev = Pubkey.from_string(VALID_WALLET)
    raw = (
        b"0" * 8
        + bytes(treasury)
        + struct.pack("<Q", 42)
        + bytes(maintainer)
        + b"\x01"
        + bytes(dev)
        + struct.pack("<QBB", 1_000_000, BOUNTY_STATUS_OPEN, 255)
    )
    decoded = decode_bounty_account(raw)
    assert decoded["bounty_id"] == 42
    assert decoded["maintainer"] == VALID_WALLET
    assert decoded["developer"] == VALID_WALLET
    assert decoded["amount"] == 1_000_000
    assert decoded["status"] == BOUNTY_STATUS_OPEN
    assert decoded["bump"] == 255


@respx.mock
async def test_get_treasury_account(monkeypatch):
    import base64
    import struct

    monkeypatch.setattr(get_settings(), "solana_program_id", PROGRAM_ID_STR)
    rpc_url = get_settings().solana_rpc_url

    auth = Pubkey.from_string(VALID_WALLET)
    mint = Pubkey.from_string(VALID_WALLET)
    vault = Pubkey.from_string(VALID_WALLET)
    raw = (
        b"0" * 8
        + bytes(auth)
        + bytes(mint)
        + bytes(vault)
        + struct.pack("<QQQB", 5000, 2000, 1000, 250)
    )
    b64_data = base64.b64encode(raw).decode("ascii")

    respx.post(rpc_url).respond(
        status_code=200,
        json={"jsonrpc": "2.0", "id": 1, "result": {"value": {"data": [b64_data, "base64"]}}},
    )

    account = await get_treasury_account()
    assert account is not None
    assert account["total_deposited"] == 5000


@respx.mock
async def test_get_bounty_account(monkeypatch):
    import base64
    import struct

    monkeypatch.setattr(get_settings(), "solana_program_id", PROGRAM_ID_STR)
    rpc_url = get_settings().solana_rpc_url

    treasury = Pubkey.from_string(VALID_WALLET)
    maintainer = Pubkey.from_string(VALID_WALLET)
    raw = (
        b"0" * 8
        + bytes(treasury)
        + struct.pack("<Q", 7)
        + bytes(maintainer)
        + b"\x00"  # no developer
        + struct.pack("<QBB", 5_000_000, BOUNTY_STATUS_CLAIMED, 253)
    )
    b64_data = base64.b64encode(raw).decode("ascii")

    respx.post(rpc_url).respond(
        status_code=200,
        json={"jsonrpc": "2.0", "id": 1, "result": {"value": {"data": [b64_data, "base64"]}}},
    )

    account = await get_bounty_account(7)
    assert account is not None
    assert account["bounty_id"] == 7
    assert account["developer"] is None
    assert account["status"] == BOUNTY_STATUS_CLAIMED


@respx.mock
async def test_execute_bounty_payout(monkeypatch):
    kp = Keypair()
    b58_key = base58.b58encode(bytes(kp)).decode("ascii")
    monkeypatch.setattr(get_settings(), "solana_treasury_private_key", b58_key)
    monkeypatch.setattr(get_settings(), "solana_authority_secret_key", "")
    monkeypatch.setattr(get_settings(), "solana_treasury_keypair_path", None)

    rpc_url = get_settings().solana_rpc_url
    blockhash = str(Pubkey.from_string(VALID_WALLET))

    def _payout_dispatcher(request):
        import json

        data = json.loads(request.content)
        method = data.get("method")
        if method == "getAccountInfo":
            # Return value None to test receiver ATA creation branch
            return Response(200, json={"jsonrpc": "2.0", "id": 1, "result": {"value": None}})
        elif method == "getLatestBlockhash":
            return Response(
                200, json={"jsonrpc": "2.0", "id": 1, "result": {"value": {"blockhash": blockhash}}}
            )
        elif method == "sendTransaction":
            return Response(200, json={"jsonrpc": "2.0", "id": 1, "result": "sig-payout-success"})
        return Response(200, json={"jsonrpc": "2.0", "id": 1, "result": None})

    respx.post(rpc_url).mock(side_effect=_payout_dispatcher)

    sig = await execute_bounty_payout(VALID_WALLET, 5_000_000)
    assert sig == "sig-payout-success"
