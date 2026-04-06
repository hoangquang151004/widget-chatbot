import pytest
from unittest.mock import AsyncMock, patch

from ai.sql_agent import SQLAgent


@pytest.mark.asyncio
async def test_sql_agent_success_pipeline():
    agent = SQLAgent("11111111-1111-1111-1111-111111111111")
    with patch("ai.sql_agent.run_text_to_sql", new_callable=AsyncMock) as mock_run:
        mock_run.return_value = {
            "status": "SUCCESS",
            "answer": "Kết quả truy vấn.",
            "table": "| name |\n| Alice |",
            "sql": "SELECT name FROM employees WHERE salary > 50000 LIMIT 100",
            "row_count": 1,
        }
        response = await agent.arun("Ai có lương trên 50k?")
        assert "Alice" in response.content
        assert response.metadata.get("row_count") == 1
        assert "LIMIT 100" in (response.metadata.get("sql") or "").upper()


@pytest.mark.asyncio
async def test_sql_agent_error_from_pipeline():
    agent = SQLAgent("11111111-1111-1111-1111-111111111111")
    with patch("ai.sql_agent.run_text_to_sql", new_callable=AsyncMock) as mock_run:
        mock_run.return_value = {
            "status": "ERROR",
            "message": "Câu lệnh bị cấm: [DROP]",
        }
        response = await agent.arun("Xóa bảng nhân viên cho tôi")
        assert "Câu lệnh bị cấm" in response.content or "DROP" in response.content
