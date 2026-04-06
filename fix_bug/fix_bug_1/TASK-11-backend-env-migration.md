# TASK-11: Backend Environment & Alembic Migration

## 🎯 Mục tiêu
Cấu hình môi trường backend để kết nối database và thiết lập hệ thống migration tự động bằng Alembic.

## 📋 Danh sách công việc
1. [ ] **Cấu hình `.env`**:
   - Điền `POSTGRES_SERVER=localhost` (hoặc tên service trong docker).
   - Kiểm tra các biến môi trường khác (`REDIS_HOST`, `QDRANT_HOST`).
2. [ ] **Khởi tạo Alembic**:
   - Chạy `alembic init alembic` trong `apps/api/db`.
   - Cấu hình `alembic.ini` để trỏ đúng đường dẫn.
   - Chỉnh sửa `env.py` của Alembic để nhận diện các SQLAlchemy models.
3. [ ] **Migration đầu tiên**:
   - Chạy `alembic revision --autogenerate -m "Initial schema"`.
   - Kiểm tra file migration tạo ra.
   - Thực thi migration: `alembic upgrade head`.
4. [ ] **Seed Data**:
   - Viết hoặc chạy script `scripts/seed_tenant.py` để tạo tenant test đầu tiên.

## 🧪 Kiểm tra
- Chạy backend và kiểm tra log xem có lỗi kết nối DB không.
- Kiểm tra bảng trong PostgreSQL (ví dụ dùng `psql` hoặc DBeaver).
