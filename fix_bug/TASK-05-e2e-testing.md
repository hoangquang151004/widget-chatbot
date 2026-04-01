# TASK-05 — End-to-End Integration Testing

**Ưu tiên**: 🟢 Normal  
**Ước tính**: 3–4 giờ  
**Phụ thuộc**: TASK-01, TASK-02, TASK-03 hoàn thành

---

## Mục tiêu

Đảm bảo toàn bộ flow từ đầu đến cuối hoạt động trơn tru trước khi demo.

---

## Flow 1: Tenant Onboarding

### Bước 1: Đăng ký tenant
```bash
curl -X POST http://localhost:8001/api/v1/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "slug": "test-company",
    "allowed_origins": ["http://localhost:3000", "http://localhost:5173"]
  }'
```
**Expect**: 201 với `public_key` và `secret_key`

### Bước 2: Login dashboard
- Mở `http://localhost:3000/login`
- Nhập `secret_key` từ bước 1
- **Expect**: Redirect sang `/dashboard`, tên công ty hiện đúng

### Bước 3: Kiểm tra Overview
- **Expect**: Stats cards hiện (0 documents, slug đúng, Active)
- Embed code snippet có `public_key` đúng

---

## Flow 2: RAG Pipeline

### Bước 1: Upload document
- Dashboard → Knowledge Base → Upload file PDF/DOCX
- **Expect**: Document xuất hiện với status `pending` → `processing` → `done` (trong vài giây)

### Bước 2: Test chat qua API
```bash
curl -X POST http://localhost:8001/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_YOUR_SECRET_KEY" \
  -d '{
    "query": "[câu hỏi về nội dung trong document đã upload]",
    "session_id": "test-rag-1"
  }'
```
**Expect**: 
- `intent` = RAG
- `content` chứa thông tin từ document
- `citations` có `filename` và `score`

### Bước 3: Test qua Widget
- Mở `apps/widget-sdk/index.html`
- Nhập `public_key` vào widget script
- Gõ câu hỏi về document → verify response có từ trong document

---

## Flow 3: Text-to-SQL

### Bước 1: Cấu hình DB
- Dashboard → Database
- Nhập credentials của database thật (PostgreSQL hoặc MySQL)
- Click Save

### Bước 2: Test SQL query
```bash
curl -X POST http://localhost:8001/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_YOUR_SECRET_KEY" \
  -d '{
    "query": "có bao nhiêu records trong database?",
    "session_id": "test-sql-1"
  }'
```
**Expect**:
- `intent` = SQL
- `content` có số liệu thực từ DB
- `metadata.sql` có câu SQL đã thực thi (chỉ SELECT)

---

## Flow 4: Widget Integration

### Test embed thật
Tạo file `test-embed.html`:
```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Test Widget Embed</title>
</head>
<body>
  <h1>Trang web của khách hàng</h1>
  <p>Đây là trang demo nhúng chatbot widget.</p>
  <p>Lorem ipsum dolor sit amet...</p>

  <script 
    src="http://localhost/cdn/widget.js"
    data-public-key="pk_live_YOUR_PUBLIC_KEY"
    data-api-url="http://localhost:8001"
    data-bot-name="Trợ lý Demo">
  </script>
</body>
</html>
```

### Checklist test widget
- [ ] Widget bubble xuất hiện
- [ ] Click mở chat window
- [ ] Gõ "xin chào" → Gemini trả lời (GENERAL)
- [ ] Gõ câu hỏi về document → RAG trả lời có citations
- [ ] Chat history persist khi đóng/mở lại (localStorage)
- [ ] Widget không làm crash JS của trang host
- [ ] CSS widget không leak ra trang host (Shadow DOM)

---

## Flow 5: Key Management

### Rotate keys
```bash
# Rotate
curl -X POST http://localhost:8001/api/v1/admin/rotate-keys \
  -H "X-API-Key: sk_live_OLD_KEY"
```
**Expect**: Keys mới trả về, keys cũ không hoạt động nữa

### Verify old key invalid
```bash
curl http://localhost:8001/api/v1/admin/me \
  -H "X-API-Key: sk_live_OLD_KEY"
```
**Expect**: 401 Unauthorized

---

## Flow 6: Document Delete

```bash
curl -X DELETE http://localhost:8001/api/v1/files/DOC_ID_HERE \
  -H "X-API-Key: sk_live_YOUR_KEY"
```
**Expect**: 200 OK

Sau đó chat hỏi lại → Qdrant không còn trả document này.

---

## Automated Tests

**File**: `apps/api/tests/`

Chạy toàn bộ tests:
```bash
cd apps/api
.venv\Scripts\python -m pytest tests/ -v
```

Nếu tests fail → fix trước khi demo.

Kiểm tra các test cases tối thiểu:
- [ ] Test auth: public key chỉ gọi `/chat`, secret key gọi được admin endpoints
- [ ] Test origin check: request không có Origin bị block (với public key)
- [ ] Test rate limit: request thứ 61 bị reject
- [ ] Test SQL sanitize: `DROP TABLE` bị block
- [ ] Test document upload → status tracking

---

## Demo Script (cho buổi demo)

### Kịch bản demo 5 phút
```
1. [30s] Mở dashboard → đăng nhập bằng secret key
2. [30s] Trang Overview → copy embed code
3. [60s] Upload 1 file PDF → xem status live polling
4. [60s] Chat: gõ câu hỏi về file đã upload → thấy RAG response + citations
5. [60s] Mở index.html → widget embedded → gõ câu → thấy response trong widget
6. [60s] Dashboard keys → copy public key → paste vào widget → hoạt động
```

---

## Checklist hoàn thành

- [ ] Flow 1 (Onboarding) hoạt động end-to-end
- [ ] Flow 2 (RAG) hoạt động: upload → chat → citations
- [ ] Flow 3 (SQL) hoạt động nếu có test DB
- [ ] Flow 4 (Widget) hoạt động: embed → chat → response
- [ ] Flow 5 (Key rotate) hoạt động
- [ ] `pytest` chạy không có fail
- [ ] Demo script test trước ít nhất 1 lần
- [ ] Cập nhật `PROGRESS.md` với kết quả test
