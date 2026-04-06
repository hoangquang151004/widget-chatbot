# PROGRESS.md — Tiến Độ Dự Án Widget Chatbot SaaS
> Cập nhật: 2026-03-31 | Tổng tiến độ: ~92%
> Hoàn thành Phase 1: Fix Widget SDK & Backend Environment
> Hoàn thành Phase 2: AI Engine Improvements (Text-to-SQL Upgrade)

---

## Tiến độ theo module

```
Backend API       [██████████] 98%   Migration ok, Redis Pool added
AI Pipeline       [██████████] 100%  RAG+SQL+General (SQL Upgraded)
Auth & Security   [██████████] 100%  2-key done, AES-256-GCM ok
Dashboard UI      [█████████░] 90%   Cấu hình Pages ready
Widget SDK        [██████████] 100%  TASK-08 (Fix entry point) done
DevOps            [██████░░░░] 60%   Docker ok, DB setup done
────────────────────────────────────────────────────────
Tổng thể          [█████████░] ~92%
```

---

## 🔴 Bug Widget SDK — Status

| ID | Mức độ | Mô tả | Task | Trạng thái |
|----|--------|-------|------|------------|
| BUG-01 | ✅ FIXED | URL duplicate `/api/v1/api/v1/chat` | TASK-07 | ✅ DONE |
| BUG-02 | ✅ FIXED | `loader.js` deprecated, fix entry point | TASK-08 | ✅ DONE |
| BUG-03 | ✅ FIXED | Public key fake `pk_live_public_key_123` | TASK-09 | ✅ DONE |
| BUG-04 | ✅ FIXED | `dist/widget.js` không sync với `src/` | TASK-10 | ✅ DONE |

---

## ✅ Phase 2: AI Engine Improvements

### Hoàn thành
- [x] **TASK-14**: Nâng cấp Text-to-SQL Pipeline (Few-shot, Redis Cache, Self-correction).

---

## ✅ Module 1: Backend API (`apps/api/`)

### Hoàn thành
- [x] Đầy đủ bộ API v1 (Admin, Chat, Files)
- [x] SecurityMiddleware 2-key auth
- [x] SSE streaming support
- [x] Celery worker ingestion
- [x] **TASK-11: Migration & Seed**: Tạo `widget_chatbot_db` + seed demo tenant.
- [x] **TASK-14**: Thêm Redis Pool Singleton cho toàn hệ thống.

---

## 🟡 Module 3: Dashboard UI (`apps/web/`)

### Hoàn thành
- [x] AuthContext & API Client
- [x] Login & Knowledge Base
- [x] **TASK-01**: `/dashboard/database`, `/dashboard/keys`, `/dashboard/settings` đã code xong.
- [x] **TASK-12**: `/register` trang đăng ký đã hoàn thiện.

---

## 📋 Task Files — Thứ tự ưu tiên (Cập nhật 31/03)

| Thứ tự | File | Mô tả | Độ khó | Trạng thái |
|--------|------|-------|--------|------------|
| 1 | `TASK-05` | E2E Testing (Verify toàn bộ flow) | Trung bình | 🆕 New |
| 2 | `TASK-02` | Widget API verify (sau fix) | Trung bình | ⏳ Todo |
| 3 | `TASK-13` | Production SSL & Hardening | Khó | ⏳ Todo |
| 4 | `TASK-03` | SSE streaming e2e | Khó | ⏳ Todo |
| 5 | `TASK-06` | RAG/SQL improvements | Khó | ⏳ Todo |

---

## Lịch sử cập nhật

| Ngày | Cập nhật |
|------|---------|
| 2026-03-31 | Hoàn thành TASK-14: Nâng cấp Text-to-SQL (Production-ready). |
| 2026-03-31 | Khởi động TASK-14: Nâng cấp Text-to-SQL dựa trên mẫu ai-engine_2. |
| 2026-03-31 | Hoàn thành TASK-08 & TASK-11. Hệ thống đạt trạng thái E2E Ready. |
| 2026-03-30 | Cập nhật tiến độ 75%; thêm TASK-11, 12, 13; xác nhận TASK-07, 09, 10 hoàn thành. |
