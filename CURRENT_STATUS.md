# Trạng thái Dự án - Cập nhật 08/04/2026

## 1. Trạng thái hệ thống hiện tại

- Backend FastAPI đang chạy ổn định tại cổng 8001.
- Celery worker đang chạy ổn định với Redis broker.
- Frontend Next.js đang chạy ở cổng 3000.
- Kiến trúc vector runtime đã rollback thành công về Qdrant.
- CI/CD GitHub Actions đã chuẩn hóa cho monorepo (CI + build image + deploy VPS manual).

## 2. Kết quả đã xác nhận

### 2.1 Rollback RAG về Qdrant (Hoàn thành)

- Đã khôi phục luồng ingest/search/delete vectors qua Qdrant.
- Health check detailed trả về đủ: `postgresql=ok`, `redis=ok`, `qdrant=ok`.
- Các script vận hành liên quan vector store đã đồng bộ lại theo Qdrant.

### 2.2 E2E Upload (Hoàn thành)

- Đã chạy luồng end-to-end theo auth Bearer:
  - Register tenant
  - Login lấy token
  - Upload file
  - Polling trạng thái async (`processing -> done`)
  - List documents
  - Delete document
- Kết quả: PASS.

### 2.3 CI/CD (Hoàn thành)

- CI: lint backend + test backend (Postgres/Redis/Qdrant) + build web/widget.
- Đã xử lý lỗi migration CI liên quan pgvector bằng service PostgreSQL có sẵn extension `vector`.
- Deploy VPS hiện chạy thủ công qua workflow dispatch (`deploy-vps.yml`).

## 3. Công việc đang làm

- Chuẩn hóa tài liệu vận hành production theo luồng release bằng GitHub Actions.
- Theo dõi và tối ưu hóa thời gian chạy CI backend.

## 4. Rủi ro hiện tại

- Sai lệch dữ liệu vector ở các tenant đã từng đi qua nhánh pgvector.
- Cần re-index tài liệu từ nguồn gốc khi triển khai môi trường mới hoặc cutover.
- Deploy production vẫn cần trigger thủ công (chưa auto deploy theo push `main`).

## 5. Hành động tiếp theo

1. Quyết định có bật auto deploy khi push `main` hay giữ manual gate cho production.
2. Chạy thêm regression test cho `/api/v1/chat/stream` và tuyến billing/analytics.
3. Duy trì cập nhật runbook khi thay đổi pipeline release.

---

**Người cập nhật**: GitHub Copilot
