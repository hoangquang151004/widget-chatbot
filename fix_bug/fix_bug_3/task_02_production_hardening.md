# TASK-02: Production Hardening & SSL

## 1. Vấn đề
Dự án hiện đang chạy trên Docker Compose với cấu hình mặc định, chưa phù hợp để expose ra internet:
- Chưa có SSL (HTTPS) cho cả API và Dashboard.
- **Rate limiting:** Đã có giới hạn theo **tenant + loại key** (public/admin) qua Redis trong `api/middleware.py` và `core/rate_limit.py` (trả 429). Có thể bổ sung thêm giới hạn theo IP tại Nginx nếu cần.
- Nginx chưa được tối ưu hóa cho hiệu suất và bảo mật.

## 2. Mục tiêu
- Chuyển hệ thống sang trạng thái Production-ready với đầy đủ các lớp bảo mật cơ bản.
- Đảm bảo Widget có thể nhúng an toàn qua HTTPS.

## 3. Các bước thực hiện
1. **SSL:** Cấu hình Certbot để tự động gia hạn chứng chỉ SSL cho domain.
2. **Nginx:** Cập nhật `nginx.conf` với các header bảo mật (HSTS, X-Frame-Options, CSP).
3. **Rate Limiting:** [x] Redis + tenant key trong `api/middleware.py` — có thể mở rộng thêm bucket theo IP ở Nginx.
4. **Environment:** Tách biệt hoàn toàn `prod.env` và `dev.env`.

## 4. Định nghĩa hoàn thành (DoD)
- [ ] Truy cập website qua HTTPS không báo lỗi chứng chỉ.
- [x] API trả về lỗi 429 khi vượt ngưỡng rate limit (theo tenant/key).
- [ ] Điểm bảo mật Nginx đạt mức A trên các công cụ audit online.
