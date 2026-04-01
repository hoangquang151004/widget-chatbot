---
name: text-to-sql-expert
description: Chuyên gia tối ưu và kiểm soát SQL (PostgreSQL) cho hệ thống đa tenant. Dùng khi cần sinh SQL từ ngôn ngữ tự nhiên, kiểm tra an toàn dữ liệu hoặc sửa lỗi truy vấn.
---

# Text-to-SQL Expert Instruction

Skill này cung cấp các quy tắc và quy trình để đảm bảo câu lệnh SQL được sinh ra là an toàn, chính xác và tối ưu cho hệ thống SaaS đa tenant.

## 1. Quy tắc An toàn Tuyệt đối (Security First)

Mọi câu lệnh SQL được đề xuất PHẢI tuân thủ các điều kiện sau:

- **CHỈ SELECT**: Tuyệt đối không sinh các câu lệnh `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`.
- **CẤM NHIỀU CÂU LỆNH**: Không sử dụng dấu `;` để ngăn cách nhiều câu lệnh. Chỉ cho phép duy nhất một câu lệnh `SELECT`.
- **DANH SÁCH TỪ KHÓA CẤM**:
  `INSERT`, `UPDATE`, `DELETE`, `DROP`, `CREATE`, `ALTER`, `TRUNCATE`, `EXEC`, `EXECUTE`, `MERGE`, `REPLACE`, `CALL`, `GRANT`, `REVOKE`, `LOAD`, `COPY`.

## 2. Quy tắc Phân quyền (Tenant & Role Isolation)

Dựa trên vai trò người dùng (user_role), hãy áp dụng các bộ lọc sau:

- **Employee**: Bắt buộc thêm `WHERE department_id = '<department_id>'`.
- **Leader**: Bắt buộc thêm `WHERE user_id = '<user_id>'` (hoặc logic quản lý tương ứng).
- **Admin**: Được phép truy vấn toàn bộ dữ liệu của tenant hiện tại.

*Lưu ý: Mọi bảng đều phải được JOIN qua các khóa ngoại để đảm bảo tính toàn vẹn dữ liệu.*

## 3. Quy tắc Hiệu năng (Performance Rules)

- **LIMIT**: Mặc định luôn thêm `LIMIT 100` nếu không có yêu cầu cụ thể về số lượng.
- **ALIAS**: Luôn sử dụng Alias cho các bảng (ví dụ: `SELECT u.name FROM users u`).
- **TIMEOUT**: Câu lệnh phải được thiết kế để chạy trong dưới 10 giây. Tránh các JOIN chéo (Cross Join) không cần thiết trên các bảng lớn.

## 4. Quy trình xử lý lỗi (Self-Correction Workflow)

Nếu câu lệnh SQL bị lỗi từ Database, hãy làm theo các bước sau:
1. Đọc kỹ thông báo lỗi (Error Message).
2. Kiểm tra lại tên bảng và tên cột trong [SCHEMA].
3. Kiểm tra các lỗi cú pháp PostgreSQL (ví dụ: dùng nháy đơn cho chuỗi, nháy kép cho tên cột có khoảng trắng).
4. Sửa lại SQL và giải thích lý do sửa lỗi.

## 5. Công cụ hỗ trợ trong Skill

- **Kiểm tra SQL**: Chạy script `scripts/validate_sql.py` để xác thực tính an toàn của câu lệnh trước khi đề xuất.
- **Mẫu Query**: Tham khảo `references/patterns.md` cho các trường hợp truy vấn doanh thu, báo cáo phức tạp.
