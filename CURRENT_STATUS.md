# Trạng thái Dự án - Cập nhật 01/04/2026

## 1. Khôi phục Frontend (Hoàn thành 100%)
Mã nguồn tại `apps/web/src` đã được khôi phục hoàn toàn từ các bản thiết kế trong thư mục `stitch/`.
- **Cấu trúc**: Chuyển sang Next.js 14 App Router.
- **Styling**: Tailwind CSS được cấu hình khớp hoàn toàn với bảng màu và font chữ của thiết kế gốc.
- **Trang đã triển khai**:
    - Landing Page (`/`)
    - Login Page (`/login`)
    - Dashboard Overview (`/dashboard`)
    - Knowledge Base (`/dashboard/knowledge-base`)
    - Database Config (`/dashboard/database`)
    - API Keys (`/dashboard/keys`)
    - Widget Settings (`/dashboard/settings`)
    - Billing (`/dashboard/billing`)
- **Shared Components**: Sidebar, TopAppBar, DashboardLayout.
- **Trạng thái**: Máy chủ phát triển đang chạy ổn định tại cổng 3000.

## 2. Nhiệm vụ hiện tại: TASK-02 — Widget SDK Verify (Đang thực hiện)
Mục tiêu là đảm bảo Widget SDK kết nối đúng với Backend và xử lý SSE mượt mà.

### Các vấn đề đã phát hiện:
- **Header Mismatch**: Widget đang gửi `X-API-Key`, nhưng TASK-02 yêu cầu `X-Widget-Key`.
- **Attribute Mismatch**: Widget đang đọc `data-api-endpoint`, TASK-02 yêu cầu `data-api-url`.
- **Backend Sync**: Middleware của Backend hiện chỉ nhận `X-API-Key`.

### Kế hoạch tiếp theo:
1. Cập nhật Middleware Backend để chấp nhận `X-Widget-Key`.
2. Cập nhật Widget SDK API Client và Main Logic để đồng bộ header và attribute.
3. Kiểm tra logic parse SSE (Server-Sent Events).
4. Build production và kiểm tra kích thước bundle.

---
**Người thực hiện**: Gemini CLI Agent
