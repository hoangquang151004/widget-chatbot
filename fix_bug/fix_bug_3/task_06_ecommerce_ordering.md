# TASK-06: E-commerce / Ordering (Epic tùy chọn)

> **Ưu tiên:** Tùy sản phẩm — không bắt buộc cho mọi tenant. Không đặt mức "Cao" mặc định trong lộ trình release chung.
>
> **Xung đột kiến trúc:** [AGENTS.md](../../AGENTS.md) quy định SQL agent **chỉ SELECT**. Mở **INSERT** tự do qua Text-to-SQL là rủi ro bảo mật (prompt injection, quyền DB thực tế, audit). Nếu triển khai TASK-06, cần **cập nhật AGENTS.md** và thiết kế write-path **tách biệt** pipeline sinh SQL tự do.

## 1. Vấn đề nghiệp vụ
Một số khách muốn chuyển đổi (conversion) trên chatbot: thu thập đơn hàng / lead, không chỉ đọc dữ liệu.

## 2. Mục tiêu (nếu được duyệt vào scope)
- Thu thập thông tin đơn hàng (sản phẩm, số lượng, liên hệ).
- Ghi đơn an toàn vào hệ thống của tenant (DB riêng hoặc API nội bộ của họ — ưu tiên cách có kiểm soát).
- Widget hiển thị xác nhận (card / trạng thái) thay vì chỉ text thuần.

## 3. Hướng thiết kế đề xuất (an toàn)
1. **Không** nới Text-to-SQL để LLM sinh `INSERT` tùy ý.
2. **Tool / endpoint chuyên biệt:** tham số cố định (Pydantic), validate server-side, idempotency key, optional xác nhận 2 bước từ người dùng.
3. **Quyền DB:** connection hoặc role chỉ cho phép ghi vào bảng đã thỏa thuận (hoặc gọi stored procedure đã review) — không dùng user DB đầy quyền cho widget.
4. **Widget:** component "Order card" / success state; **Notification:** email/webhook cho tenant admin (tuỳ cấu hình).

## 4. Định nghĩa hoàn thành (DoD) — chỉ áp dụng khi epic được gắn milestone
- [ ] Luồng đặt hàng không phụ thuộc LLM sinh SQL thô.
- [ ] Có test bảo mật cơ bản (validation, từ chối field lạ, rate limit theo session).
- [ ] Tài liệu vận hành và ràng buộc AGENTS.md đồng bộ với implementation.

## 5. Tài liệu cũ (tham khảo — không khuyến nghị copy nguyên xi)
Các bước kiểu "mở INSERT vào bảng `orders` trong SQL Agent" trong bản nháp trước **được thay thế** bằng mục 3 ở trên.
