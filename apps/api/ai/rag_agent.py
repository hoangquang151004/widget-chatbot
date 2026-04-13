import re
import time
from typing import Any, Dict, List, Optional, Tuple

from ai.base_agent import BaseAgent, AgentResponse
from ai.llm import gemini_manager
from ai.vector_store import SaaSVectorStore

DEFAULT_RAG_BASE = "Bạn là một trợ lý AI hữu ích."
HISTORY_WINDOW_TURNS = 8
HISTORY_CHAR_BUDGET = 1200


def _estimate_tokens(text: str) -> int:
    return max(1, len(text or "") // 4)


class RAGAgent(BaseAgent):
    """
    Agent chuyên xử lý truy vấn tài liệu với tính năng cách ly tenant.
    """

    async def arun(
        self, query: str, context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        started_at = time.perf_counter()
        vector_store = SaaSVectorStore(self.tenant_id)
        history = context.get("history", []) if context else []
        custom_system = (context or {}).get("system_prompt")
        use_custom_flag = bool(
            (context or {}).get("use_custom_system_prompt", False)
        )
        base_prompt = (custom_system or "").strip() or DEFAULT_RAG_BASE
        history_context, history_chars = self._build_history_context(
            history, HISTORY_WINDOW_TURNS, HISTORY_CHAR_BUDGET
        )
        locale = self._detect_locale(query, history)

        search_query = query
        if history and self._is_ambiguous(query):
            search_query = await self._reformulate(query, history)
        else:
            search_query = self._augment_query_with_recent_context(query, history_context)

        retrieval_started = time.perf_counter()
        search_results = await vector_store.search(search_query, limit=5)
        retrieval_latency_ms = int((time.perf_counter() - retrieval_started) * 1000)

        if not search_results:
            return AgentResponse(
                content="Tôi xin lỗi, tôi không tìm thấy thông tin liên quan trong tài liệu của bạn.",
                metadata={
                    "source_found": False,
                    "reformulated_query": search_query,
                    "history_turns_used": min(len(history), HISTORY_WINDOW_TURNS),
                    "history_chars_used": history_chars,
                    "retrieval_latency_ms": retrieval_latency_ms,
                    "locale": locale,
                },
            )

        context_text = "\n\n".join(
            [
                f"--- Tài liệu {i+1} ---\n{res['text']}"
                for i, res in enumerate(search_results)
            ]
        )

        system_prompt = f"""{base_prompt}

LANGUAGE POLICY:
- Ưu tiên trả lời bằng ngôn ngữ người dùng đang dùng trong hội thoại.
- Locale nhận diện hiện tại: {locale}.

NHIỆM VỤ: Hãy trả lời câu hỏi của người dùng dựa TRÊN DUY NHẤT các tài liệu được cung cấp dưới đây.
Nếu thông tin không có trong tài liệu, hãy nói rằng bạn không biết, đừng tự bịa ra câu trả lời.

TÀI LIỆU CỦA TENANT {self.tenant_id}:
{context_text}"""

        model = gemini_manager.get_model(system_instruction=system_prompt)
        response = await model.generate_content_async(query)
        total_latency_ms = int((time.perf_counter() - started_at) * 1000)

        return AgentResponse(
            content=response.text,
            metadata={
                "tenant_id": self.tenant_id,
                "source_count": len(search_results),
                "reformulated_query": search_query if search_query != query else None,
                "used_custom_prompt": use_custom_flag,
                "history_turns_used": min(len(history), HISTORY_WINDOW_TURNS),
                "history_chars_used": history_chars,
                "retrieval_latency_ms": retrieval_latency_ms,
                "total_latency_ms": total_latency_ms,
                "prompt_token_estimate": _estimate_tokens(system_prompt + "\n" + query),
                "response_token_estimate": _estimate_tokens(response.text or ""),
                "locale": locale,
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

    def _build_history_context(
        self, history: List[Dict[str, str]], max_turns: int, char_budget: int
    ) -> Tuple[str, int]:
        if not history:
            return "", 0
        selected = history[-max_turns:]
        out: List[str] = []
        used = 0
        for item in reversed(selected):
            role = str(item.get("role", "user"))
            content = str(item.get("content", "")).strip()
            if not content:
                continue
            chunk = f"{role}: {content}"
            if used + len(chunk) > char_budget:
                remain = max(0, char_budget - used)
                if remain <= 20:
                    break
                chunk = chunk[:remain]
                out.append(chunk)
                used += len(chunk)
                break
            out.append(chunk)
            used += len(chunk)
        out.reverse()
        joined = "\n".join(out)
        if len(joined) > char_budget:
            joined = joined[:char_budget]
        return joined, min(used, len(joined))

    def _augment_query_with_recent_context(self, query: str, history_context: str) -> str:
        if not history_context:
            return query
        # POC: thêm ngữ cảnh gần để retrieval có trọng số theo hội thoại hiện tại.
        recent = history_context.split("\n")[-2:]
        suffix = " | ".join(s for s in recent if s)
        if not suffix:
            return query
        return f"{query}\nNgữ cảnh gần: {suffix}"

    def _detect_locale(self, query: str, history: List[Dict[str, str]]) -> str:
        corpus = " ".join(
            [query]
            + [str(m.get("content", "")) for m in (history[-4:] if history else [])]
        )
        # Nếu có dấu tiếng Việt thì chọn vi, ngược lại mặc định en cho câu hỏi latin.
        if re.search(r"[ăâđêôơưáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]", corpus.lower()):
            return "vi"
        if re.search(r"[a-zA-Z]", corpus):
            return "en"
        return "vi"

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
