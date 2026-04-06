# PROGRESS.md — Tiến Độ Dự Án Widget Chatbot SaaS

> Cập nhật: 2026-04-03 | Tổng tiến độ: ~80%
> Lưu ý: Các Phase 1-5 (schema v2, API, frontend integration) đã hoàn thành.
> **Hiện tại**: Phase 6 — Sửa 3 bug ẩn trong AI Engine. **Kế hoạch tổng hợp:** [implementation_plan.md](../../implementation_plan.md) (mục Phase 6).

---

## Tiến độ theo module

```
Database Schema   [██████████] 100%  v2 migration done, 10 bảng ổn định
Auth & Security   [██████████] 100%  JWT + 2-key system + AES-256-GCM
Backend API       [██████████] 100%  Tất cả endpoints hoạt động
Frontend Dashboard[██████████] 100%  Settings/Keys/KB/Billing kết nối API thật
Widget SDK        [██████████] 100%  Nhúng được, responsive, mobile ok
AI — RAG Ingest   [██████████] 100%  Upload → Celery → Qdrant ổn định
AI — Orchestrator [█████████░]  90%  Phase 6 (BUG-AI-01..03) đã triển khai trong apps/api
AI — SQL Agent    [████████░░]  80%  Pipeline xong, chưa tích hợp mượt vào orchestrator
DevOps            [██████░░░░]  60%  Docker ok, chưa production SSL
────────────────────────────────────────────────────────
Tổng thể          [████████░░]  ~80%
```

---

## Phase 6 — AI Engine Bug Fixes (hoàn thành 2026-04-03)

| ID | Mức độ | Mô tả | Task | Trạng thái |
|----|--------|-------|------|------------|
| BUG-AI-01 | Critical | Orchestrator đọc `is_rag_enabled`/`is_sql_enabled` từ DB | task_bug_01 | Done (orchestrator) |
| BUG-AI-02 | Critical | Hybrid dense + BM25 (RRF), fallback dense | task_bug_02 | Done (vector_store) |
| BUG-AI-03 | Critical | `system_prompt` từ DB cho general + RAG | task_bug_03 | Done |

### Ghi chú triển khai

Luồng graph: `loader` → `settings_loader` → `classifier` → (theo intent và flag) `rag_node` | `sql_node` | `general_node` → `saver`. Chi tiết: [implementation_plan.md](../../implementation_plan.md) mục 2.

---

## ✅ Phase 1 — Database Schema v2

- [x] 10 bảng lõi tạo đầy đủ (`tenants`, `tenant_widget_configs`, `tenant_ai_settings`, `tenant_keys`, `tenant_allowed_origins`, `tenant_databases`, `tenant_documents`, `chat_sessions`, `chat_messages`, `chat_analytics`)
- [x] Alembic migration ổn định, không còn legacy columns
- [x] Index cho `tenant_keys.key_value` (UNIQUE lookup)

---

## ✅ Phase 2 — Alembic Migration Stabilization

- [x] `env.py` import đúng `Base` từ `models.__init__`
- [x] Migration `v2_schema_stabilization` + `v2_create_new_schema` đã apply
- [x] Verify: `alembic current` → `f2a4d1c7b9e0 (head)`

---

## ✅ Phase 3 — Backend API Refactor

- [x] `POST /register` → tạo đủ tenant + widget_config + ai_settings + 2 keys
- [x] `GET /me` → trả về widget + ai_settings
- [x] `PATCH /widget` và `PATCH /ai-settings` → lưu đúng bảng tương ứng
- [x] `GET|POST|DELETE /keys` → CRUD đầy đủ
- [x] `GET|POST|DELETE /origins` → CRUD đầy đủ
- [x] `GET /billing/summary` → dữ liệu thật từ DB
- [x] `POST|GET /database` + `/database/test` → lưu và decrypt credentials
- [x] Chat stream `POST /stream` → SSE qua LangGraph orchestrator

---

## ✅ Phase 4 — Frontend Integration

- [x] Settings page → `PATCH /widget` + `PATCH /ai-settings` (không còn mock)
- [x] Keys page → `GET|POST|DELETE /keys` (không còn mock)
- [x] Knowledge Base → `GET|POST|DELETE /files` + polling status
- [x] Billing page → `GET /billing/summary` (usage thật từ DB)
- [x] Dashboard home → stats thật

---

## ✅ Phase 5 — End-to-End Testing

- [x] Auth flow: register → login → me ✓
- [x] Keys CRUD: GET/POST/DELETE ✓
- [x] Widget config: save + reload ✓
- [x] Document upload → status polling → done ✓
- [x] Chat stream: SSE hoạt động, `done: true` ✓
- [x] Chat messages persist vào DB ✓
- [x] E2E browser flow: register → dashboard → settings → keys → upload ✓

---

## 📋 Tasks còn lại theo thứ tự ưu tiên

| Thứ tự | Task | Mô tả | Trạng thái |
|--------|------|-------|------------|
| 1 | `task_bug_01` | BUG-AI-01 | Done |
| 2 | `task_bug_02` | BUG-AI-02 | Done |
| 3 | `task_bug_03` | BUG-AI-03 | Done |
| 4 | — | SQL E2E khách thật + (tùy chọn) guard khi chưa cấu hình DB — xem [docs/TRANG_THAI_DU_AN.md](../../docs/TRANG_THAI_DU_AN.md) | ⏳ Backlog |
| 5 | — | Stripe / Admin panel multi-tenant | ⏳ Backlog |
| 6 | — | Production SSL + hardening ([docs/PRODUCTION_RUNBOOK.md](../../docs/PRODUCTION_RUNBOOK.md)) | ⏳ Backlog |

---

## Lịch sử cập nhật

| Ngày | Cập nhật |
|------|---------|
| 2026-04-03 | Phân tích thực tế sau khi đọc toàn bộ code. Phát hiện 3 bug ẩn trong AI Engine. Tạo task_bug_01/02/03. |
| 2026-04-03 | Hoàn thành Phase 5 E2E testing. Browser flow pass. Chat persist vào DB. |
| 2026-03-31 | Hoàn thành Phase 4: Frontend kết nối API thật (không còn mock data). |
| 2026-03-31 | Hoàn thành Phase 3: Backend API refactor theo schema v2. |
| 2026-03-31 | Hoàn thành Phase 2: Alembic migration stable. |
| 2026-03-31 | Hoàn thành Phase 1: 10 bảng lõi tạo đầy đủ. |
| 2026-03-31 | Hoàn thành TASK-14: Nâng cấp Text-to-SQL (few-shot, self-correction). |
