"""initial schema: users, projects, bounties

Revision ID: 000001
Revises:
Create Date: 2026-09-03
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "000001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _timestamps():
    return [
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("github_id", sa.BigInteger(), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("avatar_url", sa.String(length=512), nullable=True),
        sa.Column("wallet", sa.String(length=44), nullable=True),
        *_timestamps(),
    )
    op.create_index("ix_users_github_id", "users", ["github_id"], unique=True)

    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "owner_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("github_repo", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        *_timestamps(),
    )
    op.create_index("ix_projects_owner_id", "projects", ["owner_id"])

    op.create_table(
        "bounties",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "issuer_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "hunter_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("issue_url", sa.String(length=512), nullable=False),
        sa.Column("pr_url", sa.String(length=512), nullable=True),
        sa.Column("amount_usdc", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="OPEN"),
        sa.Column("escrow_pda", sa.String(length=44), nullable=True),
        *_timestamps(),
    )
    op.create_index("ix_bounties_project_id", "bounties", ["project_id"])
    op.create_index("ix_bounties_issuer_id", "bounties", ["issuer_id"])
    op.create_index("ix_bounties_hunter_id", "bounties", ["hunter_id"])
    op.create_index("ix_bounties_status", "bounties", ["status"])


def downgrade() -> None:
    op.drop_table("bounties")
    op.drop_table("projects")
    op.drop_index("ix_users_github_id", table_name="users")
    op.drop_table("users")
