# Task: DevOps & Deployment
> **Module**: Root, Docker, CI/CD | **Ưu tiên**: 🟡 P2 | **Cập nhật**: 2026-03-27

---

## Tổng Quan

Mục tiêu: Đưa toàn bộ hệ thống lên production được với:
- Docker Compose hoạt động end-to-end
- Database migrations tự động (Alembic)
- CI/CD pipeline (GitHub Actions)
- Monitoring & Logging cơ bản

---

## DEV-001: Verify Docker Compose

**File**: `docker-compose.yml` (đã có, chưa test end-to-end)

- [ ] Kiểm tra services trong `docker-compose.yml`:
  - `postgres` (database)
  - `redis` (cache + rate limit + celery broker)
  - `qdrant` (vector DB)
  - `api` (FastAPI backend)
  - `celery_worker` (document processor)
  - `web` (Next.js dashboard)
- [ ] Verify `healthcheck` cho từng service
- [ ] Verify networking (api có thể reach postgres, redis, qdrant)
- [ ] Test: `docker-compose up --build` → tất cả healthy
- [ ] Fix any startup ordering issues (depends_on + condition: service_healthy)

---

## DEV-002: Environment Variables

- [ ] Hoàn chỉnh `apps/api/.env.example` với tất cả biến:
  ```env
  DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/chatbot_db
  REDIS_URL=redis://localhost:6379
  QDRANT_HOST=localhost
  QDRANT_PORT=6333
  QDRANT_API_KEY=
  GEMINI_API_KEY=your_key_here
  APP_ENCRYPTION_KEY=your_32_char_key_here
  QDRANT_COLLECTION_DOCS=chatbot_documents
  CELERY_BROKER_URL=redis://localhost:6379/0
  CELERY_RESULT_BACKEND=redis://localhost:6379/1
  ```
- [ ] Hoàn chỉnh `apps/web/.env.example`:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8001
  ```
- [ ] Tạo `.env.docker` cho Docker Compose (dùng service names làm hostname)
- [ ] Validate: nếu thiếu biến quan trọng → app báo lỗi rõ ràng lúc startup

---

## DEV-003: Alembic Database Migrations

- [ ] Cài alembic: `pip install alembic`
- [ ] Init: `alembic init apps/api/db/migrations`
- [ ] Cấu hình `alembic.ini`:
  ```ini
  script_location = db/migrations
  sqlalchemy.url = driver://user:pass@localhost/dbname
  ```
- [ ] Cấu hình `env.py` dùng async engine + import models
- [ ] Tạo initial migration: `alembic revision --autogenerate -m "initial"`
- [ ] Test: `alembic upgrade head` tạo đúng bảng
- [ ] Thêm migration vào Docker Compose entrypoint:
  ```bash
  alembic upgrade head && uvicorn main:app
  ```

---

## DEV-004: Seed Data Script

**File mới**: `apps/api/scripts/seed.py`

- [ ] Tạo PostgreSQL tables (nếu chưa có)
- [ ] Insert 1 tenant demo:
  - name: "Demo Tenant"
  - slug: "demo"
  - public_key: `pk_live_DEMO...`
  - secret_key: `sk_live_DEMO...`
  - allowed_origins: `["*"]` (cho dev)
- [ ] Print keys ra console
- [ ] Tạo Qdrant collection nếu chưa có
- [ ] Cách chạy:
  ```bash
  cd apps/api
  .venv\Scripts\python.exe scripts/seed.py
  ```

---

## DEV-005: GitHub Actions CI/CD

**File**: `.github/workflows/ci.yml`

- [ ] Trigger: push vào `main` và PR
- [ ] Jobs:
  - **Lint**: `ruff check apps/api/` + `eslint apps/web/`
  - **Test Backend**: pytest với PostgreSQL + Redis services
  - **Build Widget**: `npm run build` trong `apps/widget-sdk/`
  - **Build Web**: `npm run build` trong `apps/web/`
- [ ] Secrets: `GEMINI_API_KEY`, `DATABASE_URL` (test DB)

**File** (tùy chọn): `.github/workflows/deploy.yml`
- [ ] Trigger: push tag `v*`
- [ ] Build Docker images
- [ ] Push to container registry

---

## DEV-006: Logging & Monitoring

- [ ] Cấu hình structured logging (JSON) cho FastAPI:
  ```python
  import structlog
  logger = structlog.get_logger()
  ```
- [ ] Log format: `timestamp`, `level`, `tenant_id`, `request_id`, `message`
- [ ] Thêm `request_id` header vào mọi response
- [ ] Sentry integration (optional):
  ```python
  import sentry_sdk
  sentry_sdk.init(dsn=settings.SENTRY_DSN)
  ```
- [ ] Health check đầy đủ: `GET /api/health/detailed` → kiểm tra DB, Redis, Qdrant

---

## DEV-007: Production Hardening

- [ ] **HTTPS**: Cấu hình Nginx reverse proxy với SSL
- [ ] **Rate limiting**: Kiểm tra Redis rate limiter hoạt động đúng trong production
- [ ] **CORS strict mode**: Đổi `allow_origins=["*"]` → per-tenant
- [ ] **Secret rotation**: Tài liệu hướng dẫn rotate `APP_ENCRYPTION_KEY`
- [ ] **Backup**: Script backup PostgreSQL + Qdrant
- [ ] **Resource limits** trong Docker Compose:
  ```yaml
  deploy:
    resources:
      limits:
        memory: 512M
  ```

---

## DEV-008: Landing Page + CDN cho Widget

- [ ] Widget `dist/widget.js` cần được serve qua CDN hoặc static file server
- [ ] Cấu hình CORS headers đúng cho file `widget.js`
- [ ] Versioning: `widget.js?v=1.0.0`
- [ ] Cache headers: `Cache-Control: public, max-age=86400`

---

## ✅ Definition of Done

- [ ] `docker-compose up` → tất cả services green
- [ ] `alembic upgrade head` không có lỗi
- [ ] `python scripts/seed.py` → tạo được tenant test
- [ ] GitHub Actions CI pass trên PR
- [ ] `GET /api/health/detailed` trả về status đầy đủ của tất cả dependencies
- [ ] Widget.js serve được qua URL public
