import logging
import time
import sqlparse
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlparse.tokens import DDL, DML, Keyword
from db.tenant_db import engine_manager
from ai.sql.generator import generate_sql

logger = logging.getLogger(__name__)

FORBIDDEN_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", 
    "TRUNCATE", "EXEC", "EXECUTE", "MERGE", "REPLACE", 
    "CALL", "GRANT", "REVOKE", "LOAD", "COPY"
}

def _validate_sql(sql: str):
    """Kiểm tra SQL an toàn."""
    raw = (sql or "").strip()
    parsed = sqlparse.parse(raw)
    if not parsed:
        raise ValueError("SQL rỗng hoặc không hợp lệ.")

    for stmt in parsed:
        # Check for forbidden keywords
        for token in stmt.flatten():
            if token.ttype in (DDL, DML, Keyword):
                upper = token.normalized.upper()
                if upper in FORBIDDEN_KEYWORDS:
                    raise ValueError(f"Câu lệnh bị cấm: [{upper}]")

        # Check statement type
        stmt_type = stmt.get_type()
        if stmt_type and stmt_type.upper() != "SELECT":
            raise ValueError(f"Chỉ cho phép SELECT. Phát hiện: {stmt_type}")

    if ";" in raw.rstrip(";"):
        raise ValueError("Không cho phép nhiều câu lệnh trong một request.")

async def execute_sql(
    tenant_id: str,
    question: str,
    sql: str,
    schema: Dict[str, Any],
    user_role: str = "employee",
    user_id: str = "",
    department_id: str = "",
    max_retries: int = 5
) -> Dict[str, Any]:
    """Thực thi SQL với vòng lặp tự sửa lỗi."""
    current_sql = sql.strip()
    last_error = ""

    for attempt in range(max_retries + 1):
        try:
            # 1. Validate
            _validate_sql(current_sql)
            
            # 2. Execute
            session = await engine_manager.get_session(tenant_id)
            if not session:
                return {"status": "ERROR", "message": "Không thể kết nối Database tenant."}

            async with session:
                # Set timeout 10s cho statement
                await session.execute(text("SET LOCAL statement_timeout = 10000"))
                result = await session.execute(text(current_sql))
                
                columns = list(result.keys())
                rows = [dict(zip(columns, row)) for row in result.fetchall()]
                
                logger.info(f"SQL Success | tenant={tenant_id} | attempt={attempt} | rows={len(rows)}")
                return {
                    "status": "SUCCESS",
                    "rows": rows,
                    "columns": columns,
                    "sql_executed": current_sql,
                    "attempt": attempt
                }

        except Exception as e:
            last_error = str(e)
            logger.warning(f"SQL Failed | tenant={tenant_id} | attempt={attempt} | error={last_error}")
            
            if attempt >= max_retries:
                break
            
            # 3. Self-correction: Generate lại SQL với context lỗi
            gen_result = await generate_sql(
                question=question,
                schema=schema,
                user_role=user_role,
                user_id=user_id,
                department_id=department_id,
                previous_sql=current_sql,
                error_message=last_error
            )
            
            if gen_result.get("status") == "SUCCESS":
                current_sql = gen_result["sql"]
            else:
                # Nếu không generate lại được thì dừng luôn
                return gen_result

    return {
        "status": "ERROR",
        "message": f"Không thể thực thi SQL sau {max_retries} lần thử.",
        "last_error": last_error,
        "sql_attempted": current_sql
    }
