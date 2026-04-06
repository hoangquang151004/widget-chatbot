# task_bug_01 — BUG-AI-01: Orchestrator không đọc ai_settings từ DB

**Ưu tiên**: 🔴 Critical  
**File cần sửa**: `apps/api/ai/orchestrator.py`  
**Thời gian ước tính**: 30–45 phút  
**Phụ thuộc**: Không có — có thể làm ngay

---

## Mô tả bug

`orchestrator.py` → `classifier_node` phân loại intent (RAG/SQL/GENERAL) và route ngay đến node tương ứng. **Không bao giờ** load `TenantAiSettings` từ DB.

**Hậu quả thực tế:**
- User tắt SQL trong dashboard (`is_sql_enabled = false`) → bot vẫn cố chạy SQL agent → lỗi "Đã có lỗi xảy ra khi truy vấn dữ liệu" nếu chưa cấu hình DB
- User tắt RAG (`is_rag_enabled = false`) → bot vẫn tìm kiếm trong vector store → trả lời "Không tìm thấy tài liệu" thay vì trả lời general

---

## Phân tích code hiện tại

**File**: `apps/api/ai/orchestrator.py`

```python
# HIỆN TẠI — route_by_intent KHÔNG check ai_settings
def route_by_intent(state: AgentState) -> str:
    intent = state.get("intent")
    if intent == "RAG":
        return "rag_node"    # ← Luôn route đến RAG dù is_rag_enabled = false
    elif intent == "SQL":
        return "sql_node"    # ← Luôn route đến SQL dù is_sql_enabled = false
    else:
        return "general_node"
```

---

## Giải pháp

Thêm một node `settings_loader_node` chạy ngay sau `history_loader_node` để load `TenantAiSettings` vào state. Sau đó sửa `route_by_intent` để kiểm tra flags trước khi route.

### Bước 1: Thêm field vào `AgentState`

```python
# Thêm vào class AgentState
class AgentState(TypedDict):
    query: str
    tenant_id: str
    session_id: str
    history: List[Dict[str, str]]
    intent: Optional[Literal["RAG", "SQL", "GENERAL"]]
    response: Optional[AgentResponse]
    # Thêm 2 field mới:
    is_rag_enabled: bool        # ← MỚI
    is_sql_enabled: bool        # ← MỚI
```

### Bước 2: Thêm `settings_loader_node`

```python
# Thêm import ở đầu file
from db.session import async_session
from models.ai_settings import TenantAiSettings
from sqlalchemy.future import select
from uuid import UUID

# Thêm node mới (đặt sau history_loader_node)
async def settings_loader_node(state: AgentState) -> Dict[str, Any]:
    """Load TenantAiSettings từ DB để biết RAG/SQL có được bật không."""
    tenant_id = state["tenant_id"]
    
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
            }
    except Exception as e:
        logger.warning("settings_loader_node failed for tenant %s: %s", tenant_id, str(e))
    
    # Default: bật RAG, tắt SQL (an toàn nhất nếu không load được)
    return {
        "is_rag_enabled": True,
        "is_sql_enabled": False,
    }
```

### Bước 3: Sửa `route_by_intent`

```python
def route_by_intent(state: AgentState) -> str:
    intent = state.get("intent")
    is_rag_enabled = state.get("is_rag_enabled", True)
    is_sql_enabled = state.get("is_sql_enabled", False)
    
    if intent == "RAG":
        if is_rag_enabled:
            return "rag_node"
        else:
            # RAG bị tắt → fallback sang general
            logger.info("RAG disabled for tenant %s, fallback to general", state.get("tenant_id"))
            return "general_node"
    
    elif intent == "SQL":
        if is_sql_enabled:
            return "sql_node"
        else:
            # SQL bị tắt → fallback sang general
            logger.info("SQL disabled for tenant %s, fallback to general", state.get("tenant_id"))
            return "general_node"
    
    else:
        return "general_node"
```

### Bước 4: Thêm node vào graph và cập nhật edges

```python
# Thêm node
workflow.add_node("settings_loader", settings_loader_node)

# Cập nhật thứ tự edges:
# loader → settings_loader → classifier → [rag|sql|general] → saver → END
workflow.set_entry_point("loader")
workflow.add_edge("loader", "settings_loader")    # ← MỚI
workflow.add_edge("settings_loader", "classifier") # ← SỬA (trước là loader → classifier)
```

---

## Code đầy đủ để paste vào `orchestrator.py`

Chỉ thay thế các phần sau, giữ nguyên phần còn lại:

### Phần 1: Thêm imports (đầu file, sau các import hiện có)

```python
from db.session import async_session
from models.ai_settings import TenantAiSettings
from sqlalchemy.future import select
from uuid import UUID
```

### Phần 2: Thay toàn bộ `AgentState`

```python
class AgentState(TypedDict):
    query: str
    tenant_id: str
    session_id: str
    history: List[Dict[str, str]]
    intent: Optional[Literal["RAG", "SQL", "GENERAL"]]
    response: Optional[AgentResponse]
    is_rag_enabled: bool
    is_sql_enabled: bool
```

### Phần 3: Thêm function mới (sau `history_loader_node`)

```python
async def settings_loader_node(state: AgentState) -> Dict[str, Any]:
    """Load TenantAiSettings từ DB để biết RAG/SQL có được bật không."""
    tenant_id = state["tenant_id"]
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
            }
    except Exception as e:
        logger.warning("settings_loader_node failed for tenant %s: %s", tenant_id, str(e))
    return {"is_rag_enabled": True, "is_sql_enabled": False}
```

### Phần 4: Thay `route_by_intent`

```python
def route_by_intent(state: AgentState) -> str:
    intent = state.get("intent")
    is_rag_enabled = state.get("is_rag_enabled", True)
    is_sql_enabled = state.get("is_sql_enabled", False)

    if intent == "RAG":
        if is_rag_enabled:
            return "rag_node"
        logger.info("RAG disabled for tenant %s, fallback to general", state.get("tenant_id"))
        return "general_node"

    elif intent == "SQL":
        if is_sql_enabled:
            return "sql_node"
        logger.info("SQL disabled for tenant %s, fallback to general", state.get("tenant_id"))
        return "general_node"

    return "general_node"
```

### Phần 5: Thay phần Build Graph

```python
workflow = StateGraph(AgentState)

workflow.add_node("loader", history_loader_node)
workflow.add_node("settings_loader", settings_loader_node)   # ← MỚI
workflow.add_node("classifier", classifier_node)
workflow.add_node("rag_node", rag_node)
workflow.add_node("sql_node", sql_node)
workflow.add_node("general_node", general_node)
workflow.add_node("saver", history_saver_node)

workflow.set_entry_point("loader")
workflow.add_edge("loader", "settings_loader")               # ← SỬA
workflow.add_edge("settings_loader", "classifier")           # ← MỚI

workflow.add_conditional_edges(
    "classifier",
    route_by_intent,
    {
        "rag_node": "rag_node",
        "sql_node": "sql_node",
        "general_node": "general_node"
    }
)

workflow.add_edge("rag_node", "saver")
workflow.add_edge("sql_node", "saver")
workflow.add_edge("general_node", "saver")
workflow.add_edge("saver", END)

orchestrator_graph = workflow.compile()
```

---

## Kiểm tra sau khi sửa

### Test 1: SQL bị tắt → fallback sang general

```bash
# 1. Tắt SQL trong dashboard tenant hoặc trực tiếp qua API
curl -X PATCH http://localhost:8001/api/v1/admin/ai-settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_sql_enabled": false}'

# 2. Gửi câu hỏi dạng SQL intent
curl -X POST http://localhost:8001/api/v1/chat/stream \
  -H "X-Widget-Key: $PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "doanh thu tháng này là bao nhiêu?", "session_id": "test-bug01"}'

# ✅ Expect: Trả về general response (không có lỗi SQL), log có "SQL disabled for tenant"
# ❌ Trước khi fix: Trả về lỗi "Đã có lỗi xảy ra khi truy vấn dữ liệu"
```

### Test 2: RAG bị tắt → fallback sang general

```bash
# 1. Tắt RAG
curl -X PATCH http://localhost:8001/api/v1/admin/ai-settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_rag_enabled": false}'

# 2. Gửi câu hỏi về tài liệu
curl -X POST http://localhost:8001/api/v1/chat/stream \
  -H "X-Widget-Key: $PUBLIC_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "điều khoản trong hợp đồng là gì?", "session_id": "test-bug01-rag"}'

# ✅ Expect: Trả về general response (Gemini tự trả lời, không search Qdrant)
# ❌ Trước khi fix: Search Qdrant → "Không tìm thấy tài liệu"
```

### Test 3: Cả hai bật → hoạt động bình thường

```bash
curl -X PATCH http://localhost:8001/api/v1/admin/ai-settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_rag_enabled": true, "is_sql_enabled": true}'

# Gửi câu hỏi về tài liệu → phải route đúng đến RAG
```

### Kiểm tra log

Trong terminal backend, sau khi fix phải thấy log dạng:

```
INFO:ai.orchestrator:SQL disabled for tenant <uuid>, fallback to general
```

---

## Checklist hoàn thành

- [ ] Thêm imports vào đầu `orchestrator.py`
- [ ] Thêm `is_rag_enabled`, `is_sql_enabled` vào `AgentState`
- [ ] Thêm function `settings_loader_node`
- [ ] Sửa `route_by_intent` để check flags
- [ ] Thêm node `settings_loader` vào graph
- [ ] Sửa edges: `loader → settings_loader → classifier`
- [ ] Restart backend
- [ ] Test 1: SQL tắt → fallback general ✓
- [ ] Test 2: RAG tắt → fallback general ✓
- [ ] Test 3: Cả hai bật → route bình thường ✓
- [ ] Cập nhật `PROGRESS.md`: BUG-AI-01 → ✅ FIXED
