# AGENTS.md — Hướng dẫn cho AI Agent

> File này dành cho Cursor, Claude Code, Copilot và các AI agent khác làm việc trên dự án này.
> Đọc kỹ trước khi thực hiện bất kỳ thay đổi nào.
> **Cập nhật**: 2026-03-30 — Đồng bộ trạng thái mới nhất

---

## Tổng quan kiến trúc

```
D:\widget_chatbot\
├── apps/
│   ├── api/          ← FastAPI backend (Python 3.11+) — PORT 8001
│   ├── web/          ← Next.js 14 Dashboard (App Router) — PORT 3000
│   └── widget-sdk/   ← Vanilla JS widget script (Vite IIFE build)
├── docs/             ← Tài liệu thiết kế gốc
├── fix_bug/          ← AGENTS.md, PROGRESS.md, TASK-*.md
└── docker-compose.yml
```

---

## Stack & Phiên bản

| Layer | Công nghệ | Ghi chú |
|-------|-----------|---------|
| Backend | FastAPI + Python 3.11 | `apps/api/` |
| ORM | SQLAlchemy 2.x async + Alembic | PostgreSQL |
| AI / LLM | Google Gemini 2.5 Flash | `GEMINI_API_KEY` |
| Embedding | `models/text-embedding-004` (Gemini) | 768d |
| Vector DB | Qdrant | Hybrid search: Dense + BM25 |
| Worker | Celery + Redis | Document ingestion |
| Session | Redis | Conversation memory |
| Frontend | Next.js 14 App Router + Tailwind | `apps/web/` |
| Widget | Vanilla JS IIFE bundle | `apps/widget-sdk/` |
| Infra | Docker Compose + Nginx | Production-ready |

---

## Mô hình Auth (2-key system)

```
public_key  (pk_live_...)  → Nhúng trong <script> của khách hàng
                             Chỉ gọi được POST /api/v1/chat
                             Bắt buộc kiểm tra Origin header

secret_key  (sk_live_...)  → Dùng trong Dashboard admin
                             Gọi được toàn bộ /api/v1/admin/* và /api/v1/files/*
                             KHÔNG bao giờ để lộ ra frontend widget
```

Header xác thực: `X-API-Key: <pk_live_... hoặc sk_live_...>`

Middleware xử lý: `apps/api/api/middleware.py`

---

## Cấu trúc Backend (`apps/api/`)

```
apps/api/
├── main.py                   # FastAPI app, CORS, router mount
├── api/
│   ├── middleware.py          # SecurityMiddleware: auth + origin check + rate limit
│   └── v1/
│       ├── admin.py           # /admin/register, /admin/me, /admin/rotate-keys, /admin/database
│       ├── chat.py            # /chat (full response) + /chat/stream (SSE)
│       └── files.py           # /files/upload, /files/list, /files/{id}, /files/status/{id}
├── ai/
│   ├── orchestrator.py        # LangGraph: loader→classifier→[rag|sql|general]→saver
│   ├── rag_agent.py           # RAG: Qdrant search → Gemini generate
│   ├── sql_agent.py           # Text-to-SQL: schema → gen → sanitize → execute
│   ├── vector_store.py        # SaaSVectorStore: Qdrant hybrid (Dense+BM25+RRF)
│   ├── memory.py              # RedisConversationMemory (scoped by tenant+session)
│   ├── llm.py                 # GeminiManager singleton
│   └── rag/
│       └── processor.py       # DocumentProcessor: parse→chunk→embed→upsert
├── core/
│   ├── config.py              # Settings (pydantic-settings, .env)
│   ├── security.py            # AES-256-GCM encrypt/decrypt, key utils
│   └── rate_limit.py          # RateLimiter (Redis-based)
├── db/
│   ├── session.py             # AsyncSession factory
│   └── tenant_db.py           # TenantEngineManager: decrypt credentials → engine pool
├── models/                    # SQLAlchemy ORM models
│   ├── tenant.py              # Tenant (id, name, slug, public_key, secret_key, ...)
│   ├── tenant_db_config.py    # TenantDatabaseConfig (encrypted credentials)
│   ├── document.py            # TenantDocument (ingestion tracking)
│   └── tenant_file.py         # TenantFile
└── worker/
    ├── celery_app.py
    └── tasks/document_tasks.py  # process_document_task (Celery)
```

---

## Cấu trúc Frontend (`apps/web/`)

```
apps/web/src/
├── app/
│   ├── login/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx
│       └── dashboard/
│           ├── page.tsx
│           ├── knowledge-base/page.tsx
│           ├── database/page.tsx
│           ├── keys/page.tsx
│           ├── settings/page.tsx
│           └── billing/page.tsx
├── contexts/AuthContext.tsx
├── lib/api.ts
└── components/
    ├── DashboardHeader.tsx
    └── ui/ (CopyButton, StatusBadge, Modal, Toast, EmptyState)
```

---

## Cấu trúc Widget SDK (`apps/widget-sdk/`)

```
apps/widget-sdk/
├── src/
│   ├── main.js      ← Entry point ESM (dùng qua Vite dev server)
│   ├── widget.js    ← Widget orchestrator (Shadow DOM)
│   ├── loader.js    ← ⚠️ DEPRECATED — KHÔNG DÙNG
│   ├── api/client.js ← Chat API + SSE streaming
│   ├── storage/session.js ← SessionID (localStorage)
│   ├── styles/widget.css ← CSS cho Shadow DOM
│   └── ui/ (bubble.js, window.js, messages.js)
├── dist/
│   └── widget.js    ← ✅ File built IIFE — dùng cho production/test
├── index.html       ← Dev test page (dùng với `npm run dev`)
├── test-embed.html  ← Static test page (dùng với dist/widget.js)
└── vite.config.js
```

**Build**: `npm run build` → `dist/widget.js` (IIFE, ~70-120KB)

---

## ⚠️ WIDGET SDK — Known Bugs & Rules (2026-03-29)

### BUG-01: URL Duplicate `/api/v1` — CRITICAL
`data-api-endpoint` là **base URL, không có path**. `client.js` tự nối `/api/v1/chat`:

```html
✅ ĐÚNG:   data-api-endpoint="http://localhost:8001"
❌ SAI:    data-api-endpoint="http://localhost:8001/api/v1"
           → URL cuối: /api/v1/api/v1/chat → 404
```
Xem: **TASK-07**

### BUG-02: `loader.js` Deprecated — KHÔNG DÙNG
`src/loader.js` hardcode port sai (8000), đọc attribute sai (`data-api-key`). Đã thay bằng `main.js` + `widget.js`. Xem: **TASK-08**

### BUG-03: Public Key Giả Trong Test Files
`pk_live_public_key_123` và `pk_live_TEST_DEMO_KEY_000...` là key fake. Phải tạo tenant thật qua API trước khi test. Xem: **TASK-09**

### BUG-04: `src/main.js` Không Chạy Trực Tiếp
`src/main.js` dùng ES Module imports, chỉ hoạt động qua Vite (`npm run dev`). Khi test HTML tĩnh, dùng `dist/widget.js`. Xem: **TASK-08**

### Rule — Cách nhúng widget đúng chuẩn
```html
<script 
  src="/đường/dẫn/dist/widget.js"
  data-public-key="pk_live_KEY_THẬT"
  data-api-endpoint="http://localhost:8001"
  data-bot-name="Trợ lý AI"
  data-color="#2563eb"
  data-position="bottom-right">
</script>
```

### Rule — Hai cách test widget hợp lệ
```bash
# Cách 1: Dev mode (hot reload, dùng src/)
cd apps/widget-sdk && npm run dev
# Mở http://localhost:5173

# Cách 2: Production test (dùng dist/)
cd apps/widget-sdk && npm run build
# Mở dist/index.html hoặc test-embed.html
# HOẶC: python -m http.server 5500 trong thư mục dist/
```

---

## Biến môi trường

### `apps/api/.env`
```env
APP_ENCRYPTION_KEY=<base64 32-byte key>
POSTGRES_SERVER=localhost          ← ĐỂ TRỐNG LÀ BUG!
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=widget_chatbot
REDIS_HOST=localhost
REDIS_PORT=6379
GEMINI_API_KEY=<your key>
QDRANT_HOST=localhost
QDRANT_PORT=6333
ENV=development
```

### `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## Conventions & Rules

### Python (apps/api)
- Dùng `async/await` cho tất cả DB và I/O operations
- SQLAlchemy 2.x style: `async with async_session() as session:`
- Pydantic v2 models cho request/response schemas
- Không bao giờ log raw password, key, hoặc nội dung hội thoại
- Mọi query DB của tenant phải filter theo `tenant_id`
- SQL agent chỉ cho phép SELECT — không INSERT/UPDATE/DELETE/DROP

### TypeScript (apps/web)
- App Router: Server Components mặc định, Client Components phải có `"use client"`
- Dùng `useAuth()` hook để lấy tenant info và kiểm tra auth
- Dùng `apiFetch()` hoặc `adminApi.*` / `filesApi.*` để gọi backend
- Không hardcode API URL — luôn dùng `process.env.NEXT_PUBLIC_API_URL`

### JavaScript (apps/widget-sdk)
- Vanilla JS, không dùng framework
- Mọi UI phải trong Shadow DOM để tránh conflict CSS với trang host
- Header auth: `X-API-Key: <public_key>` (không phải `X-Widget-Key`)
- Hỗ trợ SSE streaming: parse từng chunk `data: {"chunk": "...", "done": bool}`
- Sau mỗi lần sửa `src/` → phải `npm run build` trước khi test

---

## Workflow khi sửa code

1. **Backend thay đổi schema DB** → tạo Alembic migration: `alembic revision --autogenerate -m "..."` → `alembic upgrade head`
2. **Thêm API endpoint mới** → cập nhật `apps/web/src/lib/api.ts` tương ứng
3. **Thay đổi widget** → `npm run build` trong `apps/widget-sdk/` → test với `dist/index.html`
4. **Sau mỗi task** → cập nhật `fix_bug/PROGRESS.md`

---

## Chạy local

```bash
# Infrastructure
docker-compose up -d postgres redis qdrant

# Backend (port 8001)
cd apps/api
.venv\Scripts\python -m uvicorn main:app --reload --port 8001

# Frontend (port 3000)
cd apps/web
npm run dev

# Widget dev
cd apps/widget-sdk
npm run dev   # hoặc npm run build
```

Health check: `GET http://localhost:8001/api/health`

---

## Không làm những điều này

- ❌ Import bất cứ gì từ `ai-engine/` vào `apps/`
- ❌ Hardcode tenant_id hoặc API keys trong code
- ❌ Thêm `allow_origins=["*"]` trong production
- ❌ Dùng `print()` để debug — dùng `logging`
- ❌ Commit file `.env` lên git
- ❌ Chạy SQL INSERT/UPDATE/DELETE qua SQL agent của tenant
- ❌ Log nội dung hội thoại của user nếu không có sự đồng ý
- ❌ Nhúng `src/loader.js` vào bất kỳ trang nào
- ❌ Truyền `/api/v1` vào `data-api-endpoint` của widget
- ❌ Dùng key fake `pk_live_public_key_123` để test thật
