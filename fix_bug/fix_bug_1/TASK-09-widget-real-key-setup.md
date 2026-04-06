# TASK-09 — Widget SDK: Setup Public Key Thật

**Ưu tiên**: 🔴 CRITICAL — Widget trả 401 với key fake  
**Ước tính**: 15 phút + setup time  
**Phát hiện**: 2026-03-29

## Vấn đề
- `test-embed.html`: `pk_live_public_key_123` → fake
- `dist/index.html`: `pk_live_TEST_DEMO_KEY_0000000000000000` → fake
- Backend trả **401 Unauthorized** → widget hiện `⚠️ Không thể kết nối`

## Bước thực hiện

### 1. Đảm bảo backend + DB chạy
```bash
curl http://localhost:8001/api/health
# → {"status": "ok"}

cd apps/api
.venv\Scripts\python -m alembic upgrade head
```

### 2. Đăng ký tenant mới
```bash
curl -X POST http://localhost:8001/api/v1/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Company",
    "slug": "demo-company",
    "allowed_origins": [
      "http://localhost:5173",
      "http://localhost:5500",
      "null"
    ]
  }'
```

Response:
```json
{
  "public_key": "pk_live_XXXXXXXXXX",
  "secret_key": "sk_live_YYYYYYYYYY"
}
```
**Lưu lại cả 2 keys!**

### 3. Update test files
```html
<!-- test-embed.html và dist/index.html -->
data-public-key="pk_live_XXXXXXXXXX"   ← key thật
```

### 4. Test bằng HTTP server (tránh file:// protocol)
```bash
cd apps/widget-sdk/dist
python -m http.server 5500
# Mở: http://localhost:5500
```

## Checklist
- [x] Backend health OK
- [x] Alembic migration chạy xong
- [x] Tenant đăng ký thành công
- [x] keys đã được lưu lại
- [x] `test-embed.html` dùng key thật
- [x] Widget chat → 200 OK (không còn 401)
- [x] Cập nhật `PROGRESS.md`
