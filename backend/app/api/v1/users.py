from fastapi import APIRouter
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import NotFoundError
from app.db.base import UserModel
from app.schemas.user import UserOut, UserPublicOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.patch(
    "/me",
    response_model=UserOut,
    summary="Atualizar carteira Solana do usuário",
)
async def update_me(current_user: CurrentUser, data: UserUpdate, db: DbSession) -> UserModel:
    """
    Vincula ou altera o endereço público da carteira Solana (base58)
    do usuário logado para recebimento de recompensas.
    """
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
