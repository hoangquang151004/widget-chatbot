# TASK-02 — Widget SDK: Verify & Fix API Connection

**Ưu tiên**: 🔴 High  
**Ước tính**: 2–3 giờ  
**Phụ thuộc**: Backend chạy ở port 8001, tenant đã đăng ký có `public_key`

---

## Mục tiêu

Widget SDK đã được build nhưng cần verify:
1. Widget gọi đúng API endpoint với đúng headers
2. SSE streaming parse đúng format từ backend
3. Rich component render được (product_grid, bar_chart)
4. Không có lỗi khi nhúng vào trang HTML thật

---

## Subtask 2.1 — Kiểm tra API endpoint config

**File**: `apps/widget-sdk/src/api/` (đọc hết files trong này)

### Cần kiểm tra
```javascript
// Đây là format backend expect:
// POST /api/v1/chat (full response)
// GET  /api/v1/chat/stream?query=...&session_id=... (SSE)
// Header: X-Widget-Key: pk_live_xxx
// Header: Origin: http://... (tự động từ browser)

// Kiểm tra trong code widget:
// 1. URL có hardcode localhost không?
// 2. Header X-Widget-Key được gửi không?
// 3. Dùng POST hay GET cho chat?
// 4. Dùng full response hay SSE streaming?
```

### Cách fix nếu sai
Widget nên đọc base URL từ `data-api-url` attribute hoặc default `https://api.yourapp.com`:
```javascript
// Trong loader.js hoặc main.js:
const API_URL = script.dataset.apiUrl || 'http://localhost:8001';
const PUBLIC_KEY = script.dataset.publicKey; // pk_live_xxx
```

---

## Subtask 2.2 — Kiểm tra SSE format

Backend trả SSE format:
```
data: {"chunk": "Xin chào!", "done": false}
data: {"chunk": " Tôi có thể", "done": false}
data: {"chunk": " giúp gì?", "done": false}
data: {"chunk": "", "done": true}
```

Widget cần parse đúng format này. Đọc `apps/widget-sdk/src/api/` và verify:

```javascript
// Pattern đúng:
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const payload = JSON.parse(line.slice(6));
      if (payload.done) { /* stream ended */ break; }
      appendChunk(payload.chunk); // render text
    }
  }
}
```

---

## Subtask 2.3 — Kiểm tra Rich Component render

Backend có thể trả về trong response:
```json
{
  "content": "Đây là sản phẩm phù hợp:",
  "component": {
    "type": "product_grid",
    "data": [
      {"id": "1", "name": "Sản phẩm A", "price": 299000, "image": "..."}
    ]
  }
}
```

Widget phải render component dưới text message. Verify logic trong `apps/widget-sdk/src/ui/`.

---

## Subtask 2.4 — Test với index.html thật

**File**: `apps/widget-sdk/index.html`

Cập nhật để test với backend thật:
```html
<!DOCTYPE html>
<html>
<head><title>Widget Test</title></head>
<body>
  <h1>Test Page</h1>
  <p>Trang test widget chatbot</p>

  <!-- Thay pk_live_xxx bằng key thật từ database -->
  <script 
    src="./dist/widget.js"
    data-public-key="pk_live_YOUR_KEY_HERE"
    data-api-url="http://localhost:8001"
    data-bot-name="Test Bot"
    data-color="#2563eb">
  </script>
</body>
</html>
```

### Test checklist
- [ ] Widget bubble xuất hiện góc phải màn hình
- [ ] Click mở chat window
- [ ] Gõ message → gửi → nhận response (không lỗi 401/403/500)
- [ ] SSE streaming: text hiện từng chữ
- [ ] Gõ "hello" → response từ Gemini (GENERAL intent)
- [ ] Session ID được lưu vào localStorage
- [ ] Close và mở lại → history vẫn còn (nếu implement)

---

## Subtask 2.5 — Widget nhận public_key từ đúng attribute

Đảm bảo script nhúng standard hoạt động:
```html
<!-- Format chuẩn để khách hàng dùng -->
<script src="https://cdn.yourapp.com/widget.js" 
        data-public-key="pk_live_xxx">
</script>
```

Widget tự detect `data-public-key` và dùng làm auth header.

---

## Subtask 2.6 — Build production bundle

```bash
cd apps/widget-sdk
npm run build
# Verify: dist/widget.js có kích thước < 50KB gzip không?
ls -la dist/widget.js
gzip -c dist/widget.js | wc -c
```

---

## Checklist hoàn thành

- [ ] Đọc và hiểu toàn bộ `apps/widget-sdk/src/api/`
- [ ] Widget gọi đúng endpoint (`/api/v1/chat` hoặc `/api/v1/chat/stream`)
- [ ] Header `X-Widget-Key` được gửi đúng
- [ ] SSE parse đúng format `data: {"chunk": "...", "done": bool}`
- [ ] Test với `index.html` + backend thật → chat hoạt động
- [ ] Rich component render (ít nhất text response)
- [ ] Production build < 50KB gzip
- [ ] Cập nhật `PROGRESS.md`
