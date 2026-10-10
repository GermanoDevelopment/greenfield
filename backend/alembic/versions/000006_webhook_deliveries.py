"""webhook deliveries, for idempotency by X-GitHub-Delivery

Revision ID: 000006
Revises: 000005
Create Date: 2026-10-10
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "000006"
down_revision: str | None = "000005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "webhook_deliveries",
        sa.Column("delivery_id", sa.String(64), primary_key=True),
        sa.Column("event", sa.String(64), nullable=True),
        sa.Column(
            "received_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("webhook_deliveries")
