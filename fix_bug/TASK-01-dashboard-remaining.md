# TASK-01 — Dashboard Remaining Pages

**Ưu tiên**: 🔴 High  
**Ước tính**: 3–4 giờ  
**Phụ thuộc**: `apps/api` đang chạy ở port 8001

---

## Bối cảnh

Dashboard đã có:
- ✅ `/dashboard` — Overview
- ✅ `/dashboard/knowledge-base` — Upload/list/delete docs

Cần kiểm tra và implement nốt:
- `/dashboard/database` — Cấu hình DB credentials của tenant
- `/dashboard/keys` — Quản lý API keys
- `/dashboard/settings` — Cấu hình widget (nếu route đã có)
- `/dashboard/billing` — Placeholder

**Auth pattern**: Dùng `useAuth()` từ `contexts/AuthContext.tsx`, gọi API qua `adminApi.*` từ `lib/api.ts`.

---

## Subtask 1.1 — `/dashboard/database`

**File**: `apps/web/src/app/(dashboard)/dashboard/database/page.tsx`

Nếu chưa có → tạo mới. Nếu có → kiểm tra và hoàn thiện.

### UI cần có
```
┌─────────────────────────────────────────┐
│ Kết nối Database                         │
├─────────────────────────────────────────┤
│ [Hiển thị config hiện tại nếu đã setup] │
│                                          │
│ Form:                                    │
│   DB Type:     [PostgreSQL ▼]            │
│   Host:        [___________]             │
│   Port:        [5432]                    │
│   Database:    [___________]             │
│   Username:    [___________]             │
│   Password:    [***********] (masked)    │
│                                          │
│   [Test kết nối]  [Lưu cấu hình]        │
└─────────────────────────────────────────┘
```

### Logic
1. `useEffect` → gọi `adminApi.getDbConfig()` → populate form nếu đã có config
2. "Test kết nối": Gọi backend endpoint test (nếu chưa có endpoint này → bỏ qua, chỉ save)
3. "Lưu cấu hình": Gọi `adminApi.saveDbConfig(formData)` → toast success/error
4. Password field: placeholder `••••••••` nếu đã có config, chỉ submit khi user nhập mới

### API
```typescript
// Đã có trong lib/api.ts:
adminApi.getDbConfig()    // GET /api/v1/admin/database
adminApi.saveDbConfig(config)  // POST /api/v1/admin/database
```

### Schema interface (đã có trong lib/api.ts)
```typescript
interface DbConfig {
  db_type: string;
  db_host: string;
  db_port: number;
  db_name: string;
  db_username: string;
  db_password?: string;
}
```

---

## Subtask 1.2 — `/dashboard/keys`

**File**: `apps/web/src/app/(dashboard)/dashboard/keys/page.tsx`

### UI cần có
```
┌─────────────────────────────────────────────────┐
│ API Keys                                          │
├─────────────────────────────────────────────────┤
│  Public Key (nhúng vào website)                  │
│  ┌─────────────────────────────────┐  [Copy]     │
│  │ pk_live_xxxxxxxxxxxxxxxxxxxxx   │             │
│  └─────────────────────────────────┘             │
│  ⓘ Key này an toàn để hiển thị trong HTML       │
│                                                   │
│  Secret Key (chỉ dùng trong dashboard)           │
│  ┌─────────────────────────────────┐  [Copy]     │
│  │ sk_live_•••••••••••••••••••••   │  [Hiện]     │
│  └─────────────────────────────────┘             │
│  ⚠ Không bao giờ chia sẻ key này                │
│                                                   │
│  [🔄 Xoay vòng keys mới]                         │
│   ↳ Dialog xác nhận: "Keys cũ sẽ hết hiệu lực   │
│     ngay lập tức. Bạn có chắc không?"            │
└─────────────────────────────────────────────────┘
```

### Logic
1. Lấy keys từ `useAuth()` → `tenant.public_key` và `tenant.secret_key`
2. Secret key: hiển thị masked (`sk_live_` + `•` x 20), có nút toggle show/hide
3. Copy button: dùng `navigator.clipboard.writeText()` → toast "Đã sao chép"
4. Rotate keys:
   - Click → mở confirm dialog
   - Confirm → gọi `adminApi.rotateKeys()`
   - Success → gọi `refreshTenant()` từ `useAuth()` để reload keys mới
   - Hiển thị toast với keys mới

### API
```typescript
// Đã có trong lib/api.ts:
adminApi.rotateKeys()  // POST /api/v1/admin/rotate-keys
// Sau rotate → gọi refreshTenant() để cập nhật context
```

### Embed code snippet
Hiển thị snippet để nhúng widget:
```html
<script src="https://cdn.yourapp.com/widget.js" 
        data-public-key="pk_live_xxx">
</script>
```
Có nút Copy.

---

## Subtask 1.3 — `/dashboard/settings`

**File**: `apps/web/src/app/(dashboard)/dashboard/settings/page.tsx`

> ⚠️ Backend chưa có endpoint lưu widget settings (màu, tên bot, v.v.).
> **Tạm thời**: Chỉ implement UI + localStorage, hoặc để "Coming soon".
> Sau MVP sẽ thêm `GET/PUT /api/v1/admin/widget-config`.

### UI (đơn giản - không cần backend)
```
┌──────────────────────────────────────┐
│ Cài đặt Widget                        │
├──────────────────────────────────────┤
│ Tên bot:      [Trợ lý AI_______]     │
│ Màu chủ đạo:  [#2563eb] ████         │
│ Placeholder:  [Nhập câu hỏi..._]     │
│ Vị trí:       [● Bottom Right]       │
│               [ Bottom Left  ]       │
│                                      │
│ Preview snippet:                     │
│  <script ... data-bot-name="..."     │
│            data-color="#2563eb">     │
│                                      │
│  [Lưu vào localStorage] (tạm thời)  │
└──────────────────────────────────────┘
```

---

## Subtask 1.4 — `/dashboard/billing`

**File**: `apps/web/src/app/(dashboard)/dashboard/billing/page.tsx`

Chỉ cần placeholder đơn giản:
```tsx
export default function BillingPage() {
  return (
    <div className="p-8">
      <h2>Thanh toán</h2>
      <p>Tính năng thanh toán sẽ sớm ra mắt.</p>
    </div>
  )
}
```

---

## Subtask 1.5 — Tenant Registration Page

**File**: `apps/web/src/app/register/page.tsx` (tạo mới)

### Tại sao cần
Hiện tại không có cách đăng ký tenant mới qua UI. Backend đã có `POST /api/v1/admin/register`.

### UI
```
┌──────────────────────────────────┐
│ Tạo tài khoản                     │
├──────────────────────────────────┤
│ Tên doanh nghiệp: [___________]  │
│ Slug (unique):    [___________]  │
│                                  │
│ [Tạo tài khoản]                  │
│                                  │
│ Đã có tài khoản? → Đăng nhập     │
└──────────────────────────────────┘
```

Sau register → backend trả về `public_key` + `secret_key` → hiển thị với **hướng dẫn lưu lại** → redirect `/login`.

### API (backend đã có)
```
POST /api/v1/admin/register
Body: { name, slug, allowed_origins }
Response: { tenant_id, public_key, secret_key }
```

---

## Checklist hoàn thành

- [ ] `/dashboard/database` implement xong, test với backend thật
- [ ] `/dashboard/keys` implement xong, rotate keys hoạt động
- [ ] `/dashboard/settings` implement (localStorage hoặc "coming soon")
- [ ] `/dashboard/billing` placeholder done
- [ ] `/register` page implement xong
- [ ] Sidebar links đều dẫn đến đúng trang (không bị 404)
- [ ] Cập nhật `PROGRESS.md` sau khi hoàn thành
