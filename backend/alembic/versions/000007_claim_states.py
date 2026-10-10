"""claim states: COMPLETED split into CLAIMABLE / CLAIMED, plus claim_error

Revision ID: 000007
Revises: 000006
Create Date: 2026-10-10

COMPLETED used to mean "merge verified" whether or not the payment happened.
Rows with a recorded transaction become CLAIMED; the rest become CLAIMABLE.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "000007"
down_revision: str | None = "000006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("bounties", sa.Column("claim_error", sa.String(512), nullable=True))
    op.execute(
        "UPDATE bounties SET status = 'CLAIMED' "
        "WHERE status = 'COMPLETED' AND tx_signature IS NOT NULL"
    )
    op.execute("UPDATE bounties SET status = 'CLAIMABLE' WHERE status = 'COMPLETED'")


def downgrade() -> None:
    op.execute(
        "UPDATE bounties SET status = 'COMPLETED' WHERE status IN ('CLAIMABLE', 'CLAIM_FAILED')"
    )
    op.drop_column("bounties", "claim_error")
