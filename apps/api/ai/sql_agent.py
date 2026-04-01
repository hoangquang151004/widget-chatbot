import logging
import json
from typing import Any, Dict, Optional
from ai.base_agent import BaseAgent, AgentResponse
from ai.sql import run_text_to_sql

logger = logging.getLogger(__name__)

class SQLAgent(BaseAgent):
    """
    Agent for querying tenant's relational database.
    Now using the upgraded production-ready Text-to-SQL pipeline.
    """

    async def arun(self, query: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Thực hiện truy vấn SQL dựa trên câu hỏi của người dùng.
        """
        try:
            # 1. Thu thập thông tin phân quyền từ context (nếu có)
            user_id = ""
            department_id = ""
            user_role = "employee"
            
            if context:
                user_id = context.get("user_id", "")
                department_id = context.get("department_id", "")
                user_role = context.get("user_role", "employee")

            # 2. Chạy pipeline Text-to-SQL
            result = await run_text_to_sql(
                tenant_id=self.tenant_id,
                question=query,
                user_role=user_role,
                user_id=user_id,
                department_id=department_id
            )

            # 3. Xử lý kết quả trả về
            if result["status"] == "SUCCESS":
                # Trả về câu trả lời tự nhiên kèm bảng markdown trong content
                content = f"{result['answer']}\n\n{result['table']}"
                
                return AgentResponse(
                    content=content,
                    metadata={
                        "sql": result.get("sql"),
                        "row_count": result.get("row_count"),
                        "tenant_id": self.tenant_id,
                        "agent_type": "sql"
                    }
                )
            
            elif result["status"] == "CLARIFY":
                # LLM cần hỏi thêm thông tin
                return AgentResponse(
                    content=result["message"],
                    metadata={"status": "clarify"}
                )
            
            else:
                # Có lỗi xảy ra trong quá trình sinh hoặc thực thi SQL
                error_msg = result.get("message", "Đã có lỗi xảy ra khi truy vấn dữ liệu.")
                logger.error(f"SQLAgent Pipeline Error | tenant={self.tenant_id} | error={error_msg}")
                return AgentResponse(content=f"⚠️ {error_msg}")

        except Exception as e:
            logger.error(f"SQLAgent Error | tenant={self.tenant_id} | error={str(e)}")
            return AgentResponse(content=f"❌ Đã có lỗi xảy ra khi truy vấn dữ liệu: {str(e)}")
