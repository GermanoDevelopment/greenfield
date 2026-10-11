"""payment state machine: CLAIMABLE, CLAIMED, CLAIM_FAILED, and failure_reason

Revision ID: 000007
Revises: 000006
Create Date: 2026-10-11
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "000007"
down_revision: str | None = "000006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Add failure_reason column to bounties
    op.add_column(
        "bounties",
        sa.Column("failure_reason", sa.String(512), nullable=True),
    )

    # 2. Upgrade existing rows:
    # - COMPLETED bounties with tx_signature (or claimed_at) become CLAIMED
    op.execute(
        sa.text(
            "UPDATE bounties SET status = 'CLAIMED' "
            "WHERE status = 'COMPLETED' AND (tx_signature IS NOT NULL OR claimed_at IS NOT NULL)"
        )
    )
    # - COMPLETED bounties without tx_signature become CLAIMABLE
    op.execute(
        sa.text(
            "UPDATE bounties SET status = 'CLAIMABLE' "
            "WHERE status = 'COMPLETED' AND tx_signature IS NULL AND claimed_at IS NULL"
        )
    )


def downgrade() -> None:
    # Revert CLAIMABLE and CLAIM_FAILED back to COMPLETED for backwards compatibility
    op.execute(
        sa.text(
            "UPDATE bounties SET status = 'COMPLETED' WHERE status IN ('CLAIMABLE', 'CLAIM_FAILED')"
        )
    )
    op.drop_column("bounties", "failure_reason")
