# TASK-03 — SSE Streaming End-to-End

**Ưu tiên**: 🟡 Medium  
**Ước tính**: 2–3 giờ  
**Phụ thuộc**: TASK-02 hoàn thành

---

## Bối cảnh

Backend có 2 chat endpoints:
1. `POST /api/v1/chat` — Full response qua LangGraph orchestrator
2. `GET /api/v1/chat/stream?query=...&session_id=...` — SSE streaming (Gemini direct)

**Vấn đề hiện tại**: Endpoint `/chat/stream` stream trực tiếp từ Gemini (không qua LangGraph), nên bỏ qua intent routing (RAG/SQL/General). Cần quyết định kiến trúc.

---

## Subtask 3.1 — Kiểm tra `/chat/stream` hiện tại

**File**: `apps/api/api/v1/chat.py` — hàm `chat_stream_endpoint`

Hiện tại luồng là:
```
GET /chat/stream → Redis memory load → Gemini stream directly → save memory
```

**Thiếu**: Intent routing (RAG/SQL không được gọi).

---

## Subtask 3.2 — Quyết định kiến trúc streaming

Có 2 lựa chọn:

### Option A (Đơn giản hơn — Recommend cho MVP)
Giữ nguyên `/chat/stream` chỉ dùng Gemini cho câu trả lời general, không routing.
Dùng `POST /chat` (full response) cho RAG/SQL (thường chậm hơn nhưng chính xác hơn).

Widget logic:
- Nếu user hỏi → gọi `POST /chat` trước để classify intent
- Nếu intent = GENERAL → switch sang SSE stream
- Nếu intent = RAG/SQL → render full response

**Pros**: Đơn giản, không cần refactor lớn
**Cons**: 2 requests cho non-general intents

### Option B (Streaming qua LangGraph)
Implement LangGraph async generator streaming.

```python
# Trong chat.py:
@router.post("/stream")
async def chat_stream(request: Request, body: ChatRequest):
    async def event_stream():
        # Gọi orchestrator với streaming
        async for event in orchestrator_graph.astream(inputs):
            if "response" in event:
                content = event["response"].content
                # Stream từng token
                for chunk in content.split(" "):
                    yield f"data: {json.dumps({'chunk': chunk+' ', 'done': False})}\n\n"
        yield f"data: {json.dumps({'chunk': '', 'done': True})}\n\n"
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

**Pros**: Một endpoint cho tất cả
**Cons**: LangGraph streaming phức tạp hơn, cần test kỹ

---

## Subtask 3.3 — Implement Option A (nếu chọn)

Không cần thay đổi backend. Chỉ cần update widget logic:

```javascript
// apps/widget-sdk/src/api/chat.js
async function sendMessage(query, sessionId, publicKey, apiUrl) {
  // Step 1: Classify intent (full response, nhanh)
  const response = await fetch(`${apiUrl}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Widget-Key': publicKey,
    },
    body: JSON.stringify({ query, session_id: sessionId })
  });
  
  const data = await response.json();
  return data; // { content, metadata, citations, component }
}
```

Render kết quả ngay (không streaming nhưng đơn giản và đúng).

---

## Subtask 3.4 — Implement Option B (nếu chọn)

Thay `GET /chat/stream` bằng `POST /chat/stream`:

```python
# apps/api/api/v1/chat.py

@router.post("/stream")
async def chat_stream_endpoint(request: Request, body: ChatRequest):
    tenant_id = request.state.tenant_id
    
    async def event_stream():
        inputs = {
            "query": body.query,
            "tenant_id": tenant_id,
            "session_id": body.session_id or "default",
            "history": [],
            "intent": None,
            "response": None,
        }
        
        try:
            # Chạy orchestrator full (không thật sự streaming từ LLM)
            # Nhưng yield từng word để fake streaming effect
            final_state = await orchestrator_graph.ainvoke(inputs)
            agent_response = final_state.get("response")
            
            if agent_response:
                content = agent_response.content
                words = content.split(" ")
                for i, word in enumerate(words):
                    chunk = word + (" " if i < len(words)-1 else "")
                    payload = json.dumps({"chunk": chunk, "done": False}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"
                    await asyncio.sleep(0.02)  # 20ms delay cho streaming effect
                
                # Gửi component nếu có
                if hasattr(agent_response, 'component') and agent_response.component:
                    comp_payload = json.dumps({
                        "chunk": "", 
                        "done": True,
                        "component": agent_response.component
                    }, ensure_ascii=False)
                    yield f"data: {comp_payload}\n\n"
                else:
                    yield f"data: {json.dumps({'chunk': '', 'done': True})}\n\n"
            else:
                yield f"data: {json.dumps({'chunk': 'Đã xảy ra lỗi.', 'done': True})}\n\n"
                
        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )
```

---

## Subtask 3.5 — Test streaming với curl

```bash
# Test POST /chat (full response)
curl -X POST http://localhost:8001/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_YOUR_KEY" \
  -d '{"query": "xin chào", "session_id": "test-1"}'

# Test SSE stream
curl -N "http://localhost:8001/api/v1/chat/stream?query=xin+ch%C3%A0o&session_id=test-1" \
  -H "X-API-Key: pk_live_YOUR_KEY"
```

---

## Checklist hoàn thành

- [ ] Quyết định Option A hoặc B và document lý do
- [ ] Implement lựa chọn đã quyết định
- [ ] Test bằng curl: `POST /chat` trả đúng format
- [ ] Test SSE: stream nhận được chunks liên tục
- [ ] Widget render text streaming (từng từ hiện dần)
- [ ] Component (product_grid, bar_chart) render sau khi stream xong
- [ ] Cập nhật `PROGRESS.md`
