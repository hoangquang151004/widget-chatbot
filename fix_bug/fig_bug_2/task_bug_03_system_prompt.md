# task_bug_03 — BUG-AI-03: System Prompt Hardcoded, không đọc từ DB

**Ưu tiên**: 🔴 Critical  
**File cần sửa**: `apps/api/ai/orchestrator.py`, `apps/api/ai/rag_agent.py`  
**Thời gian ước tính**: 30–45 phút  
**Phụ thuộc**: BUG-AI-01 (task_bug_01) nên làm trước vì đã thêm `settings_loader_node`

---

## Mô tả bug

`ai_settings.system_prompt` là trường mà tenant cấu hình trong dashboard. Nhưng hiện tại:

**1. `orchestrator.py` → `general_node`** dùng prompt hardcoded:

```python
# HIỆN TẠI — hardcoded
system_prompt = f"""
Bạn là một trợ lý AI thân thiện. Hãy trò chuyện với người dùng.
LỊCH SỬ TRÒ CHUYỆN:
{history_context}
"""
```

**2. `rag_agent.py`** cũng dùng prompt hardcoded:

```python
# HIỆN TẠI — hardcoded
system_prompt = f"""
Bạn là một trợ lý AI hữu ích. Hãy trả lời câu hỏi của người dùng dựa TRÊN DUY NHẤT các tài liệu...
"""
```

**Hậu quả**: Mọi tenant đều có cùng 1 tính cách bot. Không thể customize bot thành "Chuyên gia bảo hiểm", "Nhân viên hỗ trợ kỹ thuật", v.v. qua dashboard.

---

## Giải pháp

### Phương án: Truyền `system_prompt` qua `AgentState`

Sau khi BUG-AI-01 đã fix, `settings_loader_node` đã load `TenantAiSettings`. Chỉ cần thêm `system_prompt` vào state và truyền xuống các node.

---

## Thay đổi trong `orchestrator.py`

### Bước 1: Thêm `system_prompt` vào `AgentState`

```python
class AgentState(TypedDict):
    query: str
    tenant_id: str
    session_id: str
    history: List[Dict[str, str]]
    intent: Optional[Literal["RAG", "SQL", "GENERAL"]]
    response: Optional[AgentResponse]
    is_rag_enabled: bool     # đã có từ bug_01
    is_sql_enabled: bool     # đã có từ bug_01
    system_prompt: str       # ← MỚI
```

### Bước 2: Cập nhật `settings_loader_node` để cũng load `system_prompt`

> Nếu đã làm bug_01, chỉ cần thêm `system_prompt` vào return value:

```python
async def settings_loader_node(state: AgentState) -> Dict[str, Any]:
    """Load TenantAiSettings từ DB."""
    tenant_id = state["tenant_id"]
    
    DEFAULT_PROMPT = "Bạn là một trợ lý AI thân thiện và hữu ích."
    
    try:
        tenant_uuid = UUID(str(tenant_id))
        async with async_session() as session:
            result = await session.execute(
                select(TenantAiSettings).filter(
                    TenantAiSettings.tenant_id == tenant_uuid
                )
            )
            ai_settings = result.scalars().first()
        
        if ai_settings:
            return {
                "is_rag_enabled": bool(ai_settings.is_rag_enabled),
                "is_sql_enabled": bool(ai_settings.is_sql_enabled),
                "system_prompt": ai_settings.system_prompt or DEFAULT_PROMPT,  # ← MỚI
            }
    except Exception as e:
        logger.warning("settings_loader_node failed for tenant %s: %s", tenant_id, str(e))
    
    return {
        "is_rag_enabled": True,
        "is_sql_enabled": False,
        "system_prompt": DEFAULT_PROMPT,  # ← MỚI
    }
```

### Bước 3: Cập nhật `general_node` để dùng `system_prompt` từ state

```python
async def general_node(state: AgentState) -> Dict[str, Any]:
    try:
        history = state["history"] if "history" in state else []
        history_context = "\n".join([f"{m['role']}: {m['content']}" for m in history[-5:]])
        
        # Lấy custom system_prompt từ state (đã được load từ DB)
        tenant_system_prompt = state.get("system_prompt", "Bạn là một trợ lý AI thân thiện.")
        
        full_system_prompt = f"""{tenant_system_prompt}

LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY:
{history_context}"""
        
        model = gemini_manager.get_model(system_instruction=full_system_prompt)
        res = await model.generate_content_async(state["query"])
        return {
            "response": AgentResponse(
                content=res.text,
                metadata={"node": "general", "used_custom_prompt": True}
            )
        }
    except Exception as e:
        return {"response": AgentResponse(content="Xin lỗi, tôi gặp sự cố kỹ thuật.", metadata={"error": True})}
```

### Bước 4: Cập nhật `rag_node` để pass `system_prompt` xuống RAGAgent

```python
async def rag_node(state: AgentState) -> Dict[str, Any]:
    try:
        agent = RAGAgent(state["tenant_id"])
        response = await agent.arun(
            state["query"],
            context={
                "history": state["history"] if "history" in state else [],
                "system_prompt": state.get("system_prompt"),   # ← MỚI
            }
        )
        
        # MOCK COMPONENT for demo
        if "sản phẩm" in state["query"].lower():
            response.component = {
                "type": "product_grid",
                "data": [
                    { "id": "p1", "name": "Premium Plan", "price": "1.5Mđ", "image_url": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200" },
                    { "id": "p2", "name": "Enterprise Suite", "price": "5.0Mđ", "image_url": "https://images.unsplash.com/photo-1558655146-d09347e92766?w=200" }
                ]
            }
        
        return {"response": response}
    except Exception as e:
        logger.error(f"RAG Node error: {str(e)}")
        return {"response": AgentResponse(content=f"Lỗi khi truy vấn tài liệu: {str(e)}", metadata={"error": True})}
```

---

## Thay đổi trong `rag_agent.py`

### Cập nhật method `arun()` để nhận và dùng `system_prompt`

```python
async def arun(self, query: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
    vector_store = SaaSVectorStore(self.tenant_id)
    history = context.get("history", []) if context else []
    
    # Lấy custom system prompt từ context (được truyền từ orchestrator)
    custom_system_prompt = (context or {}).get("system_prompt")
    
    # 1. Reformulate query nếu cần
    search_query = query
    if history and self._is_ambiguous(query):
        search_query = await self._reformulate(query, history)

    # 2. Retrieval
    search_results = await vector_store.search(search_query, limit=5)

    if not search_results:
        return AgentResponse(
            content="Tôi xin lỗi, tôi không tìm thấy thông tin liên quan trong tài liệu của bạn.",
            metadata={"source_found": False, "reformulated_query": search_query}
        )

    # 3. Construct prompt với context
    context_text = "\n\n".join([
        f"--- Tài liệu {i+1} ---\n{res['text']}" 
        for i, res in enumerate(search_results)
    ])
    
    # Dùng custom system prompt nếu có, không thì dùng default
    base_prompt = custom_system_prompt or "Bạn là một trợ lý AI hữu ích."
    
    system_prompt = f"""{base_prompt}

NHIỆM VỤ: Hãy trả lời câu hỏi của người dùng dựa TRÊN DUY NHẤT các tài liệu được cung cấp dưới đây.
Nếu thông tin không có trong tài liệu, hãy nói rằng bạn không biết, đừng tự bịa ra câu trả lời.

TÀI LIỆU CỦA TENANT {self.tenant_id}:
{context_text}"""

    # 4. Generation
    model = gemini_manager.get_model(system_instruction=system_prompt)
    response = await model.generate_content_async(query)

    return AgentResponse(
        content=response.text,
        metadata={
            "tenant_id": self.tenant_id,
            "source_count": len(search_results),
            "reformulated_query": search_query if search_query != query else None,
            "used_custom_prompt": custom_system_prompt is not None,
        },
        citations=[{
            "text": res["text"],
            "score": res["score"],
            "metadata": res["metadata"]
        } for res in search_results]
    )
```

---

## Kiểm tra sau khi sửa

### Test 1: System prompt custom hoạt động trong general chat

```bash
# 1. Set custom system prompt
curl -X PATCH http://localhost:8001/api/v1/admin/ai-settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"system_prompt": "Bạn là chuyên gia bảo hiểm nhân thọ tại Việt Nam. Hãy tư vấn khách hàng về các sản phẩm bảo hiểm một cách chuyên nghiệp và thân thiện."}'

# 2. Gửi câu hỏi general
curl -X POST http://localhost:8001/api/v1/chat/stream \
  -H "X-Widget-Key: $PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "tôi nên mua bảo hiểm loại nào?", "session_id": "test-bug03"}'

# ✅ Expect: Response có phong cách của chuyên gia bảo hiểm
# ❌ Trước khi fix: Response chung chung "Xin chào! Tôi là trợ lý AI thân thiện..."
```

### Test 2: System prompt ảnh hưởng đến RAG response

```bash
# Với cùng system prompt "chuyên gia bảo hiểm", gửi câu hỏi về tài liệu đã upload
curl -X POST http://localhost:8001/api/v1/chat/stream \
  -H "X-Widget-Key: $PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "điều khoản loại trừ là gì?", "session_id": "test-bug03-rag"}'

# ✅ Expect: Response trả lời với phong cách chuyên gia bảo hiểm + thông tin từ tài liệu
```

### Test 3: Kiểm tra metadata trong response

```bash
# Dùng endpoint POST /chat (không stream) để xem đầy đủ response JSON
curl -X POST http://localhost:8001/api/v1/chat \
  -H "X-Widget-Key: $PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "xin chào", "session_id": "test-bug03-meta"}'

# ✅ Expect: metadata có "used_custom_prompt": true
```

### Test 4: Fallback khi system_prompt rỗng

```bash
# Set system prompt về rỗng
curl -X PATCH http://localhost:8001/api/v1/admin/ai-settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"system_prompt": ""}'

# Gửi câu hỏi
curl -X POST http://localhost:8001/api/v1/chat/stream \
  -H "X-Widget-Key: $PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "xin chào", "session_id": "test-bug03-empty"}'

# ✅ Expect: Vẫn trả lời được (dùng default prompt), không crash
```

---

## Checklist hoàn thành

### `orchestrator.py`
- [ ] Thêm `system_prompt: str` vào `AgentState`
- [ ] Cập nhật `settings_loader_node` → trả về `system_prompt` từ DB
- [ ] Cập nhật `general_node` → dùng `state.get("system_prompt")` thay vì hardcode
- [ ] Cập nhật `rag_node` → pass `system_prompt` vào context khi gọi `agent.arun()`

### `rag_agent.py`
- [ ] Cập nhật `arun()` → nhận `system_prompt` từ `context`
- [ ] Xây dựng `system_prompt` cho Gemini bằng cách ghép `base_prompt + RAG instructions`
- [ ] Thêm `"used_custom_prompt"` vào metadata của AgentResponse

### Testing
- [ ] Test 1: Custom prompt hiện ra trong general response ✓
- [ ] Test 2: Custom prompt ảnh hưởng RAG response ✓
- [ ] Test 3: metadata `used_custom_prompt: true` ✓
- [ ] Test 4: Fallback với prompt rỗng không crash ✓

### Cập nhật
- [ ] Cập nhật `PROGRESS.md`: BUG-AI-03 → ✅ FIXED
