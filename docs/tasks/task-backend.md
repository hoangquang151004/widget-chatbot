# Task: Backend API — Hoàn Thiện & Bug Fixes
> **Module**: `apps/api/` | **Ưu tiên**: 🔴 P1 | **Cập nhật**: 2026-03-27

---

## 🐛 Bugs Cần Sửa Ngay (Critical)

### Task B-001: Fix `import time` trong sql_agent.py
- **File**: `apps/api/ai/sql_agent.py`
- **Lỗi**: Dùng `time.time()` ở dòng 27 và 52 nhưng chưa import
- **Fix**: Thêm `import time` vào top của file
- **Test**: Restart server, gửi query SQL, kiểm tra schema cache không crash
- [ ] Thêm `import time` vào `sql_agent.py`
- [ ] Verify bằng cách chạy `.venv\Scripts\python.exe -c "from ai.sql_agent import SQLAgent"`

---

## 🆕 Features Cần Thêm (P1)

### Task B-002: Tenant Registration API
- **Endpoint**: `POST /api/v1/admin/register`
- **Mục đích**: Cho phép tạo tenant mới với keys tự động
- **Input**: `{ name, email, allowed_origins[] }`
- **Output**: `{ tenant_id, public_key, secret_key, slug }`
- **Logic**:
  1. Generate `public_key = "pk_live_" + secrets.token_urlsafe(32)`
  2. Generate `secret_key = "sk_live_" + secrets.token_urlsafe(32)`
  3. Insert vào bảng `tenants`
  4. Return keys
- [ ] Thêm `RegisterSchema` Pydantic model vào `admin.py`
- [ ] Implement `POST /register` endpoint
- [ ] Hỏi: có cần super-admin auth để tạo tenant không? (hiện tại không có)

### Task B-003: Tenant Update + Key Rotation
- **Endpoint**: `PATCH /api/v1/admin/me`
- **Endpoint**: `POST /api/v1/admin/rotate-keys`
- [ ] Implement PATCH cho `name`, `allowed_origins`
- [ ] Implement rotate: generate keys mới, invalidate keys cũ
- [ ] Trả về keys mới sau rotate

### Task B-004: Streaming Chat Endpoint (SSE)
- **Endpoint**: `GET /api/v1/chat/stream`
- **Mục đích**: Stream response từ Gemini về Widget theo dạng SSE
- **Tech**: `StreamingResponse` + `text/event-stream`
- [ ] Nghiên cứu `generate_content_stream_async` của Gemini SDK
- [ ] Tạo endpoint `/stream` trong `api/v1/chat.py`
- [ ] Trả về format: `data: {"chunk": "...", "done": false}\n\n`
- [ ] Widget SDK connect EventSource sau khi có endpoint này

---

## 🔧 Cải Thiện (P2)

### Task B-005: Alembic Migration Setup
- [ ] `pip install alembic`
- [ ] `alembic init db/migrations`
- [ ] Cấu hình `alembic.ini` + `env.py` dùng async engine
- [ ] Tạo initial migration từ schema.sql hiện tại
- [ ] Tạo script helper: `python -m alembic upgrade head`

### Task B-006: Seed Data Script
- **File mới**: `apps/api/scripts/seed.py`
- [ ] Tạo 1 tenant demo với public + secret key
- [ ] In ra `pk_live_...` và `sk_live_...` để test
- [ ] Upload 1 document mẫu vào Qdrant
- [ ] Cách chạy: `.venv\Scripts\python.exe scripts/seed.py`

### Task B-007: CORS Per-Tenant
- [ ] Đổi `allow_origins=["*"]` sang dynamic lookup từ DB
- [ ] Tạo helper lấy all `allowed_origins` của mọi tenant
- [ ] Cache với Redis TTL 5 phút

### Task B-008: Unit Tests
- **Framework**: pytest + pytest-asyncio
- [ ] Test middleware auth (valid key, invalid key, expired)
- [ ] Test admin endpoints (GET /me, POST /database)
- [ ] Test SQL sanitizer (`_sanitize_sql`)
- [ ] Test chat endpoint (mock Gemini)
- [ ] Cấu hình `pytest.ini` với `asyncio_mode = auto`

---

## ✅ Definition of Done

- [ ] Server khởi động không có warning
- [ ] `GET /api/health` → `{"status": "ok"}`
- [ ] `POST /admin/register` tạo được tenant mới
- [ ] `POST /chat` → trả về response từ AI (cần Redis + Qdrant + PostgreSQL)
- [ ] Tất cả unit tests pass
