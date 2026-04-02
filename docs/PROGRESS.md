# PROGRESS.md — Theo Dõi Tiến Độ Dự Án
> **Cập nhật**: 2026-03-31 | **Tiến độ tổng**: ~85% (Giai đoạn MVP Ready)

---

## 📊 Dashboard Tiến Độ

```
Backend Core      [██████████] 100% (Hoàn thành Migration & Env)
AI Pipeline       [█████████░] 90%  (RAG/SQL/General ổn định)
Security & Auth   [██████████] 100% (2-key, AES-256-GCM, Tenant Isolation)
Dashboard UI      [█████████░] 90%  (Register/Database/Keys/Settings sẵn sàng)
Widget SDK        [██████████] 100% (Fix Entry Point & Script Tag Parsing)
DevOps            [██████░░░░] 60%  (Docker ok, New DB created, cần SSL)
─────────────────────────────────
Tổng thể          [█████████░] ~85%
```

---

## ✅ Module 1: Backend API — `apps/api/`

### Đã hoàn thành
- [x] FastAPI app setup + CORS + Middleware chain
- [x] `SecurityMiddleware`: 2-key auth, DB tenant lookup, origin validation, rate limiting
- [x] Toàn bộ Admin API (me, database, register, rotate-keys)
- [x] Toàn bộ Chat API (full response & SSE streaming)
- [x] Cấu hình môi trường `.env` thực tế trỏ vào `widget_chatbot_db`
- [x] Alembic migrations (apply thành công ea525aa66ccc)
- [x] Script Seed data (`scripts/seed_tenant.py`) tạo tenant mẫu `pk_live_antigravity_demo_key`

### Còn thiếu
- [ ] Reranker sau hybrid search (cross-encoder)
- [ ] Parent document retriever
- [ ] History-aware RAG (reformulate query)
- [ ] Health detailed (fix Redis connection status)

---

## ✅ Module 3: Dashboard UI — `apps/web/`

### Đã hoàn thành
- [x] Next.js 14 App Router boilerplate
- [x] AuthContext + useApi kết nối Backend cổng 8001
- [x] Login page (Secret Key auth)
- [x] Register page (Tenant creation + Key generation)
- [x] Knowledge Base (Upload/List/Status)
- [x] Database Configuration (PostgreSQL/MySQL support + Test connection)
- [x] API Keys management (Copy snippet + Rotate keys)
- [x] Widget Settings (Color, Position, Placeholder, Origins)

### Còn thiếu
- [ ] Stats cards Dashboard chính (Total queries, users)
- [ ] Chat history viewer chi tiết
- [ ] Loading states tối ưu cho từng trang

---

## ✅ Module 4: Widget SDK — `apps/widget-sdk/` 🚀 MVP READY

### Đã hoàn thành
- [x] Shadow DOM Architecture + Vanilla JS
- [x] **TASK-02: Verify & Fix API Connection**: Đồng bộ header `X-Widget-Key`, hỗ trợ `data-api-url`, fix SSE parsing và render trích dẫn.
- [x] **TASK-08: Fix Entry Point**: Tự động parse config từ script tag (data-public-key).
- [x] **TASK-09: Real Key Setup**: Kết nối đúng Tenant trong DB thật.
- [x] Build pipeline (`dist/widget.js`) hoạt động ổn định.
- [x] SSE Streaming + Rich Components (Table, Chart, Grid).
- [x] Demo nhúng thành công trong `test-embed.html`.

---

## 📅 Lịch Sử Cập Nhật

| Ngày | Cập nhật |
|------|---------|
| 2026-03-31 | Hoàn thành TASK-08 & TASK-11. Hệ thống đạt trạng thái E2E Ready. |
| 2026-03-30 | Cập nhật tiến độ 75%; thêm TASK-11, 12, 13. |
| 2026-03-27 | Tạo PROGRESS.md sau khi review toàn bộ code |
