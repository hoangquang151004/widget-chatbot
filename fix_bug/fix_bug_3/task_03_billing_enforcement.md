# TASK-03: Billing, Plan Enforcement & Stripe

## 1. Bối cảnh (đã có trong code)
- Giới hạn theo gói được định nghĩa trong `core/plan_limits.py` và cột `tenants.plan` (chuỗi: `starter`, `pro`, `enterprise`, `enterprise_pro`) — **không** dùng `plan_id`.
- **Đã thực thi:**
  - Upload RAG: số tài liệu tối đa + tổng dung lượng (`api/v1/files.py`).
  - Chat widget: hạn mức tin nhắn AI theo tháng/ngày (`api/v1/plan_enforcement.py` + `chat_quota_exceeded`).

## 2. Phần còn lại (mục tiêu task)
- Thanh toán tự động: **Stripe** (Checkout hoặc Customer Portal) + **webhook** xác thực chữ ký.
- Khi thanh toán / subscription thành công: cập nhật **`tenants.plan`** cho đúng gói.
- Dashboard: thông báo rõ khi gần hoặc đạt hạn mức; CTA nâng cấp (email hỗ trợ hoặc link Stripe tùy cấu hình).

## 3. Các bước thực hiện
1. Thêm biến môi trường Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, v.v.) và module webhook an toàn.
2. Endpoint webhook: xử lý `checkout.session.completed` / `customer.subscription.updated` (tùy mô hình) → `UPDATE tenants SET plan = ... WHERE ...`.
3. (Tuỳ chọn) Lưu `stripe_customer_id` trên tenant nếu cần đồng bộ lâu dài — có thể cần migration Alembic.
4. Frontend billing: hiển thị trạng thái đồng bộ với backend; không hardcode mock sau khi nối API.

## 4. Định nghĩa hoàn thành (DoD)
- [x] Không upload vượt giới hạn số tài liệu / dung lượng theo gói (đã có).
- [x] Không chat widget vượt hạn mức tin nhắn theo gói (đã có).
- [ ] Webhook Stripe hoạt động và cập nhật đúng `tenants.plan` trong DB.
- [ ] Dashboard phản hồi rõ khi chạm hạn mức / sau khi nâng cấp qua Stripe.
