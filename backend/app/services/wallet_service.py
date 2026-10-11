import secrets
import time
from typing import Any

from solders.pubkey import Pubkey
from solders.signature import Signature
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, ValidationError
from app.db.base import BountyModel

CHALLENGE_TTL_SECONDS = 600  # 10 minutos


class WalletChallengeManager:
    """Gerenciador em memória para desafios (challenge/response) de posse de carteira."""

    def __init__(self) -> None:
        self._challenges: dict[str, dict[str, Any]] = {}

    def create_challenge(self, user_id: int) -> dict[str, Any]:
        """Gera um novo nonce e mensagem signable para o usuário autenticado."""
        self._cleanup()
        nonce = secrets.token_hex(16)
        now = time.time()
        expires_at = now + CHALLENGE_TTL_SECONDS
        message = (
            f"Sign this message to prove ownership of your Solana wallet on Greenfield:\n"
            f"Nonce: {nonce}"
        )
        self._challenges[nonce] = {
            "user_id": user_id,
            "message": message,
            "expires_at": expires_at,
            "consumed": False,
        }
        return {
            "nonce": nonce,
            "message": message,
            "expires_at": int(expires_at),
        }

    def verify_challenge(self, user_id: int, wallet: str, nonce: str, signature: str) -> None:
        """Valida a assinatura para a mensagem do nonce e previne replay e expiração."""
        self._cleanup()
        challenge = self._challenges.get(nonce)
        if not challenge or challenge["user_id"] != user_id:
            raise ValidationError("Invalid or unknown wallet verification challenge nonce.")

        if challenge["consumed"]:
            raise ValidationError("Challenge nonce has already been used (replayed challenge).")

        if time.time() > challenge["expires_at"]:
            raise ValidationError("Challenge nonce has expired.")

        try:
            pubkey = Pubkey.from_string(wallet)
            sig = Signature.from_string(signature)
            is_valid = sig.verify(pubkey, challenge["message"].encode("utf-8"))
        except Exception as e:
            raise ValidationError(f"Invalid wallet address or signature format: {e}") from e

        if not is_valid:
            raise ValidationError(
                "Signature does not match the wallet public key and nonce message."
            )

        # Marca como consumido para prevenir replay
        challenge["consumed"] = True

    def _cleanup(self) -> None:
        now = time.time()
        expired_keys = [k for k, v in self._challenges.items() if v["expires_at"] < now - 3600]
        for k in expired_keys:
            self._challenges.pop(k, None)

    def clear(self) -> None:
        """Limpa todo o estado (útil para fixtures de teste)."""
        self._challenges.clear()


wallet_challenge_manager = WalletChallengeManager()


async def assert_can_update_wallet(
    db: AsyncSession, user_id: int, current_wallet: str | None, new_wallet: str
) -> None:
    """Verifica se o usuário possui bounties ativas que impeçam a alteração de carteira."""
    if current_wallet and current_wallet == new_wallet:
        return

    stmt = select(BountyModel).where(
        BountyModel.hunter_id == user_id,
        BountyModel.status.in_(["ASSIGNED", "SUBMITTED", "COMPLETED"]),
    )
    result = await db.execute(stmt)
    active_bounty = result.scalars().first()
    if active_bounty is not None:
        raise ForbiddenError(
            f"Cannot change wallet while assigned to an active or claimable bounty "
            f"(Bounty #{active_bounty.id} is {active_bounty.status})."
        )
