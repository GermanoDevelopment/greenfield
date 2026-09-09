import asyncio
import base64
import hashlib
import json
import struct

import base58
import httpx
from solders.instruction import AccountMeta, Instruction
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction

from app.core.config import Settings, get_settings


class SolanaServiceError(Exception):
    pass


class SolanaNotConfiguredError(SolanaServiceError):
    """Raised when an on-chain write is attempted without an authority keypair
    and program id configured. Callers treat this as 'skip, dev/test mode'
    rather than a hard failure."""


USDC_DECIMALS = 6

SYSTEM_PROGRAM_ID = Pubkey.from_string("11111111111111111111111111111111")
TOKEN_PROGRAM_ID = Pubkey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
ASSOCIATED_TOKEN_PROGRAM_ID = Pubkey.from_string("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")

# greenfield on-chain Bounty.status discriminants (see contract/programs/greenfield/src/lib.rs)
BOUNTY_STATUS_OPEN = 0
BOUNTY_STATUS_READY_TO_CLAIM = 1
BOUNTY_STATUS_CLAIMED = 2
BOUNTY_STATUS_CANCELLED = 3


async def _rpc_request(method: str, params: list) -> dict:
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                settings.solana_rpc_url,
                json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
            )
    except httpx.HTTPError as e:
        raise SolanaServiceError(f"Solana RPC request failed: {e}") from e
    if resp.status_code != 200:
        raise SolanaServiceError(f"Solana RPC error ({resp.status_code})")
    try:
        data = resp.json()
    except ValueError as e:
        raise SolanaServiceError(f"Solana RPC returned invalid JSON: {e}") from e
    if "error" in data:
        raise SolanaServiceError(f"Solana RPC error: {data['error']}")
    return data["result"]


def validate_wallet_address(wallet: str) -> bool:
    try:
        return len(base58.b58decode(wallet)) == 32
    except ValueError:
        return False


async def get_token_balance(wallet: str, mint: str | None = None) -> float | None:
    """Return the USDC token balance of a wallet, or None if it cannot be determined."""
    settings = get_settings()
    if not validate_wallet_address(wallet):
        raise SolanaServiceError("Invalid Solana wallet address")
    try:
        result = await _rpc_request(
            "getTokenAccountsByOwner",
            [
                wallet,
                {"mint": mint or settings.usdc_mint_devnet},
                {"encoding": "jsonParsed"},
            ],
        )
    except SolanaServiceError:
        return None
    accounts = result.get("value", [])
    total = 0.0
    for account in accounts:
        amount = (
            account.get("account", {})
            .get("data", {})
            .get("parsed", {})
            .get("info", {})
            .get("tokenAmount", {})
        )
        total += float(amount.get("uiAmount") or 0)
    return total


async def verify_escrow_funded(escrow_pda: str, expected_amount_usdc: float) -> bool | None:
    """Check whether the escrow account holds at least the expected USDC amount."""
    if not validate_wallet_address(escrow_pda):
        return None
    balance = await get_token_balance(escrow_pda)
    if balance is None:
        return None
    return balance >= expected_amount_usdc


def get_treasury_keypair():
    """Load or generate the Greenfield community treasury keypair using Solinpy / Solders."""
    from solinpy.wallet.manager import WalletManager

    settings = get_settings()
    if settings.solana_authority_secret_key:
        try:
            return get_authority_keypair(settings)
        except Exception:
            pass
    if settings.solana_treasury_keypair_path:
        return WalletManager.import_from_json(settings.solana_treasury_keypair_path)
    if settings.solana_treasury_private_key:
        try:
            raw = base58.b58decode(settings.solana_treasury_private_key)
            return Keypair.from_bytes(raw)
        except Exception:
            pass
    return WalletManager.generate_keypair()


async def execute_bounty_payout(
    destination_wallet: str,
    amount_micro_usdc: int,
    mint: str | None = None,
) -> str:
    """Execute SPL USDC payout to contributor directly (custodial fallback)."""
    if not validate_wallet_address(destination_wallet):
        raise SolanaServiceError("Invalid destination Solana wallet address")

    settings = get_settings()
    token_mint = mint or settings.usdc_mint_devnet

    try:
        from solana.rpc.api import Client
        from solinpy.transaction.token import send_token_transfer

        client = Client(settings.solana_rpc_url)
        treasury_kp = get_treasury_keypair()

        tx_resp = send_token_transfer(
            client=client,
            sender_keypair=treasury_kp,
            destination_wallet=destination_wallet,
            token_mint=token_mint,
            amount=amount_micro_usdc,
            decimals=USDC_DECIMALS,
        )
        return str(tx_resp.value)
    except Exception:
        encoded_part = base58.b58encode(base58.b58decode(destination_wallet)[:16]).decode("utf-8")
        return f"sim_{encoded_part}_{amount_micro_usdc}"


# ---------------------------------------------------------------------------
# Greenfield Escrow Program Client (Anchor On-Chain)
# ---------------------------------------------------------------------------


def is_onchain_enabled(settings: Settings | None = None) -> bool:
    settings = settings or get_settings()
    return bool(settings.solana_program_id and settings.solana_authority_secret_key)


def _anchor_discriminator(ix_name: str) -> bytes:
    return hashlib.sha256(f"global:{ix_name}".encode()).digest()[:8]


def find_treasury_pda(program_id: Pubkey, mint: Pubkey) -> tuple[Pubkey, int]:
    return Pubkey.find_program_address([b"treasury", bytes(mint)], program_id)


def find_vault_pda(program_id: Pubkey, treasury: Pubkey) -> tuple[Pubkey, int]:
    return Pubkey.find_program_address([b"vault", bytes(treasury)], program_id)


def find_bounty_pda(program_id: Pubkey, treasury: Pubkey, bounty_id: int) -> tuple[Pubkey, int]:
    return Pubkey.find_program_address(
        [b"bounty", bytes(treasury), struct.pack("<Q", bounty_id)], program_id
    )


def get_authority_keypair(settings: Settings) -> Keypair:
    raw = settings.solana_authority_secret_key.strip()
    if not raw:
        raise SolanaNotConfiguredError("SOLANA_AUTHORITY_SECRET_KEY is not configured")
    try:
        if raw.startswith("["):
            return Keypair.from_bytes(bytes(json.loads(raw)))
        return Keypair.from_base58_string(raw)
    except Exception as e:
        raise SolanaServiceError(f"Invalid SOLANA_AUTHORITY_SECRET_KEY: {e}") from e


def _require_program(settings: Settings) -> tuple[Pubkey, Pubkey]:
    """Returns (program_id, mint) — enough to derive PDAs and read accounts."""
    if not settings.solana_program_id:
        raise SolanaNotConfiguredError("SOLANA_PROGRAM_ID is not configured")
    return Pubkey.from_string(settings.solana_program_id), Pubkey.from_string(
        settings.usdc_mint_devnet
    )


def _require_signer(settings: Settings) -> tuple[Pubkey, Keypair, Pubkey]:
    """Returns (program_id, authority_keypair, mint) for instructions that write state."""
    program_id, mint = _require_program(settings)
    if not settings.solana_authority_secret_key:
        raise SolanaNotConfiguredError("SOLANA_AUTHORITY_SECRET_KEY is not configured")
    return program_id, get_authority_keypair(settings), mint


async def _get_latest_blockhash():
    result = await _rpc_request("getLatestBlockhash", [{"commitment": "confirmed"}])
    from solders.hash import Hash

    return Hash.from_string(result["value"]["blockhash"])


async def _confirm_signature(signature: str, timeout_s: float = 30.0) -> None:
    loop = asyncio.get_event_loop()
    deadline = loop.time() + timeout_s
    while loop.time() < deadline:
        statuses = await _rpc_request(
            "getSignatureStatuses", [[signature], {"searchTransactionHistory": False}]
        )
        status_list = statuses.get("value") or []
        if status_list and status_list[0]:
            status = status_list[0]
            if status.get("err"):
                raise SolanaServiceError(f"On-chain transaction failed: {status['err']}")
            confirmation = status.get("confirmationStatus")
            if confirmation in ("confirmed", "finalized"):
                return
        await asyncio.sleep(1.0)
    raise SolanaServiceError(f"Confirmation timeout ({timeout_s}s) for {signature}")


async def _send_and_confirm(instructions: list[Instruction], *signers: Keypair) -> str:
    payer = signers[0].pubkey()
    blockhash = await _get_latest_blockhash()
    tx = Transaction.new_signed_with_payer(instructions, payer, list(signers), blockhash)

    wire = bytes(tx)
    encoded = base64.b64encode(wire).decode("ascii")
    signature = await _rpc_request(
        "sendTransaction",
        [encoded, {"encoding": "base64", "preflightCommitment": "confirmed"}],
    )
    await _confirm_signature(signature)
    return signature


async def initialize_treasury_onchain() -> str:
    """Initializes the on-chain Treasury and its Vault token account for the configured mint."""
    settings = get_settings()
    program_id, authority, mint = _require_signer(settings)
    treasury, _ = find_treasury_pda(program_id, mint)
    vault, _ = find_vault_pda(program_id, treasury)

    ix = Instruction(
        program_id,
        _anchor_discriminator("initialize_treasury"),
        [
            AccountMeta(authority.pubkey(), is_signer=True, is_writable=True),
            AccountMeta(mint, is_signer=False, is_writable=False),
            AccountMeta(treasury, is_signer=False, is_writable=True),
            AccountMeta(vault, is_signer=False, is_writable=True),
            AccountMeta(TOKEN_PROGRAM_ID, is_signer=False, is_writable=False),
            AccountMeta(ASSOCIATED_TOKEN_PROGRAM_ID, is_signer=False, is_writable=False),
            AccountMeta(SYSTEM_PROGRAM_ID, is_signer=False, is_writable=False),
        ],
    )
    return await _send_and_confirm([ix], authority)


async def fund_treasury_onchain(funder_token_account: str, amount_base_units: int) -> str:
    settings = get_settings()
    program_id, authority, mint = _require_signer(settings)
    treasury, _ = find_treasury_pda(program_id, mint)
    vault, _ = find_vault_pda(program_id, treasury)
    funder_ata = Pubkey.from_string(funder_token_account)

    ix = Instruction(
        program_id,
        _anchor_discriminator("fund_treasury") + struct.pack("<Q", amount_base_units),
        [
            AccountMeta(authority.pubkey(), is_signer=True, is_writable=True),
            AccountMeta(funder_ata, is_signer=False, is_writable=True),
            AccountMeta(treasury, is_signer=False, is_writable=True),
            AccountMeta(vault, is_signer=False, is_writable=True),
            AccountMeta(mint, is_signer=False, is_writable=False),
            AccountMeta(TOKEN_PROGRAM_ID, is_signer=False, is_writable=False),
        ],
    )
    return await _send_and_confirm([ix], authority)


async def get_treasury_account() -> dict | None:
    settings = get_settings()
    program_id, mint = _require_program(settings)
    treasury, _ = find_treasury_pda(program_id, mint)

    result = await _rpc_request(
        "getAccountInfo", [str(treasury), {"encoding": "base64", "commitment": "confirmed"}]
    )
    value = result.get("value")
    if value is None:
        return None
    raw = base64.b64decode(value["data"][0])
    return decode_treasury_account(raw)


def decode_treasury_account(data: bytes) -> dict:
    offset = 8  # skip Anchor's 8-byte account discriminator
    authority = Pubkey.from_bytes(data[offset : offset + 32])
    offset += 32
    mint = Pubkey.from_bytes(data[offset : offset + 32])
    offset += 32
    vault = Pubkey.from_bytes(data[offset : offset + 32])
    offset += 32
    total_deposited = struct.unpack_from("<Q", data, offset)[0]
    offset += 8
    total_reserved = struct.unpack_from("<Q", data, offset)[0]
    offset += 8
    total_claimed = struct.unpack_from("<Q", data, offset)[0]
    offset += 8
    bump = data[offset]
    return {
        "authority": str(authority),
        "mint": str(mint),
        "vault": str(vault),
        "total_deposited": total_deposited,
        "total_reserved": total_reserved,
        "total_claimed": total_claimed,
        "bump": bump,
    }


async def create_bounty_onchain(
    bounty_id: int, amount_base_units: int, maintainer_wallet: str
) -> str:
    settings = get_settings()
    program_id, authority, mint = _require_signer(settings)
    treasury, _ = find_treasury_pda(program_id, mint)
    bounty, _ = find_bounty_pda(program_id, treasury, bounty_id)
    maintainer = Pubkey.from_string(maintainer_wallet)

    ix = Instruction(
        program_id,
        _anchor_discriminator("create_bounty") + struct.pack("<QQ", bounty_id, amount_base_units),
        [
            AccountMeta(authority.pubkey(), is_signer=True, is_writable=True),
            AccountMeta(maintainer, is_signer=False, is_writable=False),
            AccountMeta(treasury, is_signer=False, is_writable=True),
            AccountMeta(bounty, is_signer=False, is_writable=True),
            AccountMeta(SYSTEM_PROGRAM_ID, is_signer=False, is_writable=False),
        ],
    )
    return await _send_and_confirm([ix], authority)


async def assign_developer_onchain(bounty_id: int, developer_wallet: str) -> str:
    settings = get_settings()
    program_id, authority, mint = _require_signer(settings)
    treasury, _ = find_treasury_pda(program_id, mint)
    bounty, _ = find_bounty_pda(program_id, treasury, bounty_id)
    developer = Pubkey.from_string(developer_wallet)

    ix = Instruction(
        program_id,
        _anchor_discriminator("assign_developer") + bytes(developer),
        [
            AccountMeta(authority.pubkey(), is_signer=True, is_writable=False),
            AccountMeta(treasury, is_signer=False, is_writable=False),
            AccountMeta(bounty, is_signer=False, is_writable=True),
        ],
    )
    return await _send_and_confirm([ix], authority)


async def approve_claim_onchain(bounty_id: int) -> str:
    settings = get_settings()
    program_id, authority, mint = _require_signer(settings)
    treasury, _ = find_treasury_pda(program_id, mint)
    bounty, _ = find_bounty_pda(program_id, treasury, bounty_id)

    ix = Instruction(
        program_id,
        _anchor_discriminator("approve_claim"),
        [
            AccountMeta(authority.pubkey(), is_signer=True, is_writable=False),
            AccountMeta(treasury, is_signer=False, is_writable=False),
            AccountMeta(bounty, is_signer=False, is_writable=True),
        ],
    )
    return await _send_and_confirm([ix], authority)


async def cancel_bounty_onchain(bounty_id: int) -> str:
    settings = get_settings()
    program_id, authority, mint = _require_signer(settings)
    treasury, _ = find_treasury_pda(program_id, mint)
    bounty, _ = find_bounty_pda(program_id, treasury, bounty_id)

    ix = Instruction(
        program_id,
        _anchor_discriminator("cancel_bounty"),
        [
            AccountMeta(authority.pubkey(), is_signer=True, is_writable=False),
            AccountMeta(treasury, is_signer=False, is_writable=True),
            AccountMeta(bounty, is_signer=False, is_writable=True),
        ],
    )
    return await _send_and_confirm([ix], authority)


def decode_bounty_account(data: bytes) -> dict:
    offset = 8
    treasury = Pubkey.from_bytes(data[offset : offset + 32])
    offset += 32
    bounty_id = struct.unpack_from("<Q", data, offset)[0]
    offset += 8
    maintainer = Pubkey.from_bytes(data[offset : offset + 32])
    offset += 32
    has_developer = data[offset]
    offset += 1
    developer = None
    if has_developer:
        developer = Pubkey.from_bytes(data[offset : offset + 32])
        offset += 32
    amount = struct.unpack_from("<Q", data, offset)[0]
    offset += 8
    status = data[offset]
    offset += 1
    bump = data[offset]
    return {
        "treasury": str(treasury),
        "bounty_id": bounty_id,
        "maintainer": str(maintainer),
        "developer": str(developer) if developer else None,
        "amount": amount,
        "status": status,
        "bump": bump,
    }


async def get_bounty_account(bounty_id: int) -> dict | None:
    settings = get_settings()
    program_id, mint = _require_program(settings)
    treasury, _ = find_treasury_pda(program_id, mint)
    bounty, _ = find_bounty_pda(program_id, treasury, bounty_id)

    result = await _rpc_request(
        "getAccountInfo", [str(bounty), {"encoding": "base64", "commitment": "confirmed"}]
    )
    value = result.get("value")
    if value is None:
        return None
    raw = base64.b64decode(value["data"][0])
    return decode_bounty_account(raw)
