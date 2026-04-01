import json
import logging
from typing import Any, Dict, List
from ai.llm import gemini_manager

logger = logging.getLogger(__name__)

MAX_ROWS_DISPLAY = 15

def _to_markdown_table(rows: List[Dict[str, Any]], columns: List[str]) -> str:
    """Chuyển list[dict] thành markdown table."""
    if not rows:
        return "_Không có dữ liệu._"

    headers = columns
    # Truncate rows for display
    display_rows = rows[:MAX_ROWS_DISPLAY]
    
    header_row = "| " + " | ".join(headers) + " |"
    sep_row = "| " + " | ".join(["---"] * len(headers)) + " |"
    
    data_rows = []
    for row in display_rows:
        data_rows.append("| " + " | ".join(str(row.get(h, "")) for h in headers) + " |")

    table = "\n".join([header_row, sep_row] + data_rows)
    
    if len(rows) > MAX_ROWS_DISPLAY:
        table += f"\n\n_Hiển thị {MAX_ROWS_DISPLAY}/{len(rows)} dòng đầu tiên._"
        
    return table

async def format_sql_result(
    question: str,
    rows: List[Dict[str, Any]],
    columns: List[str],
    sql_executed: str,
    tenant_id: str
) -> Dict[str, Any]:
    """Định dạng kết quả SQL thành answer + table + metadata."""
    
    if not rows:
        return {
            "answer": "Không tìm thấy dữ liệu phù hợp với yêu cầu của bạn.",
            "table": "_Không có dữ liệu._",
            "sql": sql_executed,
            "row_count": 0
        }

    table_markdown = _to_markdown_table(rows, columns)
    
    # Generate natural language interpretation
    prompt = f"""
Bạn là trợ lý dữ liệu thông minh, trả lời ngắn gọn bằng tiếng Việt.
Dựa vào kết quả truy vấn SQL dưới đây, hãy diễn giải thành 1-3 câu ngắn gọn trả lời cho câu hỏi của người dùng.

[CÂU HỎI]
{question}

[KẾT QUẢ SQL ({len(rows)} dòng)]
{table_markdown}

[YÊU CẦU]
- Chỉ dùng thông tin có trong bảng kết quả.
- Trả lời trực tiếp, tự nhiên.
- Không lặp lại bảng dữ liệu.
"""

    try:
        model = gemini_manager.get_model()
        res = await model.generate_content_async(prompt)
        answer = res.text.strip()
    except Exception as e:
        logger.error(f"Error interpreting SQL result: {e}")
        answer = f"Đã tìm thấy {len(rows)} bản ghi phù hợp."

    return {
        "answer": answer,
        "table": table_markdown,
        "sql": sql_executed,
        "row_count": len(rows)
    }
