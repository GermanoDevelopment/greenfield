import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.base import UserModel

logger = logging.getLogger("greenfield.admin_seed")

DEFAULT_ADMINS = [
    {
        "email": "germano@greenfield.com",
        "username": "germano",
        "avatar_url": "https://github.com/GermanoDevelopment.png",
        "password": "admin123",
    },
    {
        "email": "dione@greenfield.com",
        "username": "dione",
        "avatar_url": "https://avatar.vercel.sh/dione",
        "password": "admin123",
    },
    {
        "email": "kaue@greenfield.com",
        "username": "kaue",
        "avatar_url": "https://avatar.vercel.sh/kaue",
        "password": "admin123",
    },
    {
        "email": "pedro@greenfield.com",
        "username": "pedro",
        "avatar_url": "https://avatar.vercel.sh/pedro",
        "password": "admin123",
    },
]


async def seed_default_admins(db: AsyncSession) -> list[UserModel]:
    """
    Garante o cadastro e papel ADMIN dos administradores fundamentais
    germano@greenfield.com, dione@greenfield.com, kaue@greenfield.com e pedro@greenfield.com
    com a senha padrao 'admin123'.
    """
    seeded_users: list[UserModel] = []

    for admin in DEFAULT_ADMINS:
        norm_email = admin["email"].strip().lower()
        stmt = select(UserModel).where(func.lower(UserModel.email) == norm_email)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if user is None:
            user = UserModel(
                email=norm_email,
                username=admin["username"],
                password_hash=hash_password(admin["password"]),
                role="ADMIN",
                avatar_url=admin["avatar_url"],
            )
            db.add(user)
            logger.info("Admin registrado no seed: %s", norm_email)
        else:
            # Garante que possui papel ADMIN e hash de senha
            user.role = "ADMIN"
            if not user.password_hash:
                user.password_hash = hash_password(admin["password"])
            logger.info("Admin existente atualizado no seed: %s", norm_email)

        seeded_users.append(user)

    await db.commit()
    for u in seeded_users:
        await db.refresh(u)

    return seeded_users
