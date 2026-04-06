# TASK-04: Analytics & Usage Dashboard

## 1. Vấn đề
Tenant cần biết chatbot của họ hoạt động hiệu quả ra sao:
- Có bao nhiêu tin nhắn đã được gửi?
- Tỷ lệ tin nhắn được trả lời bởi RAG vs SQL vs General.
- Số lượng token tiêu thụ để ước tính chi phí.
- Hiện tại dữ liệu này đã có trong bảng `chat_analytics` nhưng chưa được hiển thị lên UI.

## 2. Mục tiêu
- Hiển thị các chỉ số quan trọng (KPIs) và biểu đồ xu hướng trên Dashboard của Tenant.

## 3. Các bước thực hiện
1. **API:** Xây dựng endpoint `GET /api/v1/admin/analytics/stats` để lấy dữ liệu tổng hợp.
2. **API:** Xây dựng endpoint `GET /api/v1/admin/analytics/history` để lấy dữ liệu biểu đồ theo thời gian.
3. **Frontend:** Sử dụng thư viện biểu đồ (ví dụ: Recharts hoặc Chart.js) để vẽ biểu đồ đường (Line Chart) cho số lượng tin nhắn.
4. **Frontend:** Hiển thị các thẻ thông số (Cards) ở đầu trang Dashboard Home.

## 4. Định nghĩa hoàn thành (DoD)
- [ ] Dashboard Home hiển thị ít nhất 3 chỉ số: Tổng tin nhắn, Tài liệu đã upload, Token sử dụng.
- [ ] Biểu đồ xu hướng tin nhắn hiển thị đúng dữ liệu thực tế từ DB.
