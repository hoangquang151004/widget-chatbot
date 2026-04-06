# Task list — Sprint hiện tại

> Cập nhật: 2026-04-03

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
