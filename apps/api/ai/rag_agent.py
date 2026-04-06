from typing import Any, Dict, List, Optional

from ai.base_agent import BaseAgent, AgentResponse
from ai.llm import gemini_manager
from ai.vector_store import SaaSVectorStore

DEFAULT_RAG_BASE = "Bạn là một trợ lý AI hữu ích."


class RAGAgent(BaseAgent):
    """
    Agent chuyên xử lý truy vấn tài liệu với tính năng cách ly tenant.
    """

    async def arun(
        self, query: str, context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        vector_store = SaaSVectorStore(self.tenant_id)
        history = context.get("history", []) if context else []
        custom_system = (context or {}).get("system_prompt")
        use_custom_flag = bool(
            (context or {}).get("use_custom_system_prompt", False)
        )
        base_prompt = (custom_system or "").strip() or DEFAULT_RAG_BASE

        search_query = query
        if history and self._is_ambiguous(query):
            search_query = await self._reformulate(query, history)

        search_results = await vector_store.search(search_query, limit=5)

        if not search_results:
            return AgentResponse(
                content="Tôi xin lỗi, tôi không tìm thấy thông tin liên quan trong tài liệu của bạn.",
                metadata={"source_found": False, "reformulated_query": search_query},
            )

        context_text = "\n\n".join(
            [
                f"--- Tài liệu {i+1} ---\n{res['text']}"
                for i, res in enumerate(search_results)
            ]
        )

        system_prompt = f"""{base_prompt}

NHIỆM VỤ: Hãy trả lời câu hỏi của người dùng dựa TRÊN DUY NHẤT các tài liệu được cung cấp dưới đây.
Nếu thông tin không có trong tài liệu, hãy nói rằng bạn không biết, đừng tự bịa ra câu trả lời.

TÀI LIỆU CỦA TENANT {self.tenant_id}:
{context_text}"""

        model = gemini_manager.get_model(system_instruction=system_prompt)
        response = await model.generate_content_async(query)

        return AgentResponse(
            content=response.text,
            metadata={
                "tenant_id": self.tenant_id,
                "source_count": len(search_results),
                "reformulated_query": search_query if search_query != query else None,
                "used_custom_prompt": use_custom_flag,
            },
            citations=[
                {
                    "text": res["text"],
                    "score": res["score"],
                    "metadata": res["metadata"],
                }
                for res in search_results
            ],
        )

    def _is_ambiguous(self, query: str) -> bool:
        ambiguous_tokens = [
            "đó",
            "này",
            "nó",
            "cái đó",
            "điều này",
            "vấn đề đó",
            "ở đâu",
            "khi nào",
        ]
        query_lower = query.lower()
        return any(t in query_lower for t in ambiguous_tokens) or len(query.split()) < 4

    async def _reformulate(self, query: str, history: list) -> str:
        recent = history[-3:] if isinstance(history, list) else []
        history_text = "\n".join(
            [f"{m.get('role', 'user')}: {m.get('content', '')}" for m in recent]
        )

        prompt = f"""Dựa trên lịch sử hội thoại sau, hãy viết lại câu hỏi cuối cùng của người dùng thành một câu hỏi độc lập, đầy đủ ngữ cảnh để có thể tìm kiếm trong tài liệu.

LỊCH SỬ:
{history_text}

CÂU HỎI HIỆN TẠI: {query}

Chỉ trả về câu hỏi đã viết lại, không giải thích gì thêm."""

        try:
            model = gemini_manager.get_model()
            result = await model.generate_content_async(prompt)
            return result.text.strip() or query
        except Exception:
            return query
