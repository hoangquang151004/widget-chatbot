# TASK-10 — Widget SDK: Đảm bảo dist/widget.js Luôn Build Mới

**Ưu tiên**: 🟡 MEDIUM  
**Ước tính**: 30 phút  
**Phụ thuộc**: TASK-07, TASK-08 hoàn thành  
**Phát hiện**: 2026-03-29

## Vấn đề
`dist/widget.js` có thể bị lỗi thời so với `src/`. Sau khi sửa bug trong `src/`, nếu không build lại, trang khách vẫn chạy code cũ → khó debug.

## Bước thực hiện

### 1. Build lại sau mỗi lần sửa src/
```bash
cd D:\widget_chatbot\apps\widget-sdk
npm run build
```

### 2. Verify URL không còn duplicate
```bash
# Windows findstr
findstr "api/v1/chat" dist\widget.js
# Chỉ được xuất hiện 1 lần pattern /api/v1/chat
```

### 3. Verify file size hợp lý
```bash
dir dist\widget.js
# Expect: 70-120KB (minified)
```

### 4. Thêm script rebuild vào package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "rebuild": "vite build --force"
  }
}
```

## Quy tắc bắt buộc
> Sau mỗi lần sửa bất kỳ file nào trong `src/` → phải chạy `npm run build` trước khi test bằng HTML tĩnh.

## Checklist
- [x] `npm run build` không có lỗi
- [x] `dist/widget.js` có timestamp mới nhất
- [x] URL `/api/v1/chat` không bị duplicate trong dist
- [x] Team biết quy tắc: sửa src → build → test
- [x] Cập nhật `PROGRESS.md`
