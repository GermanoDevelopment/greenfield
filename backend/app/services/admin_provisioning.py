import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ValidationError
from app.core.security import hash_password
from app.db.base import UserModel

logger = logging.getLogger("greenfield.admin_provisioning")

MIN_PASSWORD_LENGTH = 12


async def provision_admin(
    db: AsyncSession,
    email: str,
    username: str | None = None,
    password: str | None = None,
) -> UserModel:
    """Cria um admin de e-mail/senha ou promove um usuário existente.

    Único caminho para um papel ADMIN fora do OAuth (`ADMIN_GITHUB_USERNAMES`);
    chamado apenas pelo operador via `python -m app.cli create-admin`.
    """
    norm_email = email.strip().lower()
    if "@" not in norm_email:
        raise ValidationError("email must be a valid address")
    if password is not None and len(password) < MIN_PASSWORD_LENGTH:
        raise ValidationError(f"password must have at least {MIN_PASSWORD_LENGTH} characters")

    result = await db.execute(select(UserModel).where(func.lower(UserModel.email) == norm_email))
    user = result.scalar_one_or_none()

    if user is None:
        if not username or not username.strip():
            raise ValidationError("username is required to create a new admin")
        if password is None:
            raise ValidationError("password is required to create a new admin")
        norm_username = username.strip()
        taken = await db.execute(
            select(UserModel).where(func.lower(UserModel.username) == norm_username.lower())
        )
        if taken.scalar_one_or_none() is not None:
            raise ConflictError("Este nome de usuário já está em uso")
        user = UserModel(
            email=norm_email,
            username=norm_username,
            password_hash=hash_password(password),
            role="ADMIN",
            avatar_url=f"https://avatar.vercel.sh/{norm_username}",
        )
        db.add(user)
        logger.info("Admin criado: %s", norm_email)
    else:
        user.role = "ADMIN"
        if password is not None:
            user.password_hash = hash_password(password)
        logger.info("Usuário promovido a admin: %s", norm_email)

    await db.commit()
    await db.refresh(user)
    return user
