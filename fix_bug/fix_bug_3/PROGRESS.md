# PROGRESS.md — Lộ trình hoàn thiện dự án (fix_bug_3)

> Cập nhật: 2026-04-06 | Mục tiêu: Production Ready (Sẵn sàng triển khai)
> Trạng thái hiện tại: ~85–90% tính năng lõi; một số hạng mục đã có trong code, cần đồng bộ tài liệu và hoàn thiện phần còn lại.

---

## Tổng quan tiến độ fix_bug_3

| Task ID | Tên Task | Trạng thái | Ưu tiên | Ghi chú ngắn |
|---------|----------|------------|---------|----------------|
| TASK-01 | SQL Agent Integration & Guarding | Một phần / hoàn thiện guard DB | Cao | Đã có plan + `is_sql_enabled`; thêm kiểm tra `tenant_databases` + thông báo khi intent SQL nhưng không dùng được |
| TASK-02 | Production Hardening & SSL | Một phần | Cao | **Rate limit Redis + 429** đã có (`core/rate_limit.py`, middleware). Còn SSL/Let’s Encrypt, HSTS, tách prod env, audit Nginx |
| TASK-03 | Billing & Stripe | Một phần | Trung bình | **Enforcement:** upload (số file + dung lượng) + chat widget (hạn tin nhắn) đã có (`plan_limits`, `files.py`, `plan_enforcement`). **Còn:** Stripe webhook, cập nhật `tenants.plan`, UX “nâng cấp” |
| TASK-04 | Analytics & Usage Dashboard | Todo | Trung bình | `chat_analytics` có model; cần API `admin/analytics/*` + biểu đồ Dashboard |
| TASK-05 | Platform Admin Dashboard | Một phần | Thấp | Schema dùng `tenants.role = 'platform_admin'` (không dùng flag `is_platform_admin`). Còn router/UI/impersonate |
| TASK-06 | E-commerce / Ordering | Todo (epic tùy chọn) | Tùy sản phẩm | **Không** mặc định ưu tiên cao cho mọi tenant. Xem [task_06_ecommerce_ordering.md](task_06_ecommerce_ordering.md) — mâu thuẫn với Text-to-SQL chỉ SELECT trong AGENTS.md nếu mở INSERT tự do |

---

## Chi tiết các hạng mục

### 1. AI Engine & SQL (TASK-01, 06)
- [x] Kiểm tra DB config trước khi coi SQL khả dụng trong Orchestrator (kết hợp plan + `is_sql_enabled` + bản ghi `tenant_databases` active).
- [ ] Tối ưu Few-shot prompt cho SQL Agent dựa trên schema thật của khách.
- [ ] **(TASK-06, tùy chọn):** Luồng đặt hàng an toàn — không mở Text-to-SQL sang INSERT tùy ý; xem task_06.

### 2. Infrastructure & Security (TASK-02)
- [ ] Cấu hình Nginx với SSL (Let's Encrypt).
- [x] Rate limiting tầng API (Redis, phân biệt public/admin key) — đã triển khai.
- [ ] Rà soát thêm Origin validation / header bảo mật theo runbook triển khai.

### 3. Business & Dashboard (TASK-03, 04, 05)
- [ ] Stripe webhook → cập nhật `tenants.plan` (cột string `plan`, không dùng `plan_id`).
- [ ] Biểu đồ tin nhắn / usage trên Dashboard.
- [ ] Platform admin: API + UI (dựa trên `role = platform_admin`).

---

## Nhật ký thay đổi
- **2026-04-06**: Khởi tạo giai đoạn `fix_bug_3` để xử lý các hạng mục cuối cùng trước khi release.
- **2026-04-06**: Đồng bộ PROGRESS với code hiện tại (plan limits, rate limit, schema `plan` / `role`); TASK-06 ghi nhận là epic tùy chọn.
