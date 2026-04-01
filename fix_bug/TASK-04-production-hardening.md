# TASK-04 — Production Hardening

**Ưu tiên**: 🟡 Medium  
**Ước tính**: 2–3 giờ  
**Phụ thuộc**: Các TASK trước hoàn thành

---

## Subtask 4.1 — Fix CORS trong main.py

**File**: `apps/api/main.py`

### Vấn đề
```python
# Hiện tại (KHÔNG an toàn cho production):
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ← Phải đổi
    ...
)
```

### Fix
```python
from core.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

Trong `core/config.py` đã có:
```python
BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
```

Trong `.env` production:
```env
BACKEND_CORS_ORIGINS=["https://dashboard.yourapp.com","https://yourapp.com"]
```

**Lưu ý**: Widget browser request có Origin từ trang khách → được xử lý bởi `SecurityMiddleware` (origin check per-tenant), không phải CORS middleware này. CORS middleware chủ yếu cho dashboard Next.js.

---

## Subtask 4.2 — Verify Alembic Migrations

**Folder**: `apps/api/` (alembic.ini đã có)

### Kiểm tra
```bash
cd apps/api
# Activate venv
.venv\Scripts\activate  # Windows
# hoặc source .venv/bin/activate  # Linux/Mac

# Xem migration hiện tại
alembic current

# Xem lịch sử
alembic history

# Chạy migration lên head
alembic upgrade head
```

### Nếu chưa có migration nào
```bash
# Tạo migration đầu tiên từ models hiện tại
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

### Verify tables đã được tạo
```bash
# Kết nối psql và kiểm tra
psql -U postgres -d widget_chatbot -c "\dt"
# Expect: tenants, tenant_database_configs, tenant_documents, tenant_files, alembic_version
```

### Schema cần có (từ models/)
- `tenants`: id (UUID PK), name, slug (unique), public_key, secret_key, allowed_origins, is_active
- `tenant_database_configs`: id, tenant_id (FK), db_type, db_host, db_port, db_name, db_username, encrypted_password
- `tenant_documents`: id, tenant_id, filename, file_type, file_size, storage_path, status, chunk_count, error_message, uploaded_at, processed_at
- `alembic_version`: Tự tạo bởi Alembic

---

## Subtask 4.3 — Sentry Integration

**File**: `apps/api/main.py` và `apps/api/core/config.py`

Config đã có `SENTRY_DSN` nhưng chưa init SDK.

```bash
# Install
pip install sentry-sdk[fastapi]
```

```python
# apps/api/main.py — thêm vào top file:
import sentry_sdk
from core.config import settings

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=0.1,  # 10% performance tracing
        environment=settings.ENV,
    )
```

Trong `.env`:
```env
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## Subtask 4.4 — Rate Limiting Improvement

**File**: `apps/api/core/rate_limit.py`

Hiện tại: 60 req/phút cho mọi tenant.  
Cần phân biệt public key vs secret key:

```python
class RateLimiter:
    PUBLIC_KEY_LIMIT = 60   # 60 req/min (chat widget)
    SECRET_KEY_LIMIT = 20   # 20 req/min (dashboard admin)
    
    async def check(self, tenant_id: str, key_type: str) -> bool:
        limit = self.PUBLIC_KEY_LIMIT if key_type == "public" else self.SECRET_KEY_LIMIT
        key = f"rate_limit:{key_type}:{tenant_id}"
        # ... logic Redis ...
```

Trong `middleware.py`, pass `key_type` khi gọi rate limiter.

---

## Subtask 4.5 — Storage Directory Verification

**File**: `apps/api/api/v1/files.py`

```python
STORAGE_DIR = "storage"  # Relative path — có thể fail nếu cwd sai
```

### Fix: Dùng absolute path
```python
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
```

Thêm vào `.env.example`:
```env
STORAGE_PATH=./storage
```

Đảm bảo `storage/` được tạo khi khởi động:
```python
# Trong main.py startup event:
@app.on_event("startup")
async def startup():
    os.makedirs("storage", exist_ok=True)
```

---

## Subtask 4.6 — Health Check Endpoint Detail

**File**: `apps/api/main.py`

Thêm detailed health check:
```python
@app.get("/api/health/detailed")
async def health_detailed():
    checks = {}
    
    # Redis check
    try:
        from redis import Redis
        r = Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT)
        r.ping()
        checks["redis"] = "ok"
    except:
        checks["redis"] = "error"
    
    # Qdrant check  
    try:
        from qdrant_client import QdrantClient
        c = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
        c.get_collections()
        checks["qdrant"] = "ok"
    except:
        checks["qdrant"] = "error"
    
    # Gemini check
    checks["gemini"] = "configured" if settings.GEMINI_API_KEY else "not_configured"
    
    return {"status": "ok", "checks": checks}
```

---

## Checklist hoàn thành

- [ ] CORS `allow_origins=["*"]` đã đổi thành `settings.BACKEND_CORS_ORIGINS`
- [ ] `alembic upgrade head` chạy thành công, tất cả tables tồn tại
- [ ] Sentry init khi `SENTRY_DSN` được set
- [ ] Rate limiting phân biệt public vs secret key
- [ ] Storage path dùng absolute path
- [ ] `GET /api/health/detailed` hoạt động và trả thông tin services
- [ ] Cập nhật `PROGRESS.md`
