# Task Phase 5 — Testing & Verification

> **Mục tiêu:** Xác nhận toàn bộ hệ thống hoạt động end-to-end sau migration.
> **Yêu cầu:** Phase 1-4 phải hoàn thành.

---

## Checklist

### 5.1 — Khởi động hệ thống

- [x] Khởi động PostgreSQL (đang chạy)
- [x] Khởi động Redis: `docker-compose up redis -d`
- [x] Khởi động Backend:
  ```bash
  cd apps/api
  .venv/Scripts/python -m uvicorn main:app --reload --port 8001
  ```
- [x] Khởi động Frontend:
  ```bash
  cd apps/web
  npm run dev
  ```

Ghi nhận 2026-04-03: dịch vụ đang chạy ổn định (`redis`, backend `:8001`, frontend `:3000`).

---

### 5.2 — Health Check

- [x] `GET /api/health` → `{"status": "ok"}`
- [x] `GET /api/health/detailed` → postgresql, redis, qdrant đều "ok"

```bash
curl http://localhost:8001/api/health/detailed | python -m json.tool
```

Ghi nhận 2026-04-03: `status=ok`, services: `postgresql=ok`, `redis=ok`, `qdrant=ok`.

---

### 5.3 — Test Auth Flow

- [x] **Register:**

  ```bash
  curl -X POST http://localhost:8001/api/v1/admin/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Company","email":"admin@test.com","password":"password123"}'
  ```

  → Response có `tenant_id` và `public_key`

- [x] **Kiểm tra DB:** 4 bảng phải có data:

  ```sql
  SELECT * FROM tenants;
  SELECT * FROM tenant_widget_configs;
  SELECT * FROM tenant_ai_settings;
  SELECT * FROM tenant_keys;
  ```

  Ghi nhận 2026-04-03: tenant smoke có `tenant_widget_configs=1`, `tenant_ai_settings=1`, `tenant_keys=3`.

- [x] **Login:**

  ```bash
  curl -X POST http://localhost:8001/api/v1/admin/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"password123"}'
  ```

  → Lưu `access_token`

- [x] **GET /me:**

  ```bash
  curl http://localhost:8001/api/v1/admin/me \
    -H "Authorization: Bearer $TOKEN"
  ```

  → Response có `widget` và `ai_settings` objects

  Ghi nhận 2026-04-03: smoke test pass (`register=201`, `login=200`, `me=200`).

---

### 5.4 — Test Keys API

- [x] **List keys:** `GET /api/v1/admin/keys` → danh sách 2 keys (public + admin) từ register
- [x] **Create key:**

  ```bash
  curl -X POST http://localhost:8001/api/v1/admin/keys \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"key_type":"public","label":"Production Website"}'
  ```

  → Response có `key_value` đầy đủ (1 lần duy nhất)

- [x] **List keys lại:** Tổng = 3 keys
- [x] **Delete key:**

  ```bash
  curl -X DELETE http://localhost:8001/api/v1/admin/keys/{KEY_ID} \
    -H "Authorization: Bearer $TOKEN"
  ```

  → 200 OK, key bị thu hồi

  Ghi nhận 2026-04-03: pass đầy đủ CRUD keys (GET/POST/GET/DELETE).

---

### 5.5 — Test Widget Config API

- [x] **PATCH /widget:**

  ```bash
  curl -X PATCH http://localhost:8001/api/v1/admin/widget \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"bot_name":"My Bot","primary_color":"#FF5722","greeting":"Hello!"}'
  ```

  → 200 OK

- [x] **GET /me:** Bot name và color phải là giá trị mới

- [x] **Widget GET /config (public API):**

  ```bash
  PUBLIC_KEY="pk_live_..."
  curl http://localhost:8001/api/v1/chat/config \
    -H "X-Widget-Key: $PUBLIC_KEY"
  ```

  → Response có `bot_name: "My Bot"`, `primary_color: "#FF5722"`

  Ghi nhận 2026-04-03: `bot_name=Smoke Bot`, `primary_color=#FF5722` ở cả `/admin/me` và `/chat/config`.

---

### 5.6 — Test AI Settings API

- [x] **PATCH /ai-settings:**

  ```bash
  curl -X PATCH http://localhost:8001/api/v1/admin/ai-settings \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"system_prompt":"You are a helpful assistant.","is_rag_enabled":true,"is_sql_enabled":false}'
  ```

  → 200 OK

  Ghi nhận 2026-04-03: cập nhật thành công `system_prompt`, `temperature`, `max_tokens`.

---

### 5.7 — Test Origins API

- [x] **Add origin:**

  ```bash
  curl -X POST http://localhost:8001/api/v1/admin/origins \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"origin":"localhost:3000","note":"Dev environment"}'
  ```

- [x] **List origins:** Kiểm tra origin đã thêm

- [x] **Delete origin:**

  ```bash
  curl -X DELETE http://localhost:8001/api/v1/admin/origins/{ORIGIN_ID} \
    -H "Authorization: Bearer $TOKEN"
  ```

  Ghi nhận 2026-04-03: pass đầy đủ CRUD origins (POST/GET/DELETE).

---

### 5.8 — Test Document Upload (RAG - Regression)

- [x] Upload một file test thành công end-to-end (2026-04-02)

  ```bash
  curl -X POST http://localhost:8001/api/v1/files/upload \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@test.pdf"
  ```

  → 200 với document record

- [x] Kiểm tra document trong DB:

  ```sql
  SELECT * FROM tenant_documents;
  ```

  Ghi nhận 2026-04-03: `tenant_documents_count=8`.

- [x] Kiểm tra xử lý async qua polling status:
  - Trạng thái chuyển từ `processing` -> `done`

- [x] Kiểm tra Qdrant path hoạt động (ingest/search/delete) (2026-04-02)
- [x] Kiểm tra delete document xóa được vectors tương ứng (2026-04-02)

---

### 5.9 — Test Chat Stream (Regression)

- [x] Test stream endpoint với public key:

  ```bash
  curl -X POST http://localhost:8001/api/v1/chat/stream \
    -H "X-Widget-Key: $PUBLIC_KEY" \
    -H "Content-Type: application/json" \
    -d '{"query":"Xin chào","session_id":"test-session-1"}'
  ```

  → SSE stream hoạt động

  Ghi nhận 2026-04-03: `stream_status=200`, `stream_has_done_true=true`, `stream_has_error=false`.

- [x] Kiểm tra `chat_sessions` và `chat_messages` có được tạo trong DB:

  ```sql
  SELECT * FROM chat_sessions;
  SELECT * FROM chat_messages LIMIT 10;
  ```

  Ghi nhận 2026-04-03 (session `phase5-session-1775188200`): `chat_sessions_for_session=1`, `chat_messages_for_session=2`.

---

### 5.10 — Frontend End-to-End Test

- [x] Mở browser: `http://localhost:3000`
- [x] **Register:** Điền form đăng ký → thành công
- [x] **Login:** Đăng nhập → redirect vào dashboard
- [x] **Dashboard:** Stats hiển thị (dù 0 cũng được)
- [x] **Settings:** Thay đổi bot name → Save → Refresh → Name đúng
- [x] **Keys:** Hiển thị danh sách keys thật (không phải mock)
- [x] **Keys:** Tạo key mới → Modal hiện key value → Copy
- [x] **Knowledge Base:** Upload file → Hiện trong danh sách

Ghi nhận 2026-04-03 (browser flow tự động, headless):

- `email=e2e_1775189556806@test.com`, `slug=e2e-1775189556806`
- `register_login_dashboard=true`
- `settings_save_success_message=true`, `settings_persist_after_reload=true`
- `keys_page_loaded=true`, `key_created_modal_visible=true`, `key_label_present_after_create=true`
- `knowledge_upload_success_message=true`, `knowledge_row_visible=true`
- Đã fix root-cause loop request gây 429 admin bằng cách memoize hook `useApi`.

---

### 5.11 — Text-to-SQL: Admin DB + schema introspection (pytest)

- [x] Một luồng tích hợp async (`httpx` + `ASGITransport`): register/login → `GET/POST /api/v1/admin/database` → test kết nối (thành công + sai mật khẩu) → `get_schema(..., force_refresh=True)` có `tables` và không có `error`.

File: `apps/api/tests/test_admin_database_integration.py`  
Smoke cục bộ: `apps/api/scripts/run_smoke_integration.py`

---

### 5.12 — Kiểm tra Alembic History

```bash
cd apps/api
.venv/Scripts/alembic history --verbose
# Phải thấy 2 revisions: drop_old + create_new
```

### 5.13 — Verify cleanup legacy columns (bắt buộc)

- [x] Chạy migration head sau cleanup:

```bash
cd apps/api
.venv/Scripts/alembic upgrade head
```

- [x] Kiểm tra bảng `tenants` không còn các cột legacy:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'tenants'
ORDER BY column_name;
```

Các cột phải không còn tồn tại:

- `slug`, `public_key`, `secret_key`, `allowed_origins`
- `widget_color`, `widget_placeholder`, `widget_position`, `widget_welcome_message`, `widget_avatar_url`, `widget_font_size`, `widget_show_logo`
- `system_prompt`, `is_rag_enabled`, `is_sql_enabled`

Kết quả verify 2026-04-03:

- Alembic current: `f2a4d1c7b9e0 (head)`
- `tenants` columns: `created_at`, `email`, `id`, `is_active`, `name`, `password_hash`, `plan`, `updated_at`
- `legacy_remaining`: `[]`

---

## Summary Checklist cuối cùng

**Backend:**

- [x] Regression Text-to-SQL schema (introspection thật sau khi lưu `tenant_databases`) — `tests/test_admin_database_integration.py`
- [x] Tất cả 10 bảng lõi tồn tại trong DB
- [x] Register tạo đủ 4 records (tenant, widget_config, ai_settings, 2 keys)
- [x] Middleware validate key qua bảng `tenant_keys`
- [x] CRUD Keys hoạt động
- [x] Widget config API trả về data từ `tenant_widget_configs`
- [x] AI settings API hoạt động
- [x] RAG upload/search/delete chạy trên Qdrant ổn định (smoke + e2e upload)
- [x] Chat stream không bị break

Ghi nhận 2026-04-03: `existing_tables` gồm đủ 10 bảng lõi, `missing_tables=[]`.

**Frontend:**

- [x] Settings page load + save data thật (widget + AI settings)
- [x] Keys page hiện danh sách thật + tạo/xóa
- [x] Không còn hardcode mock data

---

## Ghi chú post-migration

- Cập nhật `PROGRESS.md`: đánh dấu tất cả phases ✅
- Cập nhật `AGENTS.md` nếu có thay đổi về conventions
- Commit với message: `feat: v2 database schema migration complete`
