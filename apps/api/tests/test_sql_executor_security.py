import pytest

from ai.sql.executor import _validate_sql


SCHEMA = {
    "tables": {
        "orders": {"columns": [{"name": "id"}, {"name": "total"}]},
        "customers": {"columns": [{"name": "id"}, {"name": "name"}]},
    }
}


def test_validate_sql_blocks_write_statement():
    with pytest.raises(ValueError, match="cấm|SELECT"):
        _validate_sql("DELETE FROM orders WHERE id = 1", SCHEMA)


def test_validate_sql_blocks_multiple_statements():
    with pytest.raises(ValueError, match="nhiều câu lệnh"):
        _validate_sql("SELECT 1; SELECT 2", SCHEMA)


def test_validate_sql_blocks_unknown_table():
    with pytest.raises(ValueError, match="không có trong schema"):
        _validate_sql("SELECT * FROM salaries", SCHEMA)


def test_validate_sql_blocks_system_schema():
    with pytest.raises(ValueError, match="system schema"):
        _validate_sql("SELECT table_name FROM information_schema.tables", SCHEMA)


def test_validate_sql_appends_default_limit_when_missing():
    validated = _validate_sql("SELECT id, total FROM orders", SCHEMA)
    assert validated.upper().endswith("LIMIT 100")


def test_validate_sql_keeps_existing_limit():
    validated = _validate_sql("SELECT id FROM orders LIMIT 5", SCHEMA)
    assert validated.upper().endswith("LIMIT 5")
