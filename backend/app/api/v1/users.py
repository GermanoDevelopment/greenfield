from fastapi import APIRouter
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import NotFoundError
from app.db.base import UserModel
from app.schemas.user import UserOut, UserPublicOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.patch("/me", response_model=UserOut)
async def update_me(current_user: CurrentUser, data: UserUpdate, db: DbSession) -> UserModel:
    current_user.wallet = data.wallet
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/me", response_model=UserOut)
async def get_me(current_user: CurrentUser) -> UserModel:
    return current_user


@router.get("/{user_id}", response_model=UserPublicOut)
async def get_user(user_id: int, db: DbSession) -> UserModel:
    user = await db.get(UserModel, user_id)
    if user is None:
        raise NotFoundError("User")
    return user


@router.get("/", response_model=list[UserPublicOut])
async def list_users(db: DbSession, limit: int = 50, offset: int = 0) -> list[UserModel]:
    result = await db.execute(select(UserModel).limit(min(limit, 100)).offset(offset))
    return list(result.scalars().all())
