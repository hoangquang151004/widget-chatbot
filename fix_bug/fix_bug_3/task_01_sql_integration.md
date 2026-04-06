# TASK-01: SQL Agent Integration & Guarding

## 1. Vấn đề
Hiện tại SQL Agent đã có pipeline cơ bản nhưng việc tích hợp vào Orchestrator cần được củng cố:
- Nếu khách bật `is_sql_enabled` nhưng chưa điền DB credentials, hệ thống có thể bị crash hoặc trả lỗi không thân thiện.
- Pipeline Text-to-SQL cần được tối ưu để hiểu đúng schema đặc thù của từng tenant.

## 2. Mục tiêu
- **Guarding:** Orchestrator phải tự động bỏ qua SQL Node nếu thiếu cấu hình DB, bất kể flag `is_sql_enabled` có bật hay không.
- **Reliability:** Đảm bảo SQL Agent hoạt động ổn định với các database PostgreSQL/MySQL từ xa của khách hàng.

## 3. Các bước thực hiện
1. [x] Cập nhật `orchestrator.py`: Kiểm tra có bản ghi `tenant_databases` **active** trước khi bật SQL route; `general_node` trả lời thân thiện khi intent SQL nhưng không dùng được (`resolve_sql_route_state`, `tests/test_orchestrator_sql_guard.py`).
2. Cập nhật `sql_agent.py`: Cải thiện câu lệnh System Prompt để hướng dẫn LLM xử lý các schema phức tạp.
3. Thêm log chi tiết cho quá trình Text-to-SQL để dễ dàng debug lỗi cú pháp SQL.
4. Viết test case tích hợp: Giả lập một tenant có cấu hình lỗi và một tenant có cấu hình đúng.

## 4. Định nghĩa hoàn thành (DoD)
- [x] Không vào `sql_node` khi thiếu cấu hình DB (hoặc gói/tắt SQL) — tránh lỗi pipeline thay vì crash.
- [x] Khi người dùng hỏi kiểu SQL nhưng chưa cấu hình DB: thông báo hướng dẫn cấu hình trên Dashboard (thay vì stack trace).
- [x] Unit test `resolve_sql_route_state` (bảng tham số plan / flag / has_db).
