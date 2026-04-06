# TASK-12: Dashboard Registration Page

## 🎯 Mục tiêu
Xây dựng trang đăng ký (`/register`) để khách hàng mới có thể tạo tenant và nhận API Keys.

## 📋 Danh sách công việc
1. [ ] **Xây dựng UI**:
   - Tạo file `apps/web/src/app/register/page.tsx`.
   - Form gồm: Name, Organization Name, Email, Slug.
2. [ ] **Kết nối API**:
   - Sử dụng endpoint `POST /api/v1/admin/register`.
   - Xử lý trạng thái Loading và Success (hiển thị Keys ngay sau khi đăng ký thành công).
3. [ ] **Validation**:
   - Kiểm tra định dạng slug, email.
   - Hiển thị lỗi từ backend (ví dụ slug đã tồn tại).
4. [ ] **Navigation**:
   - Sau khi đăng ký xong, hướng dẫn user copy Secret Key và chuyển hướng tới Dashboard Login.

## 🧪 Kiểm tra
- Đăng ký thử một tenant mới.
- Kiểm tra database xem tenant mới đã được tạo chưa.
- Thử login bằng Secret Key vừa tạo.
