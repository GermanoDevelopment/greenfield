"""Comandos de operador.

    uv run python -m app.cli create-admin --email ops@example.com --username ops

A senha é lida de GREENFIELD_ADMIN_PASSWORD ou pedida no terminal. Para um
usuário que já existe, o comando apenas promove a ADMIN (a senha é opcional).
"""

import argparse
import asyncio
import getpass
import os
import sys

from app.core.exceptions import DomainError


async def _create_admin(args: argparse.Namespace) -> int:
    from sqlalchemy import func, select

    from app.db.base import UserModel
    from app.db.session import async_session_factory
    from app.services.admin_provisioning import provision_admin

    async with async_session_factory() as session:
        exists = await session.execute(
            select(UserModel.id).where(func.lower(UserModel.email) == args.email.strip().lower())
        )
        password = os.environ.get("GREENFIELD_ADMIN_PASSWORD")
        if password is None and exists.scalar_one_or_none() is None:
            password = getpass.getpass("Senha do novo admin: ")
            if password != getpass.getpass("Confirme a senha: "):
                print("As senhas não conferem.", file=sys.stderr)
                return 1
        try:
            user = await provision_admin(session, args.email, args.username, password)
        except DomainError as e:
            print(f"Erro: {e.detail}", file=sys.stderr)
            return 1
    print(f"Admin pronto: {user.email} (id {user.id})")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    sub = parser.add_subparsers(dest="command", required=True)
    create = sub.add_parser("create-admin", help="Cria um admin ou promove um usuário existente")
    create.add_argument("--email", required=True)
    create.add_argument("--username", help="Obrigatório ao criar um novo usuário")
    args = parser.parse_args(argv)

    if args.command == "create-admin":
        return asyncio.run(_create_admin(args))
    return 1


if __name__ == "__main__":
    sys.exit(main())
