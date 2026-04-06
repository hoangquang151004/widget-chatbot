# AGENTS.md — Hướng dẫn cho AI Agent

> Dành cho Cursor, Claude Code, Copilot và các AI agent khác làm việc trên dự án.
> Đọc kỹ trước khi thực hiện bất kỳ thay đổi nào.
> **Cập nhật**: 2026-04-03 — Thêm context Phase 6 (AI Engine Bug Fixes)

---

## Tổng quan kiến trúc

```
D:\widget_chatbot\
├── apps/
│   ├── api/          ← FastAPI backend (Python 3.11+) — PORT 8001
│   ├── web/          ← Next.js 14 Dashboard (App Router) — PORT 3000
│   └── widget-sdk/   ← Vanilla JS widget script (Vite IIFE build)
├── docs/             ← Tài liệu thiết kế gốc
├── fix_bug/fig_bug_2/ ← Task Phase 6 (BUG-AI-01..03): task_bug_*.md
├── tasks/            ← Task phase 1–5 (task_phase_*.md)
├── implementation_plan.md ← Kế hoạch tổng hợp (đồng bộ với repo)
└── docker-compose.yml
```

---

## Stack & Phiên bản

| Layer        | Công nghệ                             | Ghi chú                                       |
| ------------ | ------------------------------------- | --------------------------------------------- |
| Backend      | FastAPI + Python 3.11                 | `apps/api/`                                   |
| ORM          | SQLAlchemy 2.x async + Alembic        | PostgreSQL                                    |
| AI / LLM     | Gemini (model từ `core/config.py` → `GEMINI_MODEL`) | `GEMINI_API_KEY`         |
| Embedding    | `EMBEDDING_MODEL` trong config (Gemini) | `EMBEDDING_DIM` (vd. 3072) — dùng cho vector `gemini-dense` |
| Vector DB    | Qdrant                                | Hybrid: Dense (gemini-dense) + Sparse (BM25)  |
| Orchestrator | LangGraph                             | `loader→classifier→[rag\|sql\|general]→saver` |
| Worker       | Celery + Redis                        | Document ingestion                            |
| Session      | Redis                                 | Conversation memory (7 ngày TTL)              |
| Frontend     | Next.js 14 App Router + Tailwind      | `apps/web/`                                   |
| Widget       | Vanilla JS IIFE bundle                | `apps/widget-sdk/`                            |

---

## Schema v2 (hiện tại — đã stable)

```
tenants                     ← core account (id, name, email, plan, is_active)
tenant_widget_configs       ← 1-1 với tenant (bot_name, primary_color, greeting...)
tenant_ai_settings          ← 1-1 với tenant (system_prompt, is_rag_enabled, is_sql_enabled, temperature, max_tokens)
tenant_keys                 ← 1-N với tenant (key_type: public|admin, key_value, is_active)
tenant_allowed_origins      ← 1-N với tenant (origin, note)
tenant_databases            ← 1-1 với tenant (db_type, host, port, db_name, encrypted credentials)
tenant_documents            ← 1-N với tenant (filename, file_size, status: pending|processing|done|error)
chat_sessions               ← 1-N với tenant (visitor_id, is_active, message_count)
chat_messages               ← 1-N với chat_session (role: user|assistant, content, intent, sql_query)
chat_analytics              ← aggregated daily stats
```

---

## Auth Model (2-key system)

```
public_key  (pk_live_...)  → Nhúng widget vào trang khách
                             Chỉ gọi POST /api/v1/chat và GET /api/v1/chat/config
                             Bắt buộc kiểm tra Origin header

admin_key   (sk_live_...)  → Dùng trong Dashboard
                             Gọi được /api/v1/admin/* và /api/v1/files/*
                             KHÔNG bao giờ lộ ra widget
```

Middleware: `apps/api/api/middleware.py`
Header: `Authorization: Bearer <token>` (JWT cho admin) hoặc `X-Widget-Key: <pk_live_...>` (public)

---

## Cấu trúc Backend (`apps/api/`)

```
apps/api/
├── main.py
├── api/
│   ├── middleware.py          # SecurityMiddleware: JWT auth + public key + origin check
│   └── v1/
│       ├── admin.py           # /register /login /me /widget /ai-settings /keys /origins /billing /database
│       ├── chat.py            # /config /test + POST/GET /stream
│       └── files.py           # /upload /list /{id} /status/{id}
├── ai/
│   ├── orchestrator.py        # LangGraph graph (loader→classifier→[rag|sql|general]→saver)
│   ├── rag_agent.py           # RAG: reformulate → Qdrant search → Gemini generate
│   ├── sql_agent.py           # Text-to-SQL: schema → gen → execute
│   ├── vector_store.py        # SaaSVectorStore: Qdrant hybrid (Dense+BM25)
│   ├── memory.py              # RedisConversationMemory (tenant+session scoped)
│   ├── llm.py                 # GeminiManager singleton
│   ├── base_agent.py          # AgentResponse schema
│   └── sql/
│       ├── generator.py
│       ├── executor.py
│       ├── formatter.py
│       ├── schema_loader.py
│       └── few_shot_examples.json
├── core/
│   ├── config.py              # Settings (pydantic-settings, .env)
│   ├── security.py            # AES-256-GCM, JWT, password hash
│   └── rate_limit.py
├── db/
│   ├── session.py             # AsyncSession factory
│   └── tenant_db.py           # TenantEngineManager (decrypt creds → engine pool)
├── models/                    # SQLAlchemy ORM (10 bảng)
│   ├── base.py
│   ├── tenant.py
│   ├── widget_config.py
│   ├── ai_settings.py
│   ├── tenant_key.py
│   ├── allowed_origin.py
│   ├── tenant_db_config.py
│   ├── document.py
│   └── chat.py
└── worker/
    ├── celery_app.py
    └── tasks/document_tasks.py
```

---

## Phase 6 — Đã xử lý (2026-04-03)

> Spec và checklist kiểm thử: `task_bug_01_*.md` … `task_bug_03_*.md`, [implementation_plan.md](../../implementation_plan.md).

| Bug       | File                                    | Trạng thái |
| --------- | --------------------------------------- | ---------- |
| BUG-AI-01 | `ai/orchestrator.py`                    | Đã thêm `settings_loader` + routing theo flag |
| BUG-AI-02 | `ai/vector_store.py`                    | Đã bật hybrid RRF + fallback dense |
| BUG-AI-03 | `ai/orchestrator.py`, `ai/rag_agent.py` | Đã dùng `system_prompt` từ DB |

---

## Conventions & Rules

### Python (apps/api)

- Dùng `async/await` cho tất cả DB và I/O
- SQLAlchemy 2.x: `async with async_session() as session:`
- Pydantic v2 cho request/response schemas
- Mọi DB query của tenant **bắt buộc** filter theo `tenant_id`
- SQL agent chỉ cho phép SELECT — không INSERT/UPDATE/DELETE/DROP
- Không bao giờ log raw password, API key, hoặc nội dung hội thoại

### TypeScript (apps/web)

- App Router: Server Components mặc định, `"use client"` khi cần
- Dùng `useApi()` hook để gọi backend
- Không hardcode API URL — dùng `process.env.NEXT_PUBLIC_API_URL`

### Khi sửa AI Engine

- Sau khi sửa `orchestrator.py` → test với `POST /api/v1/chat/stream` + `X-Widget-Key`
- Sau khi sửa `vector_store.py` → test search bằng `debug_rag.py` ở root
- Không thay đổi schema Qdrant collection đang có data (chỉ sửa query method)
- Mọi thay đổi AI Engine phải backward compatible (không break widget đang chạy)

---

## Workflow khi fix bug AI

1. Đọc task file trong `fix_bug/fig_bug_2/` và `implementation_plan.md` (Phase 6)
2. Sửa file theo hướng dẫn
3. Restart backend: `uvicorn main:app --reload --port 8001`
4. Test theo phần "Kiểm tra" trong task file
5. Cập nhật `PROGRESS.md` (đánh dấu bug là FIXED)

---

## Chạy local

```bash
# Infrastructure
docker-compose up -d redis qdrant

# Backend (port 8001)
cd apps/api
.venv\Scripts\python -m uvicorn main:app --reload --port 8001

# Frontend (port 3000)
cd apps/web
npm run dev

# Celery worker (document processing)
cd apps/api
.venv\Scripts\celery -A worker.celery_app worker --loglevel=info
```

Health check: `GET http://localhost:8001/api/health/detailed`

---

## Không làm những điều này

- ❌ Hardcode `tenant_id` hoặc API keys trong code
- ❌ Thêm `allow_origins=["*"]` trong production
- ❌ Dùng `print()` để debug — dùng `logging`
- ❌ Commit file `.env` lên git
- ❌ Chạy SQL INSERT/UPDATE/DELETE qua SQL agent của tenant
- ❌ Xóa hoặc recreate Qdrant collection khi đang có data (gây mất vector)
- ❌ Thay đổi LangGraph graph structure mà không test end-to-end
- ❌ Trả về raw exception message cho user cuối (luôn wrap thành friendly message)
