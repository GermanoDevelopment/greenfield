from typing import Any

from fastapi import APIRouter
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import NotFoundError, ValidationError
from app.db.base import UserModel
from app.schemas.user import (
    UserOut,
    UserPublicOut,
    UserUpdate,
    WalletChallengeOut,
    WalletVerifyRequest,
)
from app.services.wallet_service import assert_can_update_wallet, wallet_challenge_manager

router = APIRouter(prefix="/users", tags=["users"])


@router.post(
    "/me/wallet/challenge",
    response_model=WalletChallengeOut,
    summary="Gerar desafio (nonce) para prova de posse de carteira Solana",
)
async def create_wallet_challenge(current_user: CurrentUser) -> dict[str, Any]:
    """Emite um nonce e mensagem a ser assinada pela carteira Solana do usuário."""
    return wallet_challenge_manager.create_challenge(current_user.id)


@router.post(
    "/me/wallet/verify",
    response_model=UserOut,
    summary="Verificar assinatura e vincular carteira Solana",
)
async def verify_and_link_wallet(
    current_user: CurrentUser, data: WalletVerifyRequest, db: DbSession
) -> UserModel:
    """Valida a assinatura criptográfica do desafio e vincula a carteira Solana ao usuário."""
    await assert_can_update_wallet(db, current_user.id, current_user.wallet, data.wallet)
    wallet_challenge_manager.verify_challenge(
        user_id=current_user.id,
        wallet=data.wallet,
        nonce=data.nonce,
        signature=data.signature,
    )
    current_user.wallet = data.wallet
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.patch(
    "/me",
    response_model=UserOut,
    summary="Atualizar carteira Solana do usuário",
)
async def update_me(current_user: CurrentUser, data: UserUpdate, db: DbSession) -> UserModel:
    """
    Vincula ou altera o endereço público da carteira Solana (base58)
    do usuário logado após verificação de prova de posse (desafio e assinatura).
    """
    await assert_can_update_wallet(db, current_user.id, current_user.wallet, data.wallet)
    if not data.nonce or not data.signature:
        raise ValidationError(
            "Wallet update requires cryptographic proof of ownership. "
            "Provide valid nonce and signature, or call /users/me/wallet/challenge."
        )
    wallet_challenge_manager.verify_challenge(
        user_id=current_user.id,
        wallet=data.wallet,
        nonce=data.nonce,
        signature=data.signature,
    )
    current_user.wallet = data.wallet
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get(
    "/me",
    response_model=UserOut,
    summary="Consultar dados do usuário atual",
)
async def get_me(current_user: CurrentUser) -> UserModel:
    """Retorna as informações de perfil, role e carteira Solana do usuário autenticado."""
    return current_user


@router.get(
    "/{user_id}",
    response_model=UserPublicOut,
    summary="Consultar perfil público de usuário",
)
async def get_user(user_id: int, db: DbSession) -> UserModel:
    """Retorna as informações públicas de um usuário pelo seu identificador único."""
    user = await db.get(UserModel, user_id)
    if user is None:
        raise NotFoundError("User")
    return user


@router.get(
    "",
    response_model=list[UserPublicOut],
    summary="Listar usuários públicos",
)
async def list_users(db: DbSession, limit: int = 50, offset: int = 0) -> list[UserModel]:
    """Lista usuários cadastrados na plataforma com paginação básica."""
    result = await db.execute(select(UserModel).limit(min(limit, 100)).offset(offset))
    return list(result.scalars().all())
