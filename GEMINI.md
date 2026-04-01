# Embeddable AI Chatbot Widget - GEMINI.md

## Tổng quan dự án
Hệ thống chatbot AI dạng widget có thể nhúng vào website thông qua script, hỗ trợ đa tenant với các tính năng RAG (truy vấn tài liệu) và Text-to-SQL (truy vấn database khách).

### Công nghệ sử dụng
- **Backend:** FastAPI (Python 3.11+), SQLAlchemy (PostgreSQL), Redis, Celery.
- **Frontend (Web & Dashboard):** Next.js 14 (App Router), Tailwind CSS.
- **Widget SDK:** Vanilla JS (Vite IIFE).
- **AI/ML:** LangChain, Qdrant (Vector DB), OpenAI (GPT-4o).

---

## Cấu trúc thư mục (Monorepo)
- `apps/api/`: Mã nguồn FastAPI backend.
- `apps/web/`: Mã nguồn Next.js cho Dashboard và Chat UI.
- `apps/widget-sdk/`: Mã nguồn Vanilla JS cho script nhúng.
- `packages/types/`: Các TypeScript interfaces dùng chung.
- `docs/`: Tài liệu thiết kế chi tiết.

---

## Hướng dẫn Phát triển

### Quy tắc quan trọng
- **Python:** Luôn sử dụng `.venv/Scripts/python.exe` tại `apps/api/.venv`.
- **Bảo mật:**
    - Sử dụng mô hình 2-key: `public_key` (pk_live_...) và `admin_key` (sk_live_...).
    - Kiểm tra `Origin` header cho mọi request từ widget.
    - Mã hóa DB credentials bằng AES-256-GCM (key trong `APP_ENCRYPTION_KEY`).
- **SQL:** Chỉ cho phép `SELECT`, luôn inject `tenant_id`.

### Lệnh chạy dự án (Dự kiến)
- **Backend:** `cd apps/api && .\.venv\Scripts\python -m uvicorn main:app --reload`
- **Frontend:** `cd apps/web && npm run dev`
- **Shared Types:** `cd packages/types && npm run build`

---

## Trạng thái hiện tại (MVP Phase 1)
- [x] Khởi tạo cấu trúc Monorepo.
- [x] Boilerplate FastAPI Backend (Health check, CORS, Middleware).
- [x] Boilerplate Next.js 14 Frontend.
- [x] Shared TypeScript types.
- [ ] Implement Tenant & Auth logic.
- [ ] Implement RAG Pipeline.
- [ ] Implement Text-to-SQL Agent.
- [ ] Widget SDK development.
