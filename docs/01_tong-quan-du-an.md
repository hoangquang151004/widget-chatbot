# Tổng quan dự án — Embeddable AI Chatbot Widget

## Giới thiệu

Hệ thống chatbot AI dạng widget có thể nhúng vào bất kỳ website nào thông qua một đoạn script ngắn. Toàn bộ logic AI, giao diện, và dữ liệu đều được xử lý phía nhà cung cấp (SaaS model). Khách hàng không cần tích hợp backend hay xây dựng UI.

Hệ thống hỗ trợ **nhiều tenant** — mỗi khách hàng có dữ liệu hoàn toàn cô lập, được phân biệt bằng cặp **Public Key + Admin Key**.

---

## Mô hình vận hành

```
Khách hàng đăng ký
  └── Cung cấp: DB credentials + tài liệu RAG
        └── Nhận về: public_key (pk_live_...) + admin_key (sk_live_...)

Shop của khách
  └── nhúng <script token="pk_live_...">
        └── tải widget.js từ CDN
              └── tạo iframe → load Next.js App (của nhà cung cấp)
                    └── gọi FastAPI Backend
                          ├── xác thực public_key + Origin
                          ├── RAG Pipeline (Qdrant — collection riêng mỗi tenant)
                          ├── Text-to-SQL (kết nối DB riêng của khách)
                          └── Rich Component Renderer → SSE stream về widget

Dashboard admin của khách
  └── dùng admin_key (sk_live_...) để:
        ├── Upload / quản lý tài liệu RAG
        ├── Xem thống kê hội thoại
        └── Cấu hình giao diện widget
```

---

## Cơ chế bảo mật Key

Hệ thống dùng **2 key** theo pattern Publishable Key + Secret Key (tương tự Stripe):

| | `public_key` (`pk_live_...`) | `admin_key` (`sk_live_...`) |
|---|---|---|
| Đặt ở đâu | Script nhúng trên shop | Dashboard admin của khách |
| Lộ ra HTML | Có — bình thường | Không bao giờ |
| Quyền | Chỉ gọi chat API | Upload tài liệu, thống kê, cấu hình |
| Rate limit | 60 req/phút | 20 req/phút |

**public_key lộ ra không gây rủi ro** vì backend kiểm tra thêm `Origin` header — chỉ domain đã đăng ký mới gọi được API. `Origin` do trình duyệt tự set, JavaScript không thể giả mạo.

```
Lớp 1: public_key    → xác định đây là tenant nào
Lớp 2: Origin check  → chỉ domain đã đăng ký mới gọi được
Lớp 3: Rate limiting → giới hạn request, chống abuse
```

---

## Các thành phần chính

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Widget SDK | Vanilla JS (IIFE bundle) | Script nhúng, tạo iframe |
| Chat UI | Next.js 14 + Tailwind CSS | Giao diện chạy trong iframe |
| Dashboard | Next.js 14 | Quản lý tenant, upload doc, thống kê |
| API Backend | FastAPI (Python 3.11+) | Xử lý AI, query, streaming |
| RAG Pipeline | LangChain + Qdrant | Truy vấn tài liệu (collection per tenant) |
| Text-to-SQL | LangChain + DB của khách | Truy vấn DB riêng từng tenant |
| Rich Components | React components | Hiển thị UI phong phú trong chat |
| Auth / Tenant | 2-key + Origin check | Bảo mật đa tenant |
| System DB | PostgreSQL | Tenant, keys, sessions, analytics |
| Worker | Celery | Document ingestion bất đồng bộ |
| Cache | Redis | Session, rate limit, origin cache |
| CDN | Nginx / Cloudflare | Phân phối widget.js |

---

## Luồng dữ liệu chính

```
1. User gõ tin nhắn trong widget
       ↓
2. POST /api/chat
   Header: X-Widget-Key: pk_live_xxx
   Header: Origin: https://shop-khach.com
       ↓
3. Xác thực key → kiểm tra Origin → load tenant context
       ↓
4. Intent Router phân loại (rag / sql / action / general)
       ↓
4a. RAG    → Qdrant collection của tenant → generate answer + sources
4b. SQL    → gen SQL (tenant-scoped) → execute DB khách → structured data
4c. Action → thực hiện hành động (add to cart, checkout...)
       ↓
5. Component Renderer → { message, component: { type, data } }
       ↓
6. SSE stream → widget render Rich Component tương ứng
```

---

## Luồng onboarding khách hàng

```
1. Khách đăng ký tài khoản (email + mật khẩu)
2. Cung cấp DB credentials:
     host, port, db_name, user, password, allowed_tables[]
3. Upload tài liệu RAG (PDF, Word, TXT)
4. Hệ thống xử lý:
     ├── Encrypt DB credentials (AES-256-GCM) → lưu tenant_databases
     ├── Ingest tài liệu → Celery worker → Qdrant
     └── Sinh public_key + admin_key → lưu tenant_keys
5. Trả về cho khách:
     ├── public_key → nhúng vào shop
     └── admin_key  → dùng trong dashboard
```

---

## Phạm vi MVP

- [ ] Widget SDK (script nhúng + iframe shell)
- [ ] Onboarding: nhận DB credentials + tài liệu, sinh 2 key
- [ ] Auth: 2-key model + Origin check
- [ ] Chat UI với SSE streaming
- [ ] RAG pipeline (PDF, Word, TXT)
- [ ] Text-to-SQL với kết nối DB khách (encrypt credentials)
- [ ] Rich components: product_grid, cart_summary, chart_bar, chart_line, order_history, payment_form
- [ ] Dashboard: upload doc, xem thống kê, cấu hình widget, lấy script nhúng

## Ngoài phạm vi MVP (V2)

- Voice input / output
- Multi-language auto-detect
- Key rotation
- Webhook khi có đơn hàng mới
- A/B testing component
- Analytics nâng cao
