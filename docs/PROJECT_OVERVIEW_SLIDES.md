# 🤖 Embeddable AI Chatbot Widget
## Tổng quan dự án — Tài liệu slide giới thiệu

> **Cập nhật:** 2026-03-31 | **Giai đoạn:** MVP ~85% hoàn thành

---

---

# SLIDE 1 — Vấn đề & Cơ hội

## Bài toán thực tế

Các doanh nghiệp thương mại điện tử, bán lẻ, và dịch vụ đang đối mặt với:

- ❌ **Chi phí nhân lực hỗ trợ khách hàng cao** — cần đội ngũ trả lời 24/7
- ❌ **Tích hợp AI phức tạp** — đòi hỏi dev backend, infra, AI expertise
- ❌ **Chatbot truyền thống** — chỉ trả lời kịch bản cứng, không truy vấn dữ liệu động
- ❌ **Dữ liệu rời rạc** — sản phẩm, đơn hàng, chính sách nằm ở nhiều nguồn khác nhau

## Cơ hội

> **"Sẽ ra sao nếu chỉ cần dán 1 đoạn script là có ngay chatbot AI thông minh, biết hỏi-đáp từ tài liệu NỘI BỘ và truy vấn DATABASE THẬT của khách?"**

---

---

# SLIDE 2 — Giải pháp tổng thể

## Embeddable AI Chatbot Widget (SaaS)

Hệ thống chatbot AI dạng **widget nhúng** — khách hàng chỉ cần dán 1 đoạn `<script>` vào website.

```html
<!-- Tất cả những gì khách hàng cần làm -->
<script
  src="https://cdn.yourapp.com/widget.v2.js"
  data-public-key="pk_live_abc123"
></script>
```

✅ **Không cần backend** — toàn bộ AI xử lý phía nhà cung cấp  
✅ **Không cần viết code** — chỉ cần đăng ký và dán script  
✅ **Dữ liệu riêng, cô lập** — mỗi khách hàng hoàn toàn tách biệt  
✅ **Tích hợp trong < 5 phút**

---

---

# SLIDE 3 — Kiến trúc tổng quan

## Mô hình vận hành (High-level Flow)

```
Khách hàng đăng ký
  └── Cung cấp: DB credentials + tài liệu nội bộ (PDF/Word/TXT)
        └── Nhận về: public_key (pk_live_...) + admin_key (sk_live_...)

Shop của khách (website khách)
  └── Dán <script data-public-key="pk_live_...">
        └── Tải widget.js từ CDN
              └── Tạo iframe → load Next.js Chat App
                    └── Gọi FastAPI Backend
                          ├── Xác thực public_key + kiểm tra Origin
                          ├── RAG Pipeline → Tìm trong tài liệu nội bộ
                          ├── Text-to-SQL → Truy vấn DB thật của khách
                          └── Stream kết quả về widget (SSE)

Dashboard Admin
  └── Dùng admin_key để:
        ├── Upload/quản lý tài liệu RAG
        ├── Cấu hình kết nối Database
        ├── Tùy chỉnh giao diện Widget
        └── Xem thống kê hội thoại
```

---

---

# SLIDE 4 — Stack công nghệ

## Technology Stack

| Layer | Công nghệ | Ghi chú |
|---|---|---|
| **Widget SDK** | Vanilla JS (Vite IIFE) | < 50KB gzip, không ảnh hưởng trang host |
| **Chat UI & Dashboard** | Next.js 14 (App Router) + Tailwind CSS | Chạy trong iframe, server-side render |
| **Backend API** | FastAPI (Python 3.11+) | Async, stateless, scale ngang |
| **AI / RAG** | LangChain + Qdrant + OpenAI | GPT-4o + text-embedding-3-small |
| **System Database** | PostgreSQL 15+ | Multi-tenant, row-level isolation |
| **Cache / Session** | Redis 7+ | Session, rate limit, origin cache |
| **Background Worker** | Celery + Redis broker | Xử lý document ingestion bất đồng bộ |
| **Reverse Proxy** | Nginx | Phân phối widget.js, load balancing |
| **Containerization** | Docker Compose | Deploy toàn bộ hệ thống bằng 1 lệnh |
| **Mã hóa** | AES-256-GCM | Mã hóa DB credentials của khách |

---

---

# SLIDE 5 — Cấu trúc Monorepo

## Tổ chức thư mục

```
widget_chatbot/              ← Monorepo root
├── apps/
│   ├── api/                 ← FastAPI Backend (PORT 8001)
│   │   ├── ai/              → RAG, SQL Agent, Intent Router
│   │   ├── api/             → Routers: chat, admin, documents, config
│   │   ├── core/            → Security, encryption, config
│   │   ├── models/          → SQLAlchemy models
│   │   ├── worker/          → Celery tasks (document ingestion)
│   │   └── main.py          → App entry point
│   │
│   ├── web/                 ← Next.js 14 Dashboard (PORT 3000)
│   │   └── src/
│   │       ├── app/(dashboard)/   → Login, Register, Settings
│   │       └── app/widget/        → Chat UI trong iframe
│   │
│   └── widget-sdk/          ← Vanilla JS Widget (dist/widget.js)
│       └── src/
│           ├── sdk.js        → Entry point, init config
│           └── widget.js     → Shadow DOM, iframe, launcher
│
├── packages/types/          ← Shared TypeScript types
├── docs/                    ← Tài liệu thiết kế chi tiết
├── nginx/                   ← Cấu hình Nginx
└── docker-compose.yml       ← Orchestration toàn bộ services
```

---

---

# SLIDE 6 — Bảo mật: Mô hình 2-key

## Thiết kế bảo mật theo pattern Stripe

Hệ thống dùng **cặp key Publishable + Secret** — an toàn dù public_key lộ ra HTML:

| | `public_key` (`pk_live_...`) | `admin_key` (`sk_live_...`) |
|---|---|---|
| **Đặt ở đâu** | Script nhúng trên shop (public) | Dashboard admin (private) |
| **Lộ ra HTML** | ✅ Có — bình thường | ❌ Không bao giờ |
| **Quyền** | Chỉ gọi `/api/chat` | Toàn bộ API (upload, thống kê, cấu hình) |
| **Rate limit** | 60 req/phút | 20 req/phút |

## 3 lớp bảo mật

```
Lớp 1: public_key    → xác định đây là tenant nào
Lớp 2: Origin check  → chỉ domain đã đăng ký mới gọi được (browser không thể giả Origin)
Lớp 3: Rate limiting → chống abuse, bảo vệ chi phí AI
```

> **Lý do public_key lộ ra không sao:** Backend bắt buộc kiểm tra `Origin` header — chỉ domain đã đăng ký mới gọi được API. JavaScript không thể giả mạo header Origin.

---

---

# SLIDE 7 — Tính năng lõi: RAG Pipeline

## Truy vấn tài liệu nội bộ (Retrieval-Augmented Generation)

### Khả năng hỗ trợ
- 📄 **PDF** — bao gồm PDF có bảng, heading lồng nhau
- 📝 **Word (.docx)** — giữ nguyên cấu trúc heading
- 📃 **Plain text (.txt)**

### Quy trình ingestion (Celery worker)

```
Upload file
    ↓
Parse (PyMuPDF / python-docx)
    ↓
Split thành chunks:
    ├── Parent chunk: 1000 tokens (ngữ cảnh rộng)
    └── Child chunk:  200 tokens  (tìm kiếm chính xác)
    ↓
Embed bằng text-embedding-3-small (batch)
    ↓
Upsert vào Qdrant
    collection = "tenant_{tenant_id}"  ← hoàn toàn cô lập mỗi tenant
```

### Tìm kiếm khi chat
- Embed câu hỏi → Tìm top-5 child chunks trong Qdrant
- Fetch parent chunks để mở rộng ngữ cảnh
- GPT-4o tổng hợp câu trả lời + trả về nguồn tài liệu (tên file, trang)
- **Mục tiêu hiệu năng:** Qdrant query < 300ms, TTFT < 800ms

---

---

# SLIDE 8 — Tính năng lõi: Text-to-SQL Agent

## Truy vấn Database thật của khách hàng

### Ý tưởng
Khách hàng cung cấp credentials DB của họ → AI tự động sinh SQL → thực thi → trả kết quả trực quan trong chat.

### Quy trình

```
Câu hỏi: "Doanh thu tháng này bao nhiêu?"
    ↓
LLM đọc schema_cache (cấu trúc bảng đã lưu sẵn)
    ↓
Gen SQL:
  SELECT SUM(total_amount) FROM orders
  WHERE created_at >= '2026-03-01'
    ↓
Validate: chỉ cho phép SELECT — chặn INSERT/UPDATE/DELETE/DROP
    ↓
Decrypt credentials DB → kết nối DB khách
    ↓
Thực thi query → lấy kết quả
    ↓
Chọn Rich Component phù hợp (chart_bar, order_history...)
```

### Bảo mật
- ✅ Credentials mã hóa **AES-256-GCM** trong DB hệ thống
- ✅ Chỉ cho phép SELECT trên `allowed_tables` (whitelist)
- ✅ Hỗ trợ **PostgreSQL** và **MySQL**

---

---

# SLIDE 9 — Rich Component System

## Hiển thị dữ liệu có cấu trúc ngay trong chat

Thay vì trả về text thuần, widget render các **component tương tác** trực tiếp.

| Component | Điều kiện kích hoạt | Giao diện |
|---|---|---|
| `product_grid` | "tìm sản phẩm", "xem áo" | Card ảnh + tên + giá + nút Thêm giỏ |
| `cart_summary` | "xem giỏ hàng" | Danh sách, tổng tiền, nút Checkout |
| `chart_bar` | "doanh thu", "thống kê" | Biểu đồ cột (Recharts) |
| `chart_line` | "xu hướng", "theo thời gian" | Biểu đồ đường |
| `order_history` | "lịch sử đơn hàng" | Bảng đơn hàng + trạng thái màu |
| `payment_form` | "thanh toán" | Form thanh toán ngay trong chat |
| `invoice` | "xuất hóa đơn" | Hóa đơn có thể in / export PDF |
| `text_markdown` | Mọi câu trả lời text | Markdown renderer (bold, code, table) |

### Luồng dữ liệu

```
Backend trả về JSON:
{
  "message": "Đây là các sản phẩm phù hợp:",
  "component": {
    "type": "product_grid",
    "data": [{ "name": "Áo thun đen", "price": 299000, ... }]
  }
}
    ↓
SSE stream về widget
    ↓
ComponentRenderer → chọn đúng component từ Registry → render
```

---

---

# SLIDE 10 — Dashboard Admin

## Công cụ quản lý toàn diện cho khách hàng

Được xây dựng bằng **Next.js 14** — truy cập bằng `admin_key`.

### Các tính năng

| Module | Chức năng |
|---|---|
| **📚 Knowledge Base** | Upload tài liệu RAG (PDF/Word/TXT), xem trạng thái ingestion (pending → done), xoá tài liệu |
| **🗄️ Database Config** | Thêm/sửa DB credentials (PostgreSQL/MySQL), test kết nối, xem schema cache |
| **🔑 API Keys** | Xem public_key, copy snippet nhúng sẵn, rotate keys |
| **🎨 Widget Settings** | Tùy màu sắc, vị trí, lời chào, tên bot, quản lý allowed origins |
| **📊 Analytics** | Số hội thoại, intent phổ biến, component hay dùng, avg latency |

### Snippet nhúng (tự động sinh)

```html
<script
  src="https://cdn.yourapp.com/widget.v2.js"
  data-public-key="pk_live_abc123"
  data-position="bottom-right"
  data-primary-color="#2563eb"
></script>
```

---

---

# SLIDE 11 — Thiết kế Database

## Sơ đồ quan hệ (PostgreSQL 15+)

```
tenants
  ├──< tenant_keys            (public_key + admin_key)
  ├──1 tenant_configs         (cấu hình widget: màu, logo, lời chào)
  ├──< tenant_allowed_origins (domain được phép gọi API)
  ├──< tenant_databases       (DB credentials — mã hóa AES-256)
  ├──< tenant_documents       (tài liệu RAG + trạng thái ingestion)
  ├──< chat_sessions
  │       └──< chat_messages  (nội dung + intent + component data)
  └──< chat_analytics         (thống kê tổng hợp theo ngày)
```

### Bảo mật dữ liệu
- `db_user_enc`, `db_password_enc` → **AES-256-GCM**, key trong env
- Mọi query đều có `WHERE tenant_id = ?` → không bao giờ cross-tenant
- Alembic migration cho mọi thay đổi schema

### Schema tổng hợp

| Bảng | Mô tả |
|---|---|
| `tenants` | Core — thông tin khách hàng |
| `tenant_keys` | Public key + Admin key (index trên `key_value`) |
| `tenant_allowed_origins` | Whitelist domain — bảo mật CORS |
| `tenant_configs` | Cấu hình giao diện widget |
| `tenant_databases` | DB credentials (enc) + schema cache |
| `tenant_documents` | Tài liệu RAG + trạng thái ingestion |
| `chat_sessions` | Phiên hội thoại theo visitor |
| `chat_messages` | Tin nhắn + intent + component data + latency |
| `chat_analytics` | Aggregate theo ngày (Celery beat) |

---

---

# SLIDE 12 — DevOps & Triển khai

## Docker Compose — Triển khai bằng 1 lệnh

```
docker compose up -d
```

### Các services

| Service | Image | Port | RAM limit |
|---|---|---|---|
| `postgres` | postgres:15-alpine | 5432 | 512MB |
| `redis` | redis:7-alpine | 6379 | 256MB |
| `qdrant` | qdrant/qdrant:v1.8.3 | 6333 | 512MB |
| `api` (FastAPI) | build từ `apps/api` | 8001 | 1GB |
| `worker` (Celery) | build từ `apps/api` | — | 512MB |
| `web` (Next.js) | build từ `apps/web` | 3000 | 512MB |
| `nginx` | nginx:1.25-alpine | 80 | 64MB |

### Dependency chain

```
postgres + redis + qdrant
    ↓ (healthcheck)
api (FastAPI)
    ↓ (healthcheck)
worker (Celery) + web (Next.js)
    ↓
nginx (reverse proxy)
```

### CI/CD Pipeline (GitHub Actions)
- `.github/workflows/` — Linting, testing, build, deploy tự động

---

---

# SLIDE 13 — Luồng dữ liệu end-to-end

## Từ câu hỏi đến câu trả lời (E2E Flow)

```
1. User gõ: "Áo thun size M còn hàng không?"
       ↓
2. POST /api/v1/chat
   Header: X-Widget-Key: pk_live_xxx
   Header: Origin: https://shop-khach.com
       ↓
3. SecurityMiddleware:
   ├── Tìm tenant theo public_key
   ├── Kiểm tra Origin trong allowed_origins (Redis cache)
   └── Rate limiting (60 req/phút)
       ↓
4. Intent Router (GPT-4o classify):
   → Intent = "sql"  (hỏi về tồn kho → cần DB)
       ↓
5. SQL Agent:
   ├── Đọc schema_cache: bảng "products" có cột "stock", "size", "name"
   ├── Gen SQL: SELECT name, stock FROM products WHERE size='M' AND category='t-shirt'
   ├── Validate: chỉ SELECT ✓
   ├── Decrypt DB credentials
   └── Execute trên DB khách → [{ "Áo thun đen": 5 }, { "Áo thun trắng": 0 }]
       ↓
6. Component Selector → type: "product_grid"
       ↓
7. SSE Stream:
   data: {"type": "text", "chunk": "Đây là các sản phẩm áo thun size M:"}
   data: {"type": "component", "payload": { "type": "product_grid", "data": [...] }}
   data: [DONE]
       ↓
8. Widget render ProductGrid → card sản phẩm với nút "Thêm vào giỏ"
```

---

---

# SLIDE 14 — Tiến độ hiện tại

## Tổng quan tiến độ (2026-03-31)

```
Backend Core     [██████████] 100% ✅  Migration, Auth, Chat API, Admin API
AI/ML Pipeline   [█████████░]  90% 🔄  RAG + SQL + General ổn định
                                         (thiếu: reranker, history-aware RAG)
Security & Auth  [██████████] 100% ✅  2-key, AES-256-GCM, Tenant Isolation
Dashboard UI     [█████████░]  90% 🔄  Register/Database/Keys/Settings
                                         (thiếu: stats cards, chat history viewer)
Widget SDK       [██████████] 100% ✅  Shadow DOM, SSE, Rich Components
DevOps           [██████░░░░]  60% 🔄  Docker ok, DB migrations ok
                                         (thiếu: SSL/TLS, monitoring, production hardening)
─────────────────────────────────────────────
Tổng thể         [█████████░] ~85% 🚀  MVP READY — E2E demo thành công
```

## Đã hoàn thành nổi bật

| Milestone | Mô tả |
|---|---|
| ✅ **Backend Core** | FastAPI + Auth + Security Middleware hoàn chỉnh |
| ✅ **Widget SDK** | Tự parse config từ script tag, Shadow DOM, SSE streaming |
| ✅ **Database** | Schema đầy đủ qua Alembic, tenant mẫu test E2E |
| ✅ **Dashboard** | Login, Register, Knowledge Base, DB Config, Widget Settings |
| ✅ **E2E Demo** | `test-embed.html` nhúng widget và chat thành công với server thật |

---

---

# SLIDE 15 — Roadmap & Kế hoạch tiếp theo

## Giai đoạn 2 — Hoàn thiện & Launch

### 2.1 Testing & Validation (Ưu tiên cao)
- [ ] **E2E Test Suite** — Tự động hóa toàn bộ luồng từ tạo Tenant → Chat
- [ ] **SSE Streaming Stabilization** — Đảm bảo streaming mượt trên Docker/Nginx
- [ ] **SQL Agent** — Verify với database khách thật
- [ ] **Health check** — Fix Redis connection status endpoint

### 2.2 AI Enhancement
- [ ] **History-aware RAG** — Tái cấu trúc câu hỏi dựa vào lịch sử hội thoại
- [ ] **Reranker** — Cross-encoder sau hybrid search (nâng độ chính xác)
- [ ] **Parent Document Retriever** — Cải thiện ngữ cảnh trả về

### 2.3 UI/UX Polish
- [ ] **Dashboard Stats** — Cards tổng số queries, users, intent breakdown
- [ ] **Chat History Viewer** — Xem lại hội thoại chi tiết
- [ ] **Loading States** — UX tốt hơn khi chờ AI

### 2.4 Production Hardening
- [ ] **SSL/TLS** — Cấu hình HTTPS qua Nginx
- [ ] **Monitoring** — Sentry error tracking, structured logging
- [ ] **Widget Versioning** — `widget.v1.js`, `widget.v2.js` không break khách cũ

### V2 (Tương lai xa)
- Voice input/output
- Multi-language auto-detect
- Key rotation API
- Webhook (đơn hàng mới)
- A/B testing components
- Analytics nâng cao

---

---

# SLIDE 16 — Yêu cầu hiệu năng & SLA

## Mục tiêu kỹ thuật

| Metric | Mục tiêu | Tình trạng |
|---|---|---|
| **TTFT** (time to first token) | < 800ms | 🔄 Đang đo |
| **Widget JS bundle** | < 50KB gzip | ✅ Đạt |
| **Qdrant vector search** | < 300ms (top-5) | ✅ Đạt |
| **SQL execution** | < 500ms (simple query) | ✅ Đạt |
| **Origin lookup** | Redis cache — không query DB | ✅ Implemented |
| **Uptime** | ≥ 99.5% | 🔄 Chờ production |

## Scalability Design
- **Stateless API** — scale ngang bằng container (không in-memory state)
- **Session → Redis** — không gắn session với instance cụ thể
- **Celery** — scale worker độc lập với API
- **Qdrant** — distributed vector search

---

---

# SLIDE 17 — Tóm tắt & Điểm mạnh

## Tại sao giải pháp này nổi bật?

### 🔒 Bảo mật từ thiết kế
- Mô hình 2-key (Publishable + Secret) — pattern industry standard
- AES-256-GCM cho credentials nhạy cảm
- Multi-tenant isolation hoàn toàn — không thể cross-tenant
- Origin check bắt buộc — chống embed trái phép

### 🧠 AI thực sự thông minh
- **RAG** — không chỉ keyword search mà semantic search + context-aware
- **Text-to-SQL** — tự sinh SQL từ câu hỏi tự nhiên, không cần schema cứng
- **Rich Components** — không chỉ trả text mà render UI tương tác trong chat

### ⚡ Hiệu năng cao
- Widget JS < 50KB — không làm chậm trang khách
- Redis cache mọi hot path
- SSE streaming — user thấy kết quả ngay lập tức

### 🚀 Tích hợp siêu đơn giản
- 1 đoạn `<script>` — không cần backend, không cần config phức tạp
- Dashboard trực quan — khách tự quản lý không cần support

### 📦 Production-ready Architecture
- Docker Compose — deploy 1 lệnh
- Alembic migration — schema versioning
- Celery worker — document processing không block API

---

*© 2026 — Embeddable AI Chatbot Widget | Tài liệu nội bộ*
