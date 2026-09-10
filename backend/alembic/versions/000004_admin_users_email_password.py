"""admin users, email, password_hash and nullable github_id

Revision ID: 000004
Revises: 000003
Create Date: 2026-09-10
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "000004"
down_revision: str | None = "000003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Add email and password_hash to users
    op.add_column("users", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=True))
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 2. Make github_id nullable for email/password users
    op.alter_column("users", "github_id", existing_type=sa.BigInteger(), nullable=True)


def downgrade() -> None:
    op.alter_column("users", "github_id", existing_type=sa.BigInteger(), nullable=False)
    op.drop_index("ix_users_email", table_name="users")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "email")
