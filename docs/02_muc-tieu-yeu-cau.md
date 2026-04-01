# Mục tiêu và yêu cầu dự án

## Mục tiêu kinh doanh

- Cung cấp giải pháp chatbot AI dạng SaaS, nhúng được vào bất kỳ website nào.
- Hỗ trợ đa tenant — mỗi khách hàng có dữ liệu, DB, tài liệu RAG hoàn toàn cô lập.
- Giảm thời gian tích hợp của khách hàng xuống dưới 5 phút (chỉ cần dán script).
- Hiển thị dữ liệu có cấu trúc (sản phẩm, đơn hàng, thống kê...) trực tiếp trong widget chat.

## Mục tiêu kỹ thuật

- TTFT (time to first token) < 800ms.
- Widget JS bundle < 50KB gzip — không ảnh hưởng performance trang khách.
- Hỗ trợ SSE streaming cho trải nghiệm chat mượt.
- Stateless API — scale ngang bằng Docker.
- Uptime ≥ 99.5%.

---

## Yêu cầu chức năng

### FR-01: Onboarding tenant

- Khách đăng ký qua form: tên, email, mật khẩu.
- Khách cung cấp DB credentials: host, port, db_name, user, password, db_type, danh sách `allowed_tables`.
- Hệ thống encrypt credentials bằng AES-256-GCM trước khi lưu.
- Hệ thống test kết nối DB — báo lỗi nếu không kết nối được.
- Hệ thống sinh và trả về:
  - `public_key` (`pk_live_...`) — nhúng vào shop widget.
  - `admin_key` (`sk_live_...`) — dùng trong dashboard, không bao giờ để public.
- Khách có thể đăng ký nhiều allowed origins (domain shop).

### FR-02: Script nhúng

- Khách dán một đoạn `<script>` duy nhất với `public_key`.
- Script tự tạo iframe, inject nút launcher vào góc màn hình.
- Hỗ trợ cấu hình: `position`, `primaryColor`, `greeting`, `language`.
- Widget không gây lỗi JS hay xung đột CSS với trang host.
- Toàn bộ UI, AI, logic nằm phía nhà cung cấp — khách không viết gì thêm.

### FR-03: Xác thực và bảo mật

- Mọi request phải có header `X-Widget-Key`.
- Backend kiểm tra key → tìm tenant → kiểm tra `Origin` header.
- `Origin` phải có trong danh sách `allowed_origins` của tenant đó.
- `public_key`: chỉ được gọi `/api/chat`.
- `admin_key`: được gọi toàn bộ API (upload doc, thống kê, cấu hình).
- Rate limiting: 60 req/phút với public_key, 20 req/phút với admin_key.

### FR-04: Chat UI

- Hiển thị lịch sử hội thoại trong phiên.
- Hỗ trợ Markdown (bold, italic, code block, list, bảng).
- Streaming text từng token qua SSE.
- Trạng thái: đang nhập, loading, lỗi kết nối, offline.
- Input multiline, submit bằng Enter hoặc nút gửi.

### FR-05: RAG — Truy vấn tài liệu

- Hỗ trợ: PDF, Word (.docx), plain text.
- Xử lý tài liệu có bảng, heading lồng nhau.
- Chunk đa độ phân giải: parent chunk (1000 token) + child chunk (200 token).
- Mỗi tenant có Qdrant collection riêng — không bao giờ cross-tenant.
- Trả về nguồn tài liệu (tên file, trang) kèm câu trả lời.

### FR-06: Text-to-SQL — Truy vấn DB khách

- Kết nối DB riêng của từng tenant (credentials được decrypt khi dùng).
- LLM gen SQL dựa trên schema cache + câu hỏi người dùng.
- Chỉ cho phép SELECT — chặn INSERT, UPDATE, DELETE, DROP.
- Tự động inject `WHERE tenant_id = ?` nếu bảng có cột `tenant_id`.
- Kết quả SQL được map sang Rich Component phù hợp.
- Hỗ trợ PostgreSQL và MySQL.

### FR-07: Rich Component System

| Component | Trigger | Hiển thị |
|---|---|---|
| `product_grid` | "tìm sản phẩm", "xem áo" | Card ảnh, tên, giá, nút thêm giỏ |
| `cart_summary` | "xem giỏ hàng" | Danh sách, tổng tiền, nút checkout |
| `chart_bar` | "doanh thu", "thống kê" | Biểu đồ cột (Recharts) |
| `chart_line` | "xu hướng", "theo thời gian" | Biểu đồ đường |
| `order_history` | "lịch sử đơn hàng" | Bảng đơn hàng + trạng thái |
| `payment_form` | "thanh toán" | Form thanh toán trong chat |
| `invoice` | "xuất hóa đơn" | Hóa đơn có thể in |
| `text_markdown` | Mọi câu trả lời text | Markdown renderer |

### FR-08: Dashboard admin (dùng admin_key)

- **Documents**: upload, xem danh sách, xoá tài liệu RAG. Xem trạng thái ingestion.
- **Database**: thêm / sửa / test DB credentials. Xem schema cache.
- **Settings**: cấu hình widget (màu, logo, greeting, position). Quản lý allowed origins.
- **Script**: copy đoạn script nhúng với public_key.
- **Analytics**: số cuộc hội thoại, intent phổ biến, component được dùng nhiều nhất, avg latency.

---

## Yêu cầu phi chức năng

### Bảo mật

- DB credentials mã hoá AES-256-GCM, key lưu trong env `APP_ENCRYPTION_KEY`.
- `admin_key` không bao giờ truyền về frontend widget.
- Origin check bắt buộc cho mọi request từ widget.
- SQL agent chạy với DB connection read-only (chỉ SELECT).
- Không log nội dung hội thoại nếu tenant tắt (GDPR-friendly).

### Hiệu năng

- TTFT < 800ms.
- Widget JS < 50KB gzip.
- Qdrant query < 300ms (top-5 chunks).
- SQL execution < 500ms (query đơn giản).
- Origin lookup cache Redis — không query DB mỗi request.

### Khả năng mở rộng

- Stateless FastAPI — scale ngang bằng container.
- Session lưu Redis — không in-memory.
- Celery worker tách riêng cho document ingestion.

### Khả năng bảo trì

- Widget versioning: `widget.v1.js`, `widget.v2.js` — không phá vỡ khách cũ.
- Component type khai báo trong registry — không hard-code if/else.
- Structured logging: request_id, tenant_id, intent, latency_ms.
- Alembic migration cho mọi thay đổi schema.

---

## Ràng buộc kỹ thuật

| Layer | Công nghệ |
|---|---|
| Widget SDK | Vanilla JS (Vite IIFE build) |
| Chat UI + Dashboard | Next.js 14 (App Router) + Tailwind CSS |
| Backend API | FastAPI (Python 3.11+) |
| AI / RAG | LangChain + Qdrant + OpenAI |
| Embedding model | text-embedding-3-small |
| LLM | GPT-4o |
| System DB | PostgreSQL 15+ |
| Cache / Session | Redis 7+ |
| Worker | Celery + Redis broker |
| Containerization | Docker Compose |
| Reverse proxy | Nginx |
