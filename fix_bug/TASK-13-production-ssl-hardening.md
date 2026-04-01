# TASK-13: Production SSL & Hardening

## 🎯 Mục tiêu
Thiết lập các tiêu chuẩn an ninh cho môi trường Production.

## 📋 Danh sách công việc
1. [ ] **Cấu hình SSL/TLS**:
   - Thiết lập Let's Encrypt với Nginx.
   - Redirect HTTP sang HTTPS.
2. [ ] **Security Headers**:
   - Cấu hình HSTS, X-Frame-Options, X-Content-Type-Options.
   - Thiết lập Content Security Policy (CSP) phù hợp cho Widget.
3. [ ] **Backend Hardening**:
   - Tắt chế độ `reload` và `debug` của Uvicorn/FastAPI.
   - Cấu hình `allow_origins` trong CORS chính xác theo danh sách tenant (không dùng `*`).
4. [ ] **Rate Limiting Nâng cao**:
   - Kiểm tra và tinh chỉnh Redis rate limiter cho chat endpoint.

## 🧪 Kiểm tra
- Sử dụng công cụ như SSL Labs để kiểm tra điểm bảo mật.
- Kiểm tra header trả về của API.
