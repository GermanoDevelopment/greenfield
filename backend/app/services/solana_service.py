import base58
import httpx

from app.core.config import get_settings


class SolanaServiceError(Exception):
    pass


USDC_DECIMALS = 6


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
    """Check whether the escrow account holds at least the expected USDC amount.

    Returns None when the on-chain state cannot be verified (RPC down, not funded yet).
    """
    if not validate_wallet_address(escrow_pda):
        return None
    balance = await get_token_balance(escrow_pda)
    if balance is None:
        return None
    return balance >= expected_amount_usdc
