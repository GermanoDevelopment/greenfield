"""revoke the former default admin seed accounts still using admin123

Revision ID: 000005
Revises: 000004
Create Date: 2026-10-10

The backend used to create four ADMIN accounts with the password `admin123` on
every boot. That seed is gone; this migration neutralizes the rows it left
behind, but only while the password is still the default: the account is
demoted to CONTRIBUTOR and its password login is disabled. Accounts whose
password was changed are left alone. Re-provision admins with
`python -m app.cli create-admin`.
"""

import hashlib
import hmac
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "000005"
down_revision: str | None = "000004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SEED_EMAILS = (
    "germano@greenfield.com",
    "dione@greenfield.com",
    "kaue@greenfield.com",
    "pedro@greenfield.com",
)
DEFAULT_PASSWORD = "admin123"


def _is_default_password(password_hash: str | None) -> bool:
    # Mirrors app.core.security.hash_password at the time of the seed.
    if not password_hash or "$" not in password_hash:
        return False
    try:
        salt, key_hex = password_hash.split("$", 1)
        key = hashlib.pbkdf2_hmac("sha256", DEFAULT_PASSWORD.encode(), bytes.fromhex(salt), 100_000)
    except ValueError:
        return False
    return hmac.compare_digest(key.hex(), key_hex)


def upgrade() -> None:
    conn = op.get_bind()
    users = sa.table(
        "users",
        sa.column("id", sa.Integer),
        sa.column("email", sa.String),
        sa.column("role", sa.String),
        sa.column("password_hash", sa.String),
    )
    rows = conn.execute(
        sa.select(users.c.id, users.c.password_hash).where(
            sa.func.lower(users.c.email).in_(SEED_EMAILS)
        )
    ).all()
    for row in rows:
        if _is_default_password(row.password_hash):
            conn.execute(
                users.update()
                .where(users.c.id == row.id)
                .values(role="CONTRIBUTOR", password_hash=None)
            )


def downgrade() -> None:
    # Restoring a known default password would reopen the hole; nothing to undo.
    pass
