"""add_email_password_hash_to_tenants

Revision ID: 9f7e1a2b3c4d
Revises: ea525aa66ccc
Create Date: 2026-04-02 14:25:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9f7e1a2b3c4d"
down_revision: Union[str, Sequence[str], None] = "ea525aa66ccc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("tenants", sa.Column("password_hash", sa.String(length=255), nullable=True))
    op.create_index(op.f("ix_tenants_email"), "tenants", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_tenants_email"), table_name="tenants")
    op.drop_column("tenants", "password_hash")
    op.drop_column("tenants", "email")
