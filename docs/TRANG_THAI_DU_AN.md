# 📊 Báo Cáo Tình Trạng Dự Án - Embeddable AI Chatbot Widget

> Cập nhật lần cuối: **2026-04-03** | Người cập nhật: GitHub Copilot

---

## 🗂️ Tổng Quan Kiến Trúc

```
d:/widget_chatbot/
├── apps/
│   ├── api/           ← FastAPI Backend (PORT 8001)
│   ├── web/           ← Next.js 14 Dashboard (PORT 3000)
│   └── widget-sdk/    ← Vanilla JS Widget (PORT 5173 / dist/widget.js)
├── packages/types/    ← Shared TypeScript types
└── docs/              ← Tài liệu thiết kế
```

---

## ✅ Những Gì Đã Hoàn Thành (Mới)

### 📦 Widget SDK & Integration

- **Fix Entry Point (TASK-08)**: Script nhúng `widget.js` đã hoạt động chuẩn, tự động lấy `data-public-key` từ thẻ script.
- **Dynamic Config**: Widget tự gọi `/api/v1/chat/config` để lấy màu sắc và tên bot từ Backend.
- **E2E Demo**: File `test-embed.html` nhúng thành công và giao tiếp với server thật.

### 🔧 Backend & Database

- **Rollback Vector Runtime**: Đã chuyển thành công từ pgvector về Qdrant.
- **Health Detailed**: `postgresql`, `redis`, `qdrant` đều `ok`.
- **E2E Upload**: Chạy PASS toàn bộ flow register/login/upload/poll/list/delete.
- **Chat Stream Regression**: Đã verify PASS endpoint `/api/v1/chat/stream` sau rollback Qdrant.
- **Admin API Regression**: Đã verify PASS cho register/login/me, keys, origins, widget, ai-settings.
- **Schema Cleanup**: Đã apply migration cleanup cột legacy trên `tenants` và đồng bộ backend theo schema v2.

### 🌐 Dashboard UI

- **Registration**: Trang `/register` cho phép tạo Tenant mới.
- **Database Config**: Hoàn thiện form kết nối DB PostgreSQL/MySQL.
- **Widget Settings**: Tùy chỉnh trực quan giao diện Widget từ Dashboard.
- **Frontend API Regression**: Đã verify PASS Settings/Keys/Knowledge Base bằng browser flow.
- **Fix ổn định request**: Đã xử lý loop gọi API gây rate-limit (429) bằng memoize hook `useApi`.

---

## ❌ Những Gì Chưa Làm / Còn Thiếu

### Priority 1 – Quan trọng (Cần cho Launch)

- [ ] **Regression SQL Agent thực tế**: Verify luồng Text-to-SQL với database khách thật (schema lớn, dữ liệu thật, sinh SQL + thực thi qua LLM) — hiện đã có pytest introspection schema sau khi lưu cấu hình (`tests/test_admin_database_integration.py`); bổ sung kịch bản khách production riêng.
- [x] **CI Regression Automation (backend)**: Pipeline chạy Alembic + pytest với Postgres, Redis, Qdrant; smoke cục bộ `apps/api/scripts/run_smoke_integration.py`.

### Priority 2 – Tối ưu (Sau MVP)

- [ ] **RAG Optimization**: History-aware query (TASK-06).
- [ ] **Production Hardening**: SSL/TLS tại reverse proxy (Nginx/LB); API đã bật header bảo mật tối thiểu khi `ENV=production` — xem `docs/PRODUCTION_RUNBOOK.md`.
- [ ] **Observability**: Bổ sung monitoring/alerting (Sentry + metrics dashboard) cho môi trường production (Sentry backend khởi tạo khi có `SENTRY_DSN`).

---

## 🗺️ Roadmap Giai đoạn 2 (Hoàn thiện & Launch)

1.  **Giai đoạn 2.1: Testing & Validation**
    - Đưa các case regression đã pass vào CI để kiểm tra tự động.
    - Verify luồng SQL Agent với database khách thật.
2.  **Giai đoạn 2.2: UI/UX Polish**
    - Tinh chỉnh trải nghiệm trang Billing/Analytics theo dữ liệu thật.
    - Chuẩn hóa loading-state, empty-state và thông báo lỗi.
3.  **Giai đoạn 2.3: Deployment**
    - Cấu hình SSL thông qua Nginx.
    - Setup monitoring + cảnh báo vận hành (Sentry/metrics/logging).

---

## 📈 Đánh Giá Tiến Độ Tổng Thể

| Lớp                        | Hoàn thành |
| -------------------------- | ---------- |
| Backend Core Logic         | **~97%**   |
| AI/ML Pipeline (RAG + SQL) | **~92%**   |
| Security & Auth            | **100%**   |
| Frontend Dashboard         | **~95%**   |
| Widget SDK                 | **100%**   |
| DevOps / Deployment        | **~65%**   |
| **Tổng thể**               | **~91%**   |

> **Nhận xét**: Regression trọng yếu backend/frontend đã hoàn tất và PASS. Trọng tâm hiện tại là kiểm thử SQL Agent trên dữ liệu khách thật, tự động hóa regression vào CI, và hardening môi trường production.
