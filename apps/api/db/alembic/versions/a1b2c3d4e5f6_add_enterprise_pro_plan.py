"""add enterprise_pro to tenants.plan check constraint

Revision ID: a1b2c3d4e5f6
Revises: f2a4d1c7b9e0
Create Date: 2026-04-03

"""
from typing import Sequence, Union

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f2a4d1c7b9e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("ck_tenants_plan", "tenants", type_="check")
    op.create_check_constraint(
        "ck_tenants_plan",
        "tenants",
        "plan IN ('starter', 'pro', 'enterprise', 'enterprise_pro')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_tenants_plan", "tenants", type_="check")
    op.create_check_constraint(
        "ck_tenants_plan",
        "tenants",
        "plan IN ('starter', 'pro', 'enterprise')",
    )
    op.execute(
        "UPDATE tenants SET plan = 'enterprise' WHERE plan = 'enterprise_pro'"
    )
