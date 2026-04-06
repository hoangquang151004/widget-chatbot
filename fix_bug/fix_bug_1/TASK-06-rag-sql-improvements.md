# TASK-06 — RAG & SQL Pipeline Improvements

**Ưu tiên**: 🟢 Normal (sau MVP)  
**Ước tính**: 4–6 giờ  
**Phụ thuộc**: TASK-05 hoàn thành, project đang chạy ổn định

---

## Bối cảnh

Pipeline hiện tại hoạt động đúng nhưng còn một số điểm có thể cải thiện để tăng chất lượng câu trả lời.

---

## Subtask 6.1 — History-Aware RAG Query

### Vấn đề hiện tại
```python
# apps/api/ai/rag_agent.py
async def arun(self, query: str, ...) -> AgentResponse:
    # Query gửi thẳng vào Qdrant, không dùng conversation history
    search_results = await vector_store.search(query, limit=5)
```

Nếu user hỏi "Còn điều khoản nào nữa không?" sau khi đã hỏi về hợp đồng, widget không biết "điều khoản" của cái gì.

### Fix: Reformulate query bằng history

```python
# apps/api/ai/rag_agent.py
async def arun(self, query: str, context: dict = None) -> AgentResponse:
    history = context.get("history", []) if context else []
    
    # Nếu có history và query ngắn/mơ hồ → reformulate
    reformulated_query = query
    if history and self._is_ambiguous(query):
        reformulated_query = await self._reformulate(query, history)
    
    search_results = await vector_store.search(reformulated_query, limit=5)
    # ... rest of logic

def _is_ambiguous(self, query: str) -> bool:
    """Query có đại từ không rõ ràng không?"""
    ambiguous_tokens = ["đó", "này", "nó", "cái đó", "điều này", "vấn đề đó"]
    return any(t in query.lower() for t in ambiguous_tokens) or len(query.split()) < 4

async def _reformulate(self, query: str, history: list) -> str:
    """Dùng Gemini để reformulate query dựa trên history."""
    recent = history[-3:]  # 3 turns gần nhất
    history_text = "\n".join([f"{m['role']}: {m['content']}" for m in recent])
    
    prompt = f"""Dựa trên lịch sử hội thoại sau, hãy viết lại câu hỏi cuối cùng 
thành dạng đầy đủ, không cần ngữ cảnh.

Lịch sử:
{history_text}

Câu hỏi cần viết lại: {query}

Chỉ trả về câu đã viết lại, không giải thích."""
    
    model = gemini_manager.get_model()
    result = await model.generate_content_async(prompt)
    return result.text.strip() or query
```

Cũng cần pass `history` từ orchestrator sang rag_agent:
```python
# apps/api/ai/orchestrator.py — rag_node
async def rag_node(state: AgentState) -> Dict[str, Any]:
    agent = RAGAgent(state["tenant_id"])
    response = await agent.arun(
        state["query"],
        context={"history": state.get("history", [])}  # pass history
    )
```

---

## Subtask 6.2 — SQL Schema Cache Invalidation

### Vấn đề hiện tại
```python
# apps/api/ai/sql_agent.py
_schema_cache: Dict[str, Dict[str, Any]] = {}

async def _get_db_schema(self) -> str:
    if self.tenant_id in self._schema_cache:
        cache_data = self._schema_cache[self.tenant_id]
        if time.time() - cache_data["timestamp"] < 3600:  # 1 hour cache
            return cache_data["schema"]
```

Khi tenant thay đổi DB config → cache cũ vẫn dùng schema cũ trong 1 giờ.

### Fix: Invalidate cache khi save DB config

```python
# apps/api/api/v1/admin.py — endpoint save_db_config
@router.post("/database")
async def save_db_config(config: DBConfigSchema, request: Request):
    # ... existing save logic ...
    
    # Invalidate SQL schema cache
    from ai.sql_agent import SQLAgent
    if request.state.tenant_id in SQLAgent._schema_cache:
        del SQLAgent._schema_cache[str(request.state.tenant_id)]
    
    return {"message": "Cấu hình database đã được lưu thành công."}
```

---

## Subtask 6.3 — Embedding Model Dimension Fix

### Vấn đề
```python
# apps/api/ai/vector_store.py
vectors_config={
    "gemini-dense": VectorParams(
        size=3072,  # ← SAI! Gemini text-embedding-004 là 768d
        distance=Distance.COSINE
    )
}
```

Gemini `models/text-embedding-004` tạo ra vector 768 chiều, không phải 3072.

### Fix
```python
# Nếu collection đã tạo với size=3072 → cần recreate
# Nếu chưa có data → chỉ sửa constant

# apps/api/ai/vector_store.py
vectors_config={
    "gemini-dense": VectorParams(
        size=768,  # Gemini text-embedding-004: 768d
        distance=Distance.COSINE
    )
}
```

**Lưu ý**: Nếu collection đã có data với size=3072 (được tạo bởi OpenAI text-embedding-3-small), cần:
1. Xóa collection cũ hoặc tạo collection mới
2. Re-ingest tất cả documents

```bash
# Kiểm tra collection hiện tại trong Qdrant
curl http://localhost:6333/collections/chatbot_documents
```

---

## Subtask 6.4 — Parent Document Retriever (V2)

> Tính năng này cho V2, không cần thiết cho MVP.

Hiện tại: chunk 1000 tokens, retrieve top 5 chunks.

Cải thiện: Chunk nhỏ (200 tokens) để tìm kiếm chính xác hơn, nhưng trả về parent chunk (1000 tokens) để có đủ ngữ cảnh.

Xem tài liệu `ai-engine/rag/` để tham khảo cách implement.

---

## Subtask 6.5 — Cải thiện SQL Sanitizer

```python
# apps/api/ai/sql_agent.py — _sanitize_sql()
# Hiện tại: kiểm tra tất cả tokens trong toàn bộ câu
# Vấn đề: có thể false positive với "DROP" trong column name

def _sanitize_sql(self, sql: str) -> str:
    # Tốt hơn: chỉ kiểm tra statements ở đầu câu
    import sqlparse
    parsed = sqlparse.parse(sql.strip())[0]
    stmt_type = parsed.get_type()
    
    if stmt_type != 'SELECT':
        raise ValueError(f"Only SELECT is allowed, got: {stmt_type}")
    
    # Add LIMIT nếu chưa có
    if 'LIMIT' not in sql.upper():
        sql = sql.rstrip().rstrip(';') + ' LIMIT 100;'
    
    return sql
```

Cài thêm: `pip install sqlparse`

---

## Checklist hoàn thành

- [ ] Kiểm tra embedding dimension: Gemini `text-embedding-004` → verify đúng 768d
- [ ] Fix vector size trong `vector_store.py` nếu sai
- [ ] History-aware RAG: reformulate ambiguous queries
- [ ] SQL schema cache invalidation khi đổi DB config
- [ ] Test: hỏi câu mơ hồ sau conversation → RAG vẫn trả đúng
- [ ] Test: đổi DB config → chat lại → schema mới được dùng
- [ ] Cập nhật `PROGRESS.md`
