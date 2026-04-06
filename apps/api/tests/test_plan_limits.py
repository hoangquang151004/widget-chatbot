"""Unit tests — core.plan_limits"""

from core.plan_limits import get_limits, normalize_plan, plan_allows_sql


class TestNormalizePlan:
    def test_unknown_fallback_starter(self):
        assert normalize_plan(None) == "starter"
        assert normalize_plan("  ") == "starter"
        assert normalize_plan("nope") == "starter"

    def test_known_plans(self):
        assert normalize_plan("STARTER") == "starter"
        assert normalize_plan("Pro") == "pro"
        assert normalize_plan("enterprise") == "enterprise"
        assert normalize_plan("enterprise_pro") == "enterprise_pro"


class TestPlanAllowsSql:
    def test_starter_no_sql(self):
        assert plan_allows_sql("starter") is False

    def test_pro_has_sql(self):
        assert plan_allows_sql("pro") is True


class TestGetLimits:
    def test_starter_caps(self):
        lim = get_limits("starter")
        assert lim.ai_messages_cap == 50
        assert lim.ai_messages_window == "month"
        assert lim.max_documents == 2
        assert lim.max_sql_connections == 0

    def test_pro_caps(self):
        lim = get_limits("pro")
        assert lim.ai_messages_cap == 400
        assert lim.ai_messages_window == "day"
        assert lim.max_sql_connections == 2

    def test_enterprise_pro_storage(self):
        lim = get_limits("enterprise_pro")
        assert lim.rag_storage_bytes == 2 * 1024 * 1024 * 1024
