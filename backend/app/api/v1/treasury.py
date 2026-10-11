from fastapi import APIRouter
from pydantic import BaseModel

from app.core.exceptions import DomainError
from app.services import solana_service

router = APIRouter(prefix="/treasury", tags=["treasury"])


class TreasuryBalanceResponse(BaseModel):
    total_deposited: int
    total_reserved: int
    total_claimed: int
    available: int
    total_deposited_usdc: float
    total_reserved_usdc: float
    total_claimed_usdc: float
    available_usdc: float
    vault: str | None = None
    mint: str | None = None
    authority: str | None = None


@router.get("/balance", response_model=TreasuryBalanceResponse)
@router.get("", response_model=TreasuryBalanceResponse)
async def get_treasury_balance():
    """Return on-chain treasury metrics: deposited, reserved, claimed, and available USDC."""
    account = await solana_service.get_treasury_account()
    if account is None:
        raise DomainError(status_code=503, detail="Unable to read treasury state from chain")

    total_dep = account["total_deposited"]
    total_res = account["total_reserved"]
    total_clm = account["total_claimed"]
    avail = max(0, total_dep - total_res)

    return TreasuryBalanceResponse(
        total_deposited=total_dep,
        total_reserved=total_res,
        total_claimed=total_clm,
        available=avail,
        total_deposited_usdc=total_dep / 10**solana_service.USDC_DECIMALS,
        total_reserved_usdc=total_res / 10**solana_service.USDC_DECIMALS,
        total_claimed_usdc=total_clm / 10**solana_service.USDC_DECIMALS,
        available_usdc=avail / 10**solana_service.USDC_DECIMALS,
        vault=account.get("vault"),
        mint=account.get("mint"),
        authority=account.get("authority"),
    )
