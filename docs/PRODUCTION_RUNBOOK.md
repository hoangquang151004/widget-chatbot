# Runbook vận hành production

Tài liệu tóm tắt cho môi trường sau khi triển khai (reverse proxy, API, Postgres, Redis, Qdrant).

## Trước khi go-live

- Bật `ENV=production` cho API; đặt `SECRET_KEY`, `APP_ENCRYPTION_KEY` (ổn định, backup an toàn), CORS origins thực tế.
- TLS: chấm dứt HTTPS tại Nginx (hoặc load balancer), chuyển tiếp HTTP nội bộ tới Uvicorn.
- `SENTRY_DSN`: bật cho backend (đã hỗ trợ trong `main.py` khi biến được set) và khuyến nghị bật cho `apps/web`.
- RAG: đảm bảo Qdrant được backup và có kế hoạch **re-index** từ `tenant_documents` / file gốc khi mất collection.

## Header bảo mật API

Với `ENV=production`, middleware logging gắn thêm (best-effort):

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (hạn chế camera/mic/geolocation)

Cấu hình bổ sung (HSTS, CSP) nên đặt tại reverse proxy cho toàn site.

## Database khách (Text-to-SQL)

- Khuyến nghị user DB **read-only**, chỉ quyền `SELECT` trên schema cần thiết.
- Credentials lưu mã hóa AES-GCM; **xoay** `APP_ENCRYPTION_KEY` trên production cần kế hoạch re-encrypt cấu hình tenant (không tự động trong repo này).

## Sao lưu & phục hồi

- **PostgreSQL (SaaS)**: snapshot/định kỳ, kiểm tra restore drill.
- **Redis**: có thể mất cache an toàn; Celery broker nếu dùng Redis cần RPO/RTO phù hợp.
- **Qdrant**: backup volume hoặc snapshot theo hướng dẫn Qdrant; khi mất vector có thể re-ingest tài liệu.

## CI / smoke

- GitHub Actions: job backend chạy Alembic + pytest (Postgres, Redis, Qdrant).
- Smoke cục bộ: `apps/api/scripts/run_smoke_integration.py` (cần DB đã migrate và Redis).

## Khắc sự cố nhanh

| Triệu chứng | Hướng xử lý |
|-------------|-------------|
| 401/403 widget | Kiểm tra `X-Widget-Key`, origin trong `tenant_allowed_origins`. |
| RAG không trả kết quả | `/api/health/detailed`, log Qdrant; thử upload lại / re-index. |
| Text-to-SQL lỗi kết nối | Dashboard → Database: test connection; kiểm tra firewall DB khách. |
| Rate limit 429 admin | Tạm điều chỉnh hoặc chờ window; xem `core/rate_limit.py`. |
