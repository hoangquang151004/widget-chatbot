# Cấu trúc thư mục dự án

## Stack

| Layer | Công nghệ |
|---|---|
| Widget SDK | Vanilla JS (Vite IIFE build) |
| Chat UI + Dashboard | Next.js 14 (App Router) + Tailwind CSS |
| Backend API | FastAPI (Python 3.11+) |
| AI / RAG | LangChain + Qdrant + OpenAI |
| System DB | PostgreSQL 15+ |
| Cache / Session | Redis 7+ |
| Worker | Celery |
| Infra | Docker Compose + Nginx |

---

## Cấu trúc monorepo

```
chatbot-widget/
│
├── apps/
│   ├── widget-sdk/          # Script nhúng (Vanilla JS)
│   ├── web/                 # Next.js (Chat UI + Dashboard)
│   └── api/                 # FastAPI backend
│
├── packages/
│   └── types/               # TypeScript types dùng chung
│
├── infra/
│   ├── nginx/
│   └── docker/
│
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

---

## 1. Widget SDK (`apps/widget-sdk/`)

```
apps/widget-sdk/
├── src/
│   ├── index.ts             # Entry: khai báo ChatbotWidget global
│   ├── init.ts              # ChatbotWidget.init() — tạo iframe + launcher
│   ├── launcher.ts          # Nút chat nổi (FAB), animation open/close
│   ├── iframe.ts            # Tạo, mount, resize iframe
│   ├── bridge.ts            # postMessage host ↔ iframe
│   └── utils.ts
│
├── dist/
│   ├── widget.v2.js         # Output — deploy lên CDN
│   └── widget.v2.js.map
│
├── vite.config.ts           # lib mode, IIFE, single file output
├── tsconfig.json
└── package.json
```

---

## 2. Next.js App (`apps/web/`)

```
apps/web/
├── app/
│   ├── layout.tsx
│   │
│   ├── widget/                          # Chat UI — chạy trong iframe
│   │   ├── page.tsx                     # Đọc token từ URL param, render ChatWindow
│   │   ├── layout.tsx                   # Minimal layout (no header/footer)
│   │   └── components/
│   │       ├── ChatWindow.tsx
│   │       ├── MessageList.tsx
│   │       ├── MessageItem.tsx          # Render text + ComponentRenderer
│   │       ├── InputBar.tsx
│   │       ├── TypingIndicator.tsx
│   │       └── renderer/                # Rich component registry
│   │           ├── index.tsx            # ComponentRenderer — switch by type
│   │           ├── ProductGrid.tsx
│   │           ├── CartSummary.tsx
│   │           ├── ChartBar.tsx
│   │           ├── ChartLine.tsx
│   │           ├── OrderHistory.tsx
│   │           ├── PaymentForm.tsx
│   │           ├── Invoice.tsx
│   │           └── MarkdownBlock.tsx
│   │
│   ├── dashboard/                       # Dashboard admin (dùng admin_key)
│   │   ├── layout.tsx                   # Sidebar + header
│   │   ├── page.tsx                     # Overview / analytics
│   │   ├── documents/
│   │   │   ├── page.tsx                 # Danh sách tài liệu RAG
│   │   │   └── upload/page.tsx
│   │   ├── database/
│   │   │   ├── page.tsx                 # Xem DB credentials đã setup
│   │   │   └── setup/page.tsx           # Form nhập credentials + test kết nối
│   │   ├── settings/
│   │   │   ├── page.tsx                 # Cấu hình widget (màu, logo, greeting)
│   │   │   └── origins/page.tsx         # Quản lý allowed origins
│   │   ├── analytics/
│   │   │   └── page.tsx                 # Thống kê: sessions, intent, component usage
│   │   └── script/
│   │       └── page.tsx                 # Copy script nhúng (public_key)
│   │
│   └── (auth)/                          # Auth cho dashboard
│       ├── login/page.tsx
│       └── register/page.tsx
│
├── lib/
│   ├── api-client.ts        # Fetch wrapper → gọi FastAPI (tự đính kèm key)
│   ├── sse-client.ts        # SSE stream handler
│   └── bridge.ts            # postMessage với host page
│
├── hooks/
│   ├── useChat.ts           # Logic chat chính (messages, streaming)
│   ├── useTenant.ts         # Load tenant config từ public_key
│   └── useSSE.ts            # Subscribe SSE stream
│
├── stores/
│   └── chat.store.ts        # Zustand: messages, loading, session_id
│
├── types/
│   └── index.ts             # Re-export từ packages/types
│
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. FastAPI Backend (`apps/api/`)

```
apps/api/
├── main.py                        # App init, CORS, middleware, routers
│
├── api/
│   ├── deps.py                    # resolve_tenant, get_db, get_redis
│   ├── chat.py                    # POST /api/chat — SSE endpoint
│   ├── documents.py               # CRUD tài liệu RAG
│   ├── database_setup.py          # Nhận credentials, test, lưu
│   ├── config.py                  # GET/PUT cấu hình widget
│   ├── analytics.py               # GET thống kê
│   └── tenant.py                  # Đăng ký tenant, sinh key (internal)
│
├── core/
│   ├── config.py                  # Settings (pydantic-settings, .env)
│   ├── security.py                # resolve_tenant, is_origin_allowed
│   ├── encryption.py              # encrypt_aes256, decrypt_aes256 (AES-256-GCM)
│   └── logging.py                 # Structured log: request_id, tenant_id, latency
│
├── ai/
│   ├── router.py                  # Intent classifier (rag/sql/action/general)
│   ├── rag/
│   │   ├── pipeline.py            # RAG chain: retrieve → rerank → generate
│   │   ├── retriever.py           # Qdrant search + ParentDocumentRetriever
│   │   └── ingestion.py           # Parse → chunk → embed → upsert Qdrant
│   ├── sql/
│   │   ├── agent.py               # Text-to-SQL (LangChain agent)
│   │   ├── executor.py            # Safe execute: validate SELECT, inject tenant_id
│   │   ├── connector.py           # Decrypt credentials → build connection
│   │   └── schema.py              # Introspect + cache schema từ DB khách
│   └── components/
│       ├── selector.py            # Chọn component type từ query + data
│       └── builder.py             # Build JSON payload cho từng component
│
├── models/                        # SQLAlchemy ORM models
│   ├── tenant.py                  # Tenant
│   ├── tenant_key.py              # TenantKey (public + admin)
│   ├── tenant_allowed_origin.py   # TenantAllowedOrigin
│   ├── tenant_config.py           # TenantConfig
│   ├── tenant_database.py         # TenantDatabase (encrypted credentials)
│   ├── tenant_document.py         # TenantDocument
│   ├── chat_session.py            # ChatSession
│   ├── chat_message.py            # ChatMessage
│   └── chat_analytics.py         # ChatAnalytics
│
├── schemas/                       # Pydantic request/response schemas
│   ├── chat.py                    # ChatRequest, ChatResponse, Component
│   ├── document.py                # DocumentUpload, DocumentOut
│   ├── database_setup.py          # TenantDatabaseCreate, TenantDatabaseOut
│   ├── config.py                  # WidgetConfigUpdate
│   ├── analytics.py               # AnalyticsOut
│   └── tenant.py                  # TenantCreate, TenantOut, KeysOut
│
├── db/
│   ├── session.py                 # AsyncSession factory
│   └── migrations/                # Alembic
│       ├── env.py
│       └── versions/
│
├── worker/
│   ├── celery_app.py              # Celery + Redis broker config
│   └── tasks/
│       ├── ingestion.py           # ingest_document task
│       └── analytics.py           # aggregate_analytics task (Celery beat)
│
├── tests/
│   ├── test_auth.py               # Test key + origin check
│   ├── test_chat.py
│   ├── test_rag.py
│   ├── test_sql.py
│   └── conftest.py
│
├── Dockerfile
├── requirements.txt
├── alembic.ini
└── .env.example
```

---

## 4. Shared Types (`packages/types/`)

```
packages/types/
├── src/
│   ├── chat.ts         # Message, Component, ComponentType
│   ├── tenant.ts       # Tenant, WidgetConfig, TenantKeys
│   └── index.ts
└── package.json
```

```ts
// chat.ts
export type ComponentType =
  | 'product_grid' | 'cart_summary'
  | 'chart_bar'    | 'chart_line'
  | 'order_history'| 'payment_form'
  | 'invoice'      | 'text_markdown';

export interface Component {
  type: ComponentType;
  data: unknown;
  meta?: {
    title?: string;
    subtitle?: string;
    actions?: { label: string; event: string }[];
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  component?: Component;
  timestamp: number;
}

// tenant.ts
export interface TenantKeys {
  public_key: string;   // pk_live_xxx — nhúng vào shop
  admin_key: string;    // sk_live_xxx — dashboard admin
}
```

---

## 5. Docker Compose

```yaml
services:

  web:
    build: ./apps/web
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://api:8000

  api:
    build: ./apps/api
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql+asyncpg://chatbot:password@postgres:5432/chatbot
      REDIS_URL: redis://redis:6379/0
      QDRANT_URL: http://qdrant:6333
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      APP_ENCRYPTION_KEY: ${APP_ENCRYPTION_KEY}  # 64-char hex, AES-256
    depends_on: [postgres, redis, qdrant]

  worker:
    build: ./apps/api
    command: celery -A worker.celery_app worker --loglevel=info
    environment:
      DATABASE_URL: postgresql+asyncpg://chatbot:password@postgres:5432/chatbot
      REDIS_URL: redis://redis:6379/0
      QDRANT_URL: http://qdrant:6333
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      APP_ENCRYPTION_KEY: ${APP_ENCRYPTION_KEY}
    depends_on: [redis, postgres, qdrant]

  cdn:
    image: nginx:alpine
    ports: ["80:80"]
    volumes:
      - ./apps/widget-sdk/dist:/usr/share/nginx/html/cdn:ro
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: chatbot
      POSTGRES_USER: chatbot
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]

  qdrant:
    image: qdrant/qdrant:latest
    ports: ["6333:6333"]
    volumes: [qdrant_data:/qdrant/storage]

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
```

---

## 6. Biến môi trường

### `apps/api/.env.example`

```env
APP_ENV=development

# Encryption key cho DB credentials của khách
# Generate: python -c "import secrets; print(secrets.token_hex(32))"
APP_ENCRYPTION_KEY=your_64_char_hex_key_here

# System database
DATABASE_URL=postgresql+asyncpg://chatbot:password@localhost:5432/chatbot

# Cache
REDIS_URL=redis://localhost:6379/0

# Vector store
QDRANT_URL=http://localhost:6333

# OpenAI
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4o

# Storage cho file upload
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./uploads
```

### `apps/web/.env.example`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WIDGET_CDN=http://localhost/cdn
```

---

## 7. Setup môi trường dev

```bash
# 1. Clone & chuẩn bị
git clone https://github.com/your-org/chatbot-widget
cd chatbot-widget
cp apps/api/.env.example apps/api/.env
# → Điền OPENAI_API_KEY, APP_ENCRYPTION_KEY

# 2. Khởi động infrastructure
docker-compose up -d postgres redis qdrant

# 3. Setup API
cd apps/api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000

# 4. Setup Next.js
cd apps/web
npm install
npm run dev   # http://localhost:3000

# 5. Build Widget SDK
cd apps/widget-sdk
npm install
npm run build   # → dist/widget.v2.js

# 6. Serve widget JS
docker-compose up -d cdn
# widget.v2.js có tại: http://localhost/cdn/widget.v2.js
```
