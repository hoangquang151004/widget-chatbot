# Task list — Sprint hiện tại

> Cập nhật: 2026-04-08

## CI/CD — Chuẩn hóa pipeline monorepo (hoàn thành)

Chi tiết kế hoạch: `implementation_plan.md` (mục 6)

- [x] Thiết kế kiến trúc CI/CD và được user duyệt.
- [x] Chuẩn hóa `ci.yml` (concurrency, lint/build/test rõ ràng cho API/Web/Widget).
- [x] Chuẩn hóa `deploy.yml` (release tag + metadata + gate CI).
- [x] Chuẩn hóa `deploy-vps.yml` (manual deploy có input ref, kiểm tra health).
- [x] Cập nhật tài liệu vận hành CI/CD.
- [x] Chạy test xác nhận sau khi sửa và báo cáo pass/fail.

---

## Billing — định nghĩa gói dịch vụ (**xong backend cốt lõi**)

Chi tiết: [`tasks/task_billing_plans.md`](tasks/task_billing_plans.md)

- [x] UI 4 gói + CTA + `NEXT_PUBLIC_SALES_EMAIL`.
- [x] Migration `enterprise_pro`, `plan_limits`, billing summary, enforcement upload/chat/SQL.
- [ ] Thanh toán tự động + tính năng marketing chưa build (TTS, multi-widget, …).

---

## Phase 6 (Dashboard & Product gaps) — đã xong

> Trạng thái Phase 6: **hoàn thành** (đồng bộ `PROGRESS.md`)

- [x] **Origins:** `/dashboard/origins` — CRUD qua admin API, sidebar "Domain cho widget".
- [x] **Support:** `/dashboard/support` — mailto + `NEXT_PUBLIC_SUPPORT_EMAIL` (`.env.example`).
- [x] **Knowledge Base:** `useApi` + `postFormData` cho upload; list/delete qua hook.
- [x] **Billing (trước đó):** sync usage, không mock thanh toán.
- [x] **Sidebar:** Hiển thị gói từ `tenant.plan`.
- [x] **Database:** FAB cuộn mượt tới `#database-connection-section`.
- [x] **`useApi`:** FormData không ép `Content-Type`; xử lý `detail` lỗi FastAPI tốt hơn; body rỗng an toàn.

Chi tiết hạng mục: `tasks/task_phase_6.md`.
