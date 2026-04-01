from ai.sql.schema_loader import get_schema, refresh_schema
from ai.sql.generator import generate_sql
from ai.sql.executor import execute_sql
from ai.sql.formatter import format_sql_result

async def run_text_to_sql(
    tenant_id: str,
    question: str,
    user_role: str = "employee",
    user_id: str = "",
    department_id: str = ""
):
    """
    Pipeline đầy đủ: get_schema -> generate -> execute -> format.
    """
    # 1. Get Schema
    schema = await get_schema(tenant_id)
    if "error" in schema:
        return {"status": "ERROR", "message": schema["error"]}

    # 2. Generate SQL
    gen_res = await generate_sql(
        question=question,
        schema=schema,
        user_role=user_role,
        user_id=user_id,
        department_id=department_id
    )
    
    if gen_res["status"] != "SUCCESS":
        return gen_res

    # 3. Execute SQL (includes self-correction)
    exec_res = await execute_sql(
        tenant_id=tenant_id,
        question=question,
        sql=gen_res["sql"],
        schema=schema,
        user_role=user_role,
        user_id=user_id,
        department_id=department_id
    )

    if exec_res["status"] != "SUCCESS":
        return exec_res

    # 4. Format Result
    final_res = await format_sql_result(
        question=question,
        rows=exec_res["rows"],
        columns=exec_res["columns"],
        sql_executed=exec_res["sql_executed"],
        tenant_id=tenant_id
    )

    return {
        "status": "SUCCESS",
        **final_res
    }

__all__ = [
    "run_text_to_sql",
    "get_schema",
    "refresh_schema",
    "generate_sql",
    "execute_sql",
    "format_sql_result"
]
