# Implementation Plan — Widget Chatbot (tổng hợp)

> **Cập nhật:** 2026-04-03  
> **Mục đích:** Một nguồn kế hoạch chính, khớp với [PROGRESS.md](PROGRESS.md), [docs/TRANG_THAI_DU_AN.md](docs/TRANG_THAI_DU_AN.md), CI và code thực tế.  
> **Quy trình:** Mọi **phase mới** cần chủ sở hữu phản hồi **"Duyệt"** trước khi merge thay đổi lớn (theo [AGENTS.md](AGENTS.md)).

---

## 1) Tổng quan trạng thái (snapshot)

| Lớp                              | Trạng thái               | Ghi chú                                                                                                                                                                                 |
| -------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema v2 + Alembic              | Hoàn thành               | `tenants` đã cleanup legacy; head migration theo repo                                                                                                                                   |
| Admin API + Dashboard            | Hoàn thành               | Settings, Keys, KB, Database page, `useApi`                                                                                                                                             |
| Widget SDK + chat/stream         | Hoàn thành               | Qdrant RAG, middleware 2-key                                                                                                                                                            |
| CI backend                       | Hoàn thành               | [`.github/workflows/ci.yml`](.github/workflows/ci.yml): Ruff, Alembic, pytest, Postgres + Redis + Qdrant                                                                                |
| Pytest tích hợp DB + schema SQL  | Có                       | [`tests/test_admin_database_integration.py`](apps/api/tests/test_admin_database_integration.py), smoke: [`scripts/run_smoke_integration.py`](apps/api/scripts/run_smoke_integration.py) |
| **AI Orchestrator / RAG query**  | **Hoàn thành (Phase 6)** | `settings_loader`, hybrid Qdrant, `system_prompt` từ DB — xem mục 2                                                                                                                     |
| Text-to-SQL E2E khách production | Chưa đủ                  | Introspection schema đã test; cần LLM + DB khách thật                                                                                                                                   |

**Tham chiếu kỹ thuật (không đổi trong .env theo AGENTS.md):** `GEMINI_MODEL`, `EMBEDDING_MODEL`, `EMBEDDING_DIM` — dense vector Qdrant dùng `settings.EMBEDDING_DIM` (vd. 3072), **không** dùng mô tả 768d trong tài liệu cũ.

---

## 2) Phase 6 — AI Engine (**đã triển khai** 2026-04-03)

**Spec gốc:** [`fix_bug/fig_bug_2/`](fix_bug/fig_bug_2/)

| ID        | Nội dung                                                                                                              | Code                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| BUG-AI-01 | Node `settings_loader` + `route_by_intent` tôn trọng `is_rag_enabled` / `is_sql_enabled`                              | [`apps/api/ai/orchestrator.py`](apps/api/ai/orchestrator.py)                                 |
| BUG-AI-02 | Hybrid: `Prefetch` dense + `bm25` + `FusionQuery(RRF)`; fallback `_dense_only_search` (có `RAG_SIMILARITY_THRESHOLD`) | [`apps/api/ai/vector_store.py`](apps/api/ai/vector_store.py)                                 |
| BUG-AI-03 | `system_prompt` từ `tenant_ai_settings` → `general_node` + context RAG                                                | [`orchestrator.py`](apps/api/ai/orchestrator.py), [`rag_agent.py`](apps/api/ai/rag_agent.py) |

**Nghiệm thu khuyến nghị (thủ công):** PATCH `/ai-settings` tắt RAG/SQL rồi chat; đổi system prompt và kiểm tra câu trả lời.

**Lưu ý:** Điểm **RRF** không lọc bằng `RAG_SIMILARITY_THRESHOLD` (chỉ áp cho tìm dense-only).

**Sau Phase 6 (launch — trùng Priority 1 trong TRANG_THAI):**

- Regression Text-to-SQL với **DB khách thật** (schema lớn, LLM sinh SQL, chỉ SELECT).
- Bổ sung E2E frontend (Playwright) nếu cần; hiện CI đã có build web + pytest backend.

**Backlog (không chặn Phase 6):** PayOS (thanh toán), admin multi-tenant panel, RAG history-aware (TASK-06), polish Billing/Analytics.

---

## 3) Đồng bộ tài liệu `fix_bug/fig_bug_2`

- Khi bắt đầu Phase 6: cập nhật [`fix_bug/fig_bug_2/PROGRESS.md`](fix_bug/fig_bug_2/PROGRESS.md) và [`fix_bug/fig_bug_2/AGENTS.md`](fix_bug/fig_bug_2/AGENTS.md) — đường dẫn task → `fix_bug/fig_bug_2/…`; bỏ hoặc làm rõ các dòng `task_phase_6_*` nếu chưa có file tương ứng.
- % tiến độ trong `fig_bug_2/PROGRESS.md` nên tham chiếu [docs/TRANG_THAI_DU_AN.md](docs/TRANG_THAI_DU_AN.md) để tránh lệch (~80% vs ~91%).

---

## 4) Lịch sử — Đã hoàn thành (chỉ tham chiếu)

Các kế hoạch dưới đây **đã triển khai**; giữ lại để audit. Chi tiết verify: [tasks/task_phase_5.md](tasks/task_phase_5.md), [task.md](task.md).

---

### 4.1 Implementation Plan — Dashboard Database (đã xong)

> Ngày: 2026-04-03 | Trạng thái: Đã triển khai

**Mục tiêu:** Nối [`apps/web/src/app/(dashboard)/dashboard/database/page.tsx`](<apps/web/src/app/(dashboard)/dashboard/database/page.tsx>) với `GET/POST /api/v1/admin/database`, `POST .../test`.

**Đã làm:** Client component, form, load config, test connection, lưu, validate, mask password, preview trạng thái kết nối (không introspection bảng/cột trên UI).

**Nghiệm thu:** Load / test / save + refresh; không mock field DB; TypeScript sạch.

---

### 4.2 Implementation Plan — Migration cleanup cột legacy `tenants` (đã xong)

> Ngày: 2026-04-03 | Trạng thái: Đã triển khai

**Mục tiêu:** Xóa cột/index legacy trên `tenants`; register + seed theo schema v2.

**Kết quả:** Revision [`f2a4d1c7b9e0_cleanup_legacy_tenants_columns.py`](apps/api/db/alembic/versions/f2a4d1c7b9e0_cleanup_legacy_tenants_columns.py); model `Tenant` tinh gọn; [`admin.py`](apps/api/api/v1/admin.py) register không slug/keys trên `tenants`; scripts seed cập nhật.

**Nghiệm thu:** `alembic upgrade head`; `tenants` chỉ cột core; register/login/me OK.

---

## 5) Lệnh kiểm tra nhanh (dev)

```bash
# Backend tests (cần Postgres + Redis; Qdrant nếu chạy test RAG isolation)
cd apps/api
.venv/Scripts/python -m pytest tests/ -q

# Smoke tích hợp DB + schema Text-to-SQL
.venv/Scripts/python scripts/run_smoke_integration.py
```

---

**Bước tiếp theo được đề xuất:** Chờ **"Duyệt"** Phase 6, sau đó triển khai BUG-AI-01 → BUG-AI-02 → BUG-AI-03 theo spec trong `fix_bug/fig_bug_2/`.

---

## 6) Implementation Plan — CI/CD chuẩn hóa cho monorepo (triển khai 2026-04-08)

> **Trạng thái:** Đã được duyệt và đã triển khai workflow + docs + test xác nhận.

### 6.1 Hiện trạng

- Đã có CI tổng hợp tại `.github/workflows/ci.yml` (ruff, pytest + services, build web, build widget).
- Đã có CD build/push image theo tag tại `.github/workflows/deploy.yml`.
- Đã có CD deploy VPS qua SSH/PM2 tại `.github/workflows/deploy-vps.yml`.
- Thiếu cơ chế gate rõ ràng giữa CI và CD (ví dụ deploy chỉ chạy khi CI pass), thiếu chuẩn hóa trigger theo môi trường/release.

### 6.2 Mục tiêu triển khai

1. CI ổn định cho PR và push, giảm false-negative, log rõ ràng để debug nhanh.
2. CD image theo release tag có metadata nhất quán cho API/Web (và tùy chọn widget).
3. CD deploy VPS có kiểm soát (manual/protected env), chỉ deploy khi build/test đã pass.
4. Chuẩn hóa tài liệu vận hành để đội dev có thể release theo một quy trình duy nhất.

### 6.3 Phạm vi thay đổi dự kiến

- Cập nhật `.github/workflows/ci.yml`.
- Cập nhật `.github/workflows/deploy.yml`.
- Cập nhật `.github/workflows/deploy-vps.yml`.
- Bổ sung/chuẩn hóa docs CI/CD trong `README.md` (hoặc `docs/PRODUCTION_RUNBOOK.md` nếu phù hợp).
- (Nếu cần) bổ sung workflow `release.yml`/`rollback.yml` tách biệt khi thấy cần tách trách nhiệm.

### 6.4 Thiết kế pipeline đề xuất

**A. CI workflow (`ci.yml`)**

- Trigger: `pull_request` (main/develop) + `push` (main/develop).
- Jobs:
  - Backend lint (`ruff`) + backend test (`pytest`) với Postgres/Redis/Qdrant service.
  - Frontend check (`npm ci`, `npm run lint`, `npm run build`) cho `apps/web`.
  - Widget SDK build cho `apps/widget-sdk`.
- Hardening:
  - Bật `concurrency` để hủy run cũ cùng branch.
  - Tối ưu cache (`pip`, `npm`) và summary output.
  - Chuẩn hóa env fallback an toàn cho `APP_ENCRYPTION_KEY` ở CI.

**B. Release image workflow (`deploy.yml`)**

- Trigger: `push tag v*` + optional `workflow_dispatch`.
- Bắt buộc pass CI trước khi push image (dùng `workflow_run` hoặc gate qua branch/tag policy).
- Build + push GHCR image cho:
  - `ghcr.io/<owner>/xenoai-api:<version>, latest`
  - `ghcr.io/<owner>/xenoai-web:<version>, latest`
- Ghi metadata/summary release (tag, commit sha, image digest).

**C. VPS deploy workflow (`deploy-vps.yml`)**

- Trigger chính: `workflow_dispatch` (manual) với input `image_tag` hoặc `ref` để deploy chủ động.
- Chạy deploy qua SSH:
  - `git pull` đúng ref.
  - Update deps/API migration (`alembic upgrade head`).
  - Restart PM2 processes (`widget-api`, `widget-worker`, `widget-web`, `widget-sdk`).
  - Health check sau deploy.
- Bổ sung rollback nhanh:
  - Input manual cho ref trước đó.
  - Dừng khi health-check fail (`script_stop: true`).

### 6.5 Secrets/Variables cần chuẩn hóa

- `APP_ENCRYPTION_KEY` (CI test).
- `GEMINI_API_KEY` (nếu test cần gọi model thật; nếu không dùng mock/test mode).
- `PROD_API_URL` (build web image cho production).
- `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_APP_PATH`.
- Khuyến nghị dùng GitHub Environments (`staging`, `production`) để quản lý secret tách bạch.

### 6.6 Tiêu chí nghiệm thu

- PR vào `main` chạy CI xanh toàn bộ jobs.
- Tạo tag `vX.Y.Z` đẩy lên repo sẽ build/push thành công image API/Web lên GHCR.
- Chạy `deploy-vps.yml` thủ công với ref/tag cụ thể deploy thành công và vượt health check.
- Có hướng dẫn release/rollback ngắn gọn trong docs để người khác vận hành được.

### 6.7 Kế hoạch thực thi sau khi được duyệt

1. Cập nhật `task.md` với checklist CI/CD sprint (theo quy tắc Architect First).
2. Sửa 3 workflow theo thiết kế trên.
3. Validate YAML + chạy test cục bộ phần bị ảnh hưởng:
   - Backend: `apps/api/.venv/Scripts/python.exe -m pytest tests/ -v` (hoặc subset phù hợp).
   - Frontend: `npm run build` trong `apps/web` khi thay đổi liên quan web.
4. Báo cáo kết quả pass/fail và danh sách secret cần set trên GitHub.

---

## 7) Implementation Plan — Auto deploy khi push `main` (VPS non-Docker)

> **Ngày tạo kế hoạch:** 2026-04-08  
> **Trạng thái:** Chờ duyệt

### 7.1 Bối cảnh hiện tại

- Repo đã có `.github/workflows/deploy-vps.yml` nhưng trigger đang là `workflow_dispatch` (deploy thủ công).
- Hạ tầng production đang chạy **không dùng Docker** cho app; runtime chính là PM2 + venv.
- Redis và Qdrant được quản trị tách riêng, không cần rebuild theo mỗi lần deploy app.

### 7.2 Mục tiêu

1. Mỗi lần push vào nhánh `main`, GitHub Actions tự SSH vào VPS và deploy bản mới.
2. Giữ khả năng deploy thủ công cho rollback/hotfix theo `git_ref`.
3. Deploy fail phải dừng sớm (`script_stop`) và báo trạng thái rõ trên Actions.

### 7.3 Phạm vi thay đổi dự kiến

- Cập nhật `.github/workflows/deploy-vps.yml`:
  - Thêm trigger `push.branches: [main]`.
  - Giữ `workflow_dispatch` cho manual deploy.
  - Tách logic input để workflow chạy được cả auto mode và manual mode.
- (Tùy chọn nhưng khuyến nghị) thêm script deploy trên VPS: `scripts/deploy_vps.sh` hoặc dùng script inline chuẩn hóa.
- Cập nhật `task.md` với checklist mục CI/CD auto deploy.
- Cập nhật tài liệu vận hành ngắn trong `docs/PRODUCTION_RUNBOOK.md` hoặc `README.md`.

### 7.4 Thiết kế workflow đề xuất

- **Trigger**
  - Auto: `push` lên `main`.
  - Manual: `workflow_dispatch` với `git_ref`, `run_migrations`.
- **Concurrency**
  - `group: deploy-vps-production`, `cancel-in-progress: false` để tránh chồng deploy.
- **SSH Deploy steps**
  1. Resolve `TARGET_REF` (auto = `${{ github.sha }}` hoặc `main`; manual = input).
  2. `git fetch --all --prune --tags`.
  3. Checkout đúng ref.
  4. API: activate venv, `pip install -r requirements.txt`, optional `alembic upgrade head`.
  5. Restart PM2: `widget-api`, `widget-worker`, `widget-web`, `widget-sdk`.
  6. Web + widget build lại bằng `npm ci && npm run build`.
  7. Health-check API/widget endpoint; fail thì exit code != 0.

### 7.5 Secrets/biến bắt buộc

- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT`, `VPS_APP_PATH`.
- Khuyến nghị đặt trong GitHub Environment `production`.

### 7.6 Tiêu chí nghiệm thu

- Push commit vào `main` tự kích hoạt `deploy-vps.yml`.
- Job deploy hoàn thành xanh và health-check pass.
- PM2 process sau deploy ở trạng thái `online`.
- Vẫn chạy được manual deploy cho ref/tag cụ thể.

### 7.7 Kế hoạch thực thi sau khi được duyệt

1. Cập nhật `task.md` checklist cho hạng mục auto deploy.
2. Sửa `.github/workflows/deploy-vps.yml` theo thiết kế mục 7.4.
3. Chạy kiểm tra backend test theo quy định dự án:
   - `apps/api/.venv/Scripts/python.exe -m pytest tests/ -v` (hoặc subset hợp lệ theo phạm vi đổi).
4. Báo cáo kết quả pass/fail + danh sách secrets cần xác nhận ở GitHub.
