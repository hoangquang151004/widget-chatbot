# Task: Dashboard UI — Xây Dựng Quản Trị Hoàn Chỉnh
> **Module**: `apps/web/` (Next.js 14) | **Ưu tiên**: 🟡 P2 | **Cập nhật**: 2026-03-27

---

## Tổng Quan

Dashboard cho phép tenant quản lý toàn bộ chatbot của mình:
- Upload tài liệu (RAG knowledge base)
- Kết nối database riêng (Text-to-SQL)
- Xem API keys để nhúng widget
- Xem thống kê sử dụng

**Tech stack**: Next.js 14 App Router, TypeScript, Tailwind CSS, ShadCN UI (hoặc custom)

---

## D-001: Cơ Sở Hạ Tầng Auth

- [ ] Tạo `src/lib/api.ts` — wrapper `fetch` tự gắn API key:
  ```ts
  export async function apiFetch(path: string, opts?: RequestInit) {
    const key = localStorage.getItem('secret_key');
    return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      ...opts,
      headers: { 'X-API-Key': key!, 'Content-Type': 'application/json', ...opts?.headers },
    });
  }
  ```
- [ ] Tạo `src/contexts/AuthContext.tsx` — lưu `secret_key` và `tenant_info`
- [ ] Tạo hook `useAuth()` và `useTenant()`
- [ ] Middleware Next.js: redirect về `/login` nếu không có key trong localStorage
- [ ] Hỗ trợ logout (xóa localStorage, redirect về `/login`)

---

## D-002: Trang Login (`/login`)

- [ ] Form nhập `secret_key` (`sk_live_...`)
- [ ] Gọi `GET /api/v1/admin/me` để xác thực
- [ ] Nếu success → lưu key + tenant info vào localStorage → redirect `/dashboard`
- [ ] Hiển thị error nếu key sai
- [ ] UI: centered card, input password, button Login

---

## D-003: Layout Dashboard

- [ ] **Sidebar** với navigation links:
  - Dashboard (overview)
  - Documents (RAG)
  - Database (SQL)
  - API Keys
  - Widget Settings
- [ ] **Top Header**: tên tenant, avatar, logout button
- [ ] **Mobile responsive**: sidebar collapse thành hamburger menu
- [ ] Active state cho menu item hiện tại

---

## D-004: Trang Overview (`/dashboard`)

- [ ] **Stats cards**:
  - Tổng queries hôm nay
  - Tổng documents đã index
  - Trạng thái kết nối DB (✅ / ❌)
- [ ] **Quick embed snippet**: hiển thị code nhúng widget với public key
- [ ] **Recent activity**: list 5 câu hỏi gần nhất (nếu có endpoint)

---

## D-005: Trang Documents (`/dashboard/documents`)

- [ ] **Upload zone**: Drag & drop hoặc click để chọn file
  - Chấp nhận: PDF, DOCX, TXT, MD
  - Hiển thị progress bar khi upload
- [ ] **Document list table**:
  | Tên file | Loại | Kích thước | Trạng thái | Thao tác |
  |----------|------|-----------|-----------|---------|
  - Status badge: `pending` (vàng), `processing` (xanh dương nhấp nháy), `done` (xanh lá), `error` (đỏ)
  - Nút Delete với xác nhận
- [ ] **Auto-refresh status**: Poll `GET /files/status/{id}` mỗi 3 giây nếu có file đang processing
- [ ] Empty state khi chưa có tài liệu nào

---

## D-006: Trang Database (`/dashboard/database`)

- [ ] **Connection form**:
  ```
  DB Type:   [MySQL ▼] [PostgreSQL ▼] [SQLite ▼]
  Host:      [______________]
  Port:      [____]
  DB Name:   [______________]
  Username:  [______________]
  Password:  [••••••••••••••]
  ```
- [ ] **Test Connection button**: Gọi API và hiển thị kết quả (có thể cần endpoint mới)
- [ ] **Save button**: Gọi `POST /admin/database`
- [ ] Hiển thị trạng thái hiện tại nếu đã có config
- [ ] Warning: "Credentials sẽ được mã hóa AES-256-GCM"

---

## D-007: Trang API Keys (`/dashboard/keys`)

- [ ] Hiển thị **Public Key** (`pk_live_...`):
  - Masked: `pk_live_••••••••••••••••••••ABC123`
  - Button "Hiển thị" (toggle)
  - Button "Copy"
- [ ] Hiển thị **Secret Key** (`sk_live_...`):
  - Masked hoàn toàn
  - Button "Hiển thị" với warning modal
  - Button "Copy"
- [ ] Button **"Rotate Keys"**:
  - Mở confirm modal: "Các key cũ sẽ bị vô hiệu hóa ngay lập tức"
  - Sau rotate: hiển thị keys mới, copy ngay
- [ ] Section hướng dẫn embed (code snippet có syntax highlight)

---

## D-008: Trang Widget Settings (`/dashboard/widget`)

- [ ] **Customization form**:
  - Tên bot
  - Màu chủ đạo (color picker)
  - Placeholder text
  - Avatar URL
  - Allowed origins (textarea, mỗi dòng 1 origin)
- [ ] **Live preview**: iframe hoặc widget preview bên phải, update realtime khi thay đổi
- [ ] **Save button**: Gọi `PATCH /admin/me`
- [ ] **Embed code** phía dưới (auto-update theo config)

---

## D-009: UI Components Chung

- [ ] `Toast` notifications (success/error)
- [ ] `Modal` confirm (dùng khi delete, rotate keys)
- [ ] `LoadingSpinner`
- [ ] `CopyButton` (copy to clipboard + tooltip "Đã sao chép!")
- [ ] `StatusBadge` (pending/processing/done/error)
- [ ] `EmptyState` (khi list rỗng)

---

## ✅ Definition of Done

- [ ] Login với `sk_live_...` thật → vào được dashboard
- [ ] Upload PDF → xuất hiện trong list → status chuyển từ pending → done
- [ ] Điền DB config → save → GET lại thấy config đã lưu
- [ ] API Keys hiển thị đúng, copy hoạt động
- [ ] Widget preview phản ánh customization
- [ ] Không có lỗi TypeScript
- [ ] Responsive trên mobile (1 cột) và desktop (sidebar)
