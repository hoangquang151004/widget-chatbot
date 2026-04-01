# Chi tiết chức năng

## 1. Widget SDK (script nhúng)

### 1.1 Cách hoạt động

```
Website khách
  └── <script src="cdn.yourapp.com/widget.v2.js">
        └── ChatbotWidget.init({ token: 'pk_live_xxx', ... })
              ├── inject launcher button (nút chat nổi góc màn hình)
              └── tạo <iframe src="app.yourapp.com/widget?token=pk_live_xxx">
                    └── Next.js Chat App của bạn chạy trong iframe
```

### 1.2 API khởi tạo

```js
ChatbotWidget.init({
  token: 'pk_live_abc123',     // public_key — bắt buộc
  position: 'bottom-right',   // bottom-right | bottom-left
  primaryColor: '#2563eb',
  greeting: 'Xin chào! ...',
  zIndex: 9999,
});
```

### 1.3 postMessage bridge (host ↔ iframe)

```
Host page  ──postMessage──►  iframe (Chat App)
           ◄──postMessage──  iframe (Chat App)
```

Dùng cho: mở/đóng widget, truyền context trang (URL, user đang đăng nhập...), nhận sự kiện từ chat (click "Thêm vào giỏ").

### 1.4 Isolation

- iframe với `sandbox="allow-scripts allow-same-origin allow-forms"`.
- CSS trong iframe không ảnh hưởng trang host.
- Widget JS bundle là Vanilla JS thuần, không import framework.

---

## 2. Auth — Xác thực 2 key + Origin check

### 2.1 Sinh key khi onboarding

```python
import secrets

def generate_public_key() -> str:
    return f"pk_live_{secrets.token_urlsafe(24)}"
    # vd: pk_live_xK9mT2nQ8pL5...

def generate_admin_key() -> str:
    return f"sk_live_{secrets.token_urlsafe(32)}"
    # vd: sk_live_wR7jY3oN6qM1...
```

Cả hai được lưu vào bảng `tenant_keys`.

### 2.2 Middleware phân quyền

```python
async def resolve_tenant(
    request: Request,
    key: str = Header(alias="X-Widget-Key")
) -> tuple[Tenant, str]:

    # 1. Tìm tenant theo key
    if key.startswith("pk_"):
        tenant = await db.get_tenant_by_public_key(key)
        key_type = "public"
    elif key.startswith("sk_"):
        tenant = await db.get_tenant_by_admin_key(key)
        key_type = "admin"
    else:
        raise HTTPException(401, "Invalid key format")

    if not tenant:
        raise HTTPException(401, "Key not found")

    # 2. Kiểm tra Origin (chỉ áp dụng với public_key)
    if key_type == "public":
        origin = request.headers.get("origin") or \
                 request.headers.get("referer", "")
        allowed = await get_allowed_origins_cached(tenant.id)
        if not is_origin_allowed(origin, allowed):
            raise HTTPException(403, "Origin not allowed")

    return tenant, key_type


def is_origin_allowed(origin: str, allowed: list[str]) -> bool:
    from urllib.parse import urlparse
    host = urlparse(origin).netloc
    return any(urlparse(a).netloc == host for a in allowed)
```

### 2.3 Cache origin lookup (Redis)

Origin check xảy ra ở mọi request — phải cache để tránh query DB liên tục:

```python
async def get_allowed_origins_cached(tenant_id: str) -> list[str]:
    cache_key = f"origins:{tenant_id}"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    origins = await db.get_allowed_origins(tenant_id)
    await redis.setex(cache_key, 300, json.dumps(origins))  # TTL 5 phút
    return origins
```

---

## 3. Onboarding tenant

### 3.1 Nhận DB credentials

```python
class TenantDatabaseCreate(BaseModel):
    db_type: Literal["postgresql", "mysql"]
    db_host: str
    db_port: int = 5432
    db_name: str
    db_user: str
    db_password: str
    allowed_tables: list[str]

@router.post("/onboarding/database")
async def add_database(
    body: TenantDatabaseCreate,
    tenant: Tenant = Depends(require_admin_key)
):
    # 1. Test kết nối trước khi lưu
    ok, error = await test_db_connection(body)
    if not ok:
        raise HTTPException(400, f"Không kết nối được: {error}")

    # 2. Encrypt credentials
    encrypted_user = encrypt_aes256(body.db_user)
    encrypted_pass = encrypt_aes256(body.db_password)

    # 3. Cache schema cho LLM
    schema = await introspect_schema(body, body.allowed_tables)

    # 4. Lưu vào DB
    await db.save_tenant_database(
        tenant_id=tenant.id,
        db_user_enc=encrypted_user,
        db_password_enc=encrypted_pass,
        schema_cache=schema,
        ...
    )
```

### 3.2 Encrypt / Decrypt credentials

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os, base64

ENCRYPTION_KEY = bytes.fromhex(os.environ["APP_ENCRYPTION_KEY"])
# APP_ENCRYPTION_KEY = 64-char hex string (256-bit key)

def encrypt_aes256(plaintext: str) -> bytes:
    aesgcm = AESGCM(ENCRYPTION_KEY)
    nonce = os.urandom(12)  # 96-bit nonce
    ct = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return nonce + ct  # lưu nonce + ciphertext cùng nhau

def decrypt_aes256(data: bytes) -> str:
    aesgcm = AESGCM(ENCRYPTION_KEY)
    nonce, ct = data[:12], data[12:]
    return aesgcm.decrypt(nonce, ct, None).decode()
```

---

## 4. Backend API

### 4.1 Endpoints

| Method | Path | Key cần | Mô tả |
|---|---|---|---|
| `POST` | `/api/chat` | public | Chat chính, SSE stream |
| `POST` | `/api/documents/upload` | admin | Upload tài liệu RAG |
| `GET` | `/api/documents` | admin | Danh sách tài liệu |
| `DELETE` | `/api/documents/{id}` | admin | Xoá tài liệu |
| `POST` | `/api/database/setup` | admin | Lưu DB credentials |
| `POST` | `/api/database/test` | admin | Test kết nối DB |
| `GET` | `/api/config` | admin | Lấy cấu hình widget |
| `PUT` | `/api/config` | admin | Cập nhật cấu hình widget |
| `GET` | `/api/analytics` | admin | Thống kê hội thoại |
| `GET` | `/api/health` | — | Health check |

### 4.2 Luồng xử lý `/api/chat`

```
Request → xác thực key + Origin
       ↓
Intent Router (LLM classify: rag / sql / action / general)
       ↓
      ┌──────────┬───────────┬──────────┐
      ▼          ▼           ▼          ▼
    RAG        SQL        Action    General
      │          │           │          │
      └──────────┴───────────┴──────────┘
                      ↓
             Component Renderer
             → { message, component: { type, data } }
                      ↓
                SSE stream response
```

### 4.3 SSE streaming endpoint

```python
@router.post("/api/chat")
async def chat(
    req: ChatRequest,
    tenant_ctx: tuple = Depends(resolve_tenant)
):
    tenant, _ = tenant_ctx

    async def event_stream():
        # Stream text token by token
        async for chunk in process_chat(req, tenant):
            yield f"data: {json.dumps({'type': 'text', 'chunk': chunk})}\n\n"

        # Gửi component sau khi có đủ data
        component = await build_component(req, tenant)
        if component:
            yield f"data: {json.dumps({'type': 'component', 'payload': component})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )
```

### 4.4 Text-to-SQL với DB của khách

```python
async def run_sql_query(query: str, tenant: Tenant) -> dict:
    # 1. Lấy và decrypt credentials
    tenant_db = await db.get_tenant_database(tenant.id)
    password = decrypt_aes256(tenant_db.db_password_enc)
    user = decrypt_aes256(tenant_db.db_user_enc)

    # 2. Gen SQL bằng LLM
    sql = await sql_agent.generate(
        query=query,
        schema=tenant_db.schema_cache,
        allowed_tables=tenant_db.allowed_tables,
        tenant_id=tenant.id
    )

    # 3. Validate: chỉ cho SELECT
    if not sql.strip().upper().startswith("SELECT"):
        raise ValueError("Only SELECT is allowed")

    # 4. Kết nối DB khách và execute
    conn_str = build_connection_string(tenant_db, user, password)
    async with create_engine(conn_str).connect() as conn:
        result = await conn.execute(text(sql))
        rows = result.fetchall()

    # 5. Chọn component phù hợp
    return component_selector.select(query, rows, result.keys())
```

---

## 5. RAG Pipeline

### 5.1 Ingestion (Celery worker)

```
Upload file
    │
    ▼
[Celery task: ingest_document]
    ├── Parse: PyMuPDF (PDF) / python-docx (Word)
    ├── Extract text + metadata (page, heading)
    ├── Split: RecursiveCharacterTextSplitter
    │   ├── Parent: 1000 tokens
    │   └── Child:  200 tokens
    ├── Embed: text-embedding-3-small (batch)
    └── Upsert vào Qdrant
        collection = f"tenant_{tenant_id}"
        payload = { tenant_id, document_id, filename, page, chunk_index }
```

### 5.2 Query time

```python
async def rag_query(query: str, tenant: Tenant) -> dict:
    collection = f"tenant_{tenant.id}"

    # Embed query
    query_vector = await embedder.embed(query)

    # Retrieve top-5 child chunks
    hits = await qdrant.search(
        collection_name=collection,
        query_vector=query_vector,
        limit=5,
        query_filter=Filter(must=[
            FieldCondition(key="tenant_id", match=MatchValue(value=str(tenant.id)))
        ])
    )

    # Fetch parent chunks (thêm context)
    context = await fetch_parent_chunks(hits)

    # Generate answer
    answer = await llm.generate(query=query, context=context)
    sources = [{ "filename": h.payload["filename"], "page": h.payload["page"] } for h in hits]

    return { "answer": answer, "sources": sources }
```

---

## 6. Rich Component System

### 6.1 Component Renderer registry

```tsx
// apps/web/app/widget/components/renderer/index.tsx
const REGISTRY: Record<string, React.FC<any>> = {
  product_grid:   ProductGrid,
  cart_summary:   CartSummary,
  chart_bar:      ChartBar,
  chart_line:     ChartLine,
  order_history:  OrderHistory,
  payment_form:   PaymentForm,
  invoice:        Invoice,
  text_markdown:  MarkdownBlock,
};

export function ComponentRenderer({ component }) {
  const Comp = REGISTRY[component.type];
  if (!Comp) return <MarkdownBlock data={{ content: JSON.stringify(component.data) }} />;
  return <Comp data={component.data} meta={component.meta} />;
}
```

### 6.2 Response JSON schema từ backend

```json
{
  "message": "Đây là các sản phẩm phù hợp:",
  "component": {
    "type": "product_grid",
    "data": [
      { "id": "1", "name": "Áo thun đen", "price": 299000, "image": "...", "stock": 5 }
    ],
    "meta": {
      "title": "Sản phẩm áo thun",
      "actions": [{ "label": "Xem tất cả", "event": "view_all_products" }]
    }
  }
}
```

### 6.3 Các component

**product_grid** — hiển thị dạng lưới, mỗi card có ảnh + tên + giá + nút Thêm vào giỏ.

**cart_summary** — danh sách sản phẩm trong giỏ, số lượng chỉnh được, tổng tiền, nút Checkout.

**chart_bar / chart_line** — dùng Recharts, render trong iframe, không cần thư viện ở trang khách.

**order_history** — bảng đơn hàng có trạng thái màu sắc, nút Xem chi tiết / Track.

**payment_form** — form thanh toán ngay trong chat (họ tên, SĐT, địa chỉ, phương thức).

**invoice** — hóa đơn dạng bảng có thể print hoặc export PDF.

---

## 7. Dashboard admin

### 7.1 Luồng upload tài liệu RAG

```
Admin upload file (dùng admin_key)
    │
    ▼
POST /api/documents/upload
    │
    ├── Validate: file type, size < 10MB
    ├── Lưu file vào storage (local / S3)
    ├── Insert vào tenant_documents (status = 'pending')
    └── Enqueue Celery task: ingest_document(document_id)
    │
    ▼
[Celery worker xử lý bất đồng bộ]
    ├── Parse + chunk + embed
    ├── Upsert Qdrant
    └── Update status = 'done' (hoặc 'error')
    │
    ▼
Dashboard polling GET /api/documents → cập nhật trạng thái
```

### 7.2 Schema introspection (tự động cache schema)

Khi khách thêm DB credentials, hệ thống tự động đọc schema của các `allowed_tables` và cache vào `tenant_databases.schema_cache`:

```python
async def introspect_schema(creds, allowed_tables: list[str]) -> dict:
    """Đọc cột của từng bảng được phép để LLM biết gen SQL đúng."""
    schema = {}
    async with connect(creds) as conn:
        for table in allowed_tables:
            cols = await conn.execute(
                "SELECT column_name, data_type FROM information_schema.columns "
                "WHERE table_name = :t", {"t": table}
            )
            schema[table] = [{"name": r[0], "type": r[1]} for r in cols]
    return schema
    # vd: { "products": [{"name":"id","type":"uuid"}, {"name":"price","type":"numeric"}] }
```
