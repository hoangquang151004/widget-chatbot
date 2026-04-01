# Task: Widget SDK — Xây Dựng Từ Đầu
> **Module**: `apps/widget-sdk/` | **Ưu tiên**: 🔴 P1 (Core Product) | **Cập nhật**: 2026-03-27

---

## ✅ Trạng thái: HOÀN THÀNH (100%)

- [x] **W-001**: Cấu trúc project + Vite Build IIFE (22KB)
- [x] **W-002**: Parse Config từ Script Tag
- [x] **W-003**: Shadow DOM Container (Isolating CSS/UI)
- [x] **W-004**: Chat Bubble UI (Floating button + Unread badge)
- [x] **W-005**: Chat Window Panel (Header + Messages + Input)
- [x] **W-006**: Message Rendering (Markdown support + Typing indicator)
- [x] **W-007**: API Client (POST + Retry logic)
- [x] **W-008**: SSE Streaming (ReadableStream integration)
- [x] **W-009**: Session Management (localStorage persist)
- [x] **W-010**: Rich Component Rendering (Table, Grid, Bar Chart via Canvas)
- [x] **W-011**: Build & Test (demo.html ready)

---

## 🚀 Hướng Dẫn Sử Dụng (Demo)

1. Mở terminal tại `apps/widget-sdk`.
2. Chạy `npm run preview`.
3. Truy cập: `http://localhost:4173/demo.html`.

---

## 🛠️ Chi tiết kỹ thuật
- **Bundle size**: 22KB (không phụ thuộc thư viện ngoài).
- **CSS**: Scoped hoàn toàn trong Shadow DOM bằng `:host`.
- **Markdown**: Regex-based parser, cực nhẹ.
- **Charts**: Vẽ bằng Canvas API trực tiếp, không dùng Chart.js.
