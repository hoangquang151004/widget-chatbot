"""add tenants.role for platform_admin vs tenant

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-03

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column(
            "role",
            sa.String(length=32),
            nullable=False,
            server_default="tenant",
        ),
    )
    op.create_check_constraint(
        "ck_tenants_role",
        "tenants",
        "role IN ('tenant', 'platform_admin')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_tenants_role", "tenants", type_="check")
    op.drop_column("tenants", "role")
