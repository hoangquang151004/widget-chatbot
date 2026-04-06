"""Unit tests — SQL route guard (plan + flag + tenant_databases)."""

import pytest

from ai.orchestrator import resolve_sql_route_state


@pytest.mark.parametrize(
    "plan_key,flag,has_db,expect_ok,expect_reason",
    [
        ("starter", True, True, False, "plan"),
        ("pro", False, True, False, "feature_disabled"),
        ("pro", True, False, False, "no_database_config"),
        ("pro", True, True, True, None),
        ("enterprise", True, True, True, None),
    ],
)
def test_resolve_sql_route_state(plan_key, flag, has_db, expect_ok, expect_reason):
    ok, reason = resolve_sql_route_state(plan_key, flag, has_db)
    assert ok is expect_ok
    assert reason == expect_reason
