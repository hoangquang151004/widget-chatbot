import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from ai.sql_agent import SQLAgent
from ai.base_agent import AgentResponse

# Mock data
MOCK_TENANT_ID = "1"
MOCK_SCHEMA = "Table: employees\nColumns: id (INTEGER), name (VARCHAR), salary (INTEGER)"

@pytest.mark.asyncio
async def test_sql_agent_generation_and_security():
    agent = SQLAgent(MOCK_TENANT_ID)
    
    # 1. Mock Schema Retrieval
    with patch.object(SQLAgent, "_get_db_schema", new_callable=AsyncMock) as mock_schema:
        mock_schema.return_value = MOCK_SCHEMA
        
        # 2. Mock Gemini SQL Generation (SELECT case)
        mock_gen_res = MagicMock()
        mock_gen_res.text = '{"sql": "SELECT name FROM employees WHERE salary > 50000", "explanation": "Truy vấn nhân viên lương cao"}'
        
        # 3. Mock Gemini Final Response
        mock_final_res = MagicMock()
        mock_final_res.text = "Danh sách các nhân viên có mức lương trên 50,000 bao gồm:..."
        
        with patch("ai.llm.gemini_manager.get_model") as mock_model_func:
            mock_model = MagicMock()
            mock_model.generate_content_async = AsyncMock(side_effect=[mock_gen_res, mock_final_res])
            mock_model_func.return_value = mock_model
            
            # 4. Mock SQL Execution
            with patch("db.tenant_db.engine_manager.get_session", new_callable=AsyncMock) as mock_session_func:
                mock_session = AsyncMock()
                mock_session.__aenter__.return_value = mock_session
                
                mock_result = MagicMock()
                mock_result.keys.return_value = ["name"]
                mock_result.fetchall.return_value = [("Alice",), ("Bob",)]
                mock_session.execute.return_value = mock_result
                mock_session_func.return_value = mock_session
                
                # EXECUTE
                response = await agent.arun("Ai có lương trên 50k?")
                
                # ASSERT
                assert "Alice" in response.content or "..." in response.content
                assert response.metadata["row_count"] == 2
                assert "LIMIT 100" in response.metadata["sql"]

@pytest.mark.asyncio
async def test_sql_agent_dangerous_query_block():
    agent = SQLAgent(MOCK_TENANT_ID)
    
    # Mock dangerous SQL generation
    mock_gen_res = MagicMock()
    mock_gen_res.text = '{"sql": "DROP TABLE employees", "explanation": "Xóa bảng"}'
    
    with patch.object(SQLAgent, "_get_db_schema", new_callable=AsyncMock) as mock_schema:
        mock_schema.return_value = MOCK_SCHEMA
        with patch("ai.llm.gemini_manager.get_model") as mock_model_func:
            mock_model = MagicMock()
            mock_model.generate_content_async = AsyncMock(return_value=mock_gen_res)
            mock_model_func.return_value = mock_model
            
            # EXECUTE
            response = await agent.arun("Xóa bảng nhân viên cho tôi")
            
            # ASSERT: Should return error message instead of executing
            assert "Dangerous keyword" in response.content
