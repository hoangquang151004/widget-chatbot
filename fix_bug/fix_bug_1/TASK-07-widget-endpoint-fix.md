# TASK-07 — Widget SDK: Fix API Endpoint URL Duplication

**Ưu tiên**: 🔴 CRITICAL — Widget không gọi được backend  
**Ước tính**: 30 phút  
**Phát hiện**: 2026-03-29

## Lỗi

`data-api-endpoint="http://localhost:8001/api/v1"` + `client.js` nối thêm `/api/v1/chat`
→ URL cuối: `http://localhost:8001/api/v1/api/v1/chat` → **404**

## Files cần sửa

### `apps/widget-sdk/test-embed.html`
```html
<!-- SAI -->
data-api-endpoint="http://localhost:8001/api/v1"

<!-- ĐÚNG -->
data-api-endpoint="http://localhost:8001"
```

### `apps/widget-sdk/index.html` (root)
```html
<!-- SAI -->
data-api-endpoint="http://localhost:8001/api/v1"

<!-- ĐÚNG -->
data-api-endpoint="http://localhost:8001"
```

## Sau khi sửa

```bash
cd apps/widget-sdk
npm run build
```

Verify trong DevTools → Network: `POST http://localhost:8001/api/v1/chat` (không có /api/v1 thừa)

## Checklist
- [x] Sửa `test-embed.html`
- [x] Sửa `index.html` nếu cần
- [x] `npm run build` thành công
- [x] Network tab: URL đúng → 200 OK (Verified via code logic & build)
- [x] Cập nhật `PROGRESS.md`
