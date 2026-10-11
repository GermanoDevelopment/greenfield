"""payout lease: payout_lease_until on bounties

Revision ID: 000008
Revises: 000007
Create Date: 2026-10-11

Whoever starts a payout takes a short lease on the bounty; see
bounty_service.reserve_payout. NULL means nobody is paying it.
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
        "bounties", sa.Column("payout_lease_until", sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("bounties", "payout_lease_until")
