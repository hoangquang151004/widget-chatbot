# TASK-08 — Widget SDK: Fix loader.js Deprecated & Entry Point Nhầm

**Ưu tiên**: 🔴 CRITICAL  
**Ước tính**: 20 phút  
**Phát hiện**: 2026-03-29

## Lỗi A — loader.js hardcode sai
`src/loader.js` (file cũ) hardcode `port 8000` (sai, backend ở 8001) và đọc attribute `data-api-key` (sai, cần `data-public-key`).

## Lỗi B — src/main.js không chạy trực tiếp
`src/main.js` dùng ES Module imports → không chạy được nếu nhúng `<script src="./src/main.js">` mà không có Vite.

## Fix

### 1. Deprecate loader.js
Thêm vào đầu `apps/widget-sdk/src/loader.js`:
```javascript
// ⚠️ DEPRECATED — Không dùng file này. Dùng dist/widget.js
console.warn('[XenoAI] loader.js is deprecated. Use dist/widget.js instead.');
```
Hoặc xóa file nếu không cần thiết.

### 2. Sửa test-embed.html
```html
<!-- SAI — không có Vite sẽ fail silently -->
<script src="./src/main.js" ...>

<!-- ĐÚNG — dùng built bundle -->
<script src="./dist/widget.js" ...>
```

## Hai cách test hợp lệ duy nhất

```bash
# Cách 1: Dev mode
cd apps/widget-sdk && npm run dev
# → Mở http://localhost:5173

# Cách 2: Production test
cd apps/widget-sdk && npm run build
# → Mở dist/index.html hoặc test-embed.html
```

## Checklist
- [x] `loader.js` deprecated hoặc đã xóa
- [x] `test-embed.html` dùng `dist/widget.js`
- [x] Team biết 2 cách test hợp lệ
- [x] Cập nhật `PROGRESS.md`
