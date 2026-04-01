import sys
import sqlparse
from sqlparse.tokens import DDL, DML, Keyword

FORBIDDEN_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", 
    "TRUNCATE", "EXEC", "EXECUTE", "MERGE", "REPLACE", 
    "CALL", "GRANT", "REVOKE", "LOAD", "COPY"
}

def validate_sql(sql: str):
    """Kiểm tra SQL an toàn tương tự như logic của AI Engine."""
    raw = (sql or "").strip()
    if not raw:
        return False, "SQL rỗng."

    parsed = sqlparse.parse(raw)
    if not parsed:
        return False, "SQL không thể parse."

    for stmt in parsed:
        # Check statement type
        stmt_type = stmt.get_type()
        if stmt_type and stmt_type.upper() != "SELECT":
            return False, f"Chỉ cho phép SELECT. Phát hiện: {stmt_type}"

        # Check for forbidden keywords
        for token in stmt.flatten():
            if token.ttype in (DDL, DML, Keyword):
                upper = token.normalized.upper()
                if upper in FORBIDDEN_KEYWORDS:
                    return False, f"Câu lệnh chứa từ khóa bị cấm: [{upper}]"

    if ";" in raw.rstrip(";"):
        return False, "Không cho phép nhiều câu lệnh (phát hiện dấu ;)."

    return True, "SQL hợp lệ và an toàn."

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Sử dụng: python validate_sql.py \"CÂU_SQL\"")
        sys.exit(1)

    sql_input = sys.argv[1]
    is_valid, message = validate_sql(sql_input)
    
    if is_valid:
        print(f"✅ {message}")
        sys.exit(0)
    else:
        print(f"❌ {message}")
        sys.exit(1)
