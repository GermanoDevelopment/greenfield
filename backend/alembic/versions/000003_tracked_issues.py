"""tracked issues from github webhooks and sync

Revision ID: 000003
Revises: 000002
Create Date: 2026-09-09
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "000003"
down_revision: str | None = "000002"
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
        "tracked_issues",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "repository_id",
            sa.Integer(),
            sa.ForeignKey("repositories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("issue_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("html_url", sa.String(length=512), nullable=False),
        sa.Column("author_username", sa.String(length=255), nullable=True),
        sa.Column("labels", sa.String(length=1024), nullable=True),
        sa.Column("state", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("has_bounty", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "bounty_id",
            sa.Integer(),
            sa.ForeignKey("bounties.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.UniqueConstraint("repository_id", "issue_number", name="uq_repo_issue_number"),
        *_timestamps(),
    )
    op.create_index("ix_tracked_issues_project_id", "tracked_issues", ["project_id"])
    op.create_index("ix_tracked_issues_repository_id", "tracked_issues", ["repository_id"])
    op.create_index("ix_tracked_issues_issue_number", "tracked_issues", ["issue_number"])
    op.create_index("ix_tracked_issues_state", "tracked_issues", ["state"])
    op.create_index("ix_tracked_issues_has_bounty", "tracked_issues", ["has_bounty"])
    op.create_index("ix_tracked_issues_bounty_id", "tracked_issues", ["bounty_id"])


def downgrade() -> None:
    op.drop_table("tracked_issues")
