"""multi repo, bounty applicants, admin role, points and issue metadata

Revision ID: 000002
Revises: 000001
Create Date: 2026-09-07
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "000002"
down_revision: str | None = "000001"
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
    # 1. users: role
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=32), nullable=False, server_default="CONTRIBUTOR"),
    )
    op.create_index("ix_users_role", "users", ["role"])

    # 2. repositories table
    op.create_table(
        "repositories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("github_owner", sa.String(length=255), nullable=False),
        sa.Column("github_name", sa.String(length=255), nullable=False),
        sa.Column("github_repo", sa.String(length=255), nullable=False),
        sa.Column("github_repo_id", sa.BigInteger(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("default_branch", sa.String(length=64), nullable=False, server_default="main"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        *_timestamps(),
    )
    op.create_index("ix_repositories_project_id", "repositories", ["project_id"])
    op.create_index("ix_repositories_github_repo", "repositories", ["github_repo"])

    # 3. bounty_applicants table
    op.create_table(
        "bounty_applicants",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "bounty_id",
            sa.Integer(),
            sa.ForeignKey("bounties.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="PENDING"),
        sa.Column("proposal", sa.String(length=2048), nullable=True),
        *_timestamps(),
        sa.UniqueConstraint("bounty_id", "user_id", name="uq_bounty_applicant"),
    )
    op.create_index("ix_bounty_applicants_bounty_id", "bounty_applicants", ["bounty_id"])
    op.create_index("ix_bounty_applicants_user_id", "bounty_applicants", ["user_id"])
    op.create_index("ix_bounty_applicants_status", "bounty_applicants", ["status"])

    # 4. bounties: repository_id, issue_number, issue_title, issue_body,
    # points, tx_signature, claimed_at
    op.add_column(
        "bounties",
        sa.Column(
            "repository_id",
            sa.Integer(),
            sa.ForeignKey("repositories.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_bounties_repository_id", "bounties", ["repository_id"])
    op.add_column("bounties", sa.Column("issue_number", sa.Integer(), nullable=True))
    op.add_column("bounties", sa.Column("issue_title", sa.String(length=512), nullable=True))
    op.add_column("bounties", sa.Column("issue_body", sa.Text(), nullable=True))
    op.add_column(
        "bounties",
        sa.Column("points", sa.Integer(), nullable=False, server_default="100"),
    )
    op.add_column("bounties", sa.Column("tx_signature", sa.String(length=128), nullable=True))
    op.add_column("bounties", sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("bounties", "claimed_at")
    op.drop_column("bounties", "tx_signature")
    op.drop_column("bounties", "points")
    op.drop_column("bounties", "issue_body")
    op.drop_column("bounties", "issue_title")
    op.drop_column("bounties", "issue_number")
    op.drop_index("ix_bounties_repository_id", table_name="bounties")
    op.drop_column("bounties", "repository_id")

    op.drop_table("bounty_applicants")
    op.drop_table("repositories")

    op.drop_index("ix_users_role", table_name="users")
    op.drop_column("users", "role")
