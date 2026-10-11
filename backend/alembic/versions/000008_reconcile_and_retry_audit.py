"""reconcile and retry audit: retry_count, last_retry_at and bounty_audit_logs table

Revision ID: 000008
Revises: 000007
Create Date: 2026-10-11
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "000008"
down_revision: str | None = "000007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "bounties", sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0")
    )
    op.add_column(
        "bounties", sa.Column("last_retry_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.create_table(
        "bounty_audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "bounty_id",
            sa.Integer(),
            sa.ForeignKey("bounties.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "actor_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column("action", sa.String(length=64), nullable=False, index=True),
        sa.Column("status_before", sa.String(length=32), nullable=True),
        sa.Column("status_after", sa.String(length=32), nullable=True),
        sa.Column("detail", sa.String(length=1024), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_table("bounty_audit_logs")
    op.drop_column("bounties", "last_retry_at")
    op.drop_column("bounties", "retry_count")
