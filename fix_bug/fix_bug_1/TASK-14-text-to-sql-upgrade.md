# TASK-14: Nâng cấp Text-to-SQL Pipeline (Production-ready)

## 🎯 Mục tiêu
Nâng cấp `SQLAgent` hiện tại từ mức Boilerplate lên mức Production-ready bằng cách áp dụng các kỹ thuật từ mẫu `ai-engine_2`:
1.  **Schema Management**: Caching Redis, lấy đầy đủ PK/FK.
2.  **SQL Generation**: Few-shot learning, Pre-clarification, Role-based filtering.
3.  **Execution & Security**: Self-correction loop, Strict keyword checking, Statement timeout.
4.  **Result Formatting**: Markdown Table + Natural Language Interpretation.

---

## 📋 Danh sách công việc

### Phase 1: Preparation & Schema (Dự kiến 01/04)
- [ ] **1.1. Cấu hình & Dependency**: Kiểm tra `redis-py`, `sqlparse` trong `requirements.txt`. Cập nhật `.env` cho Redis.
- [ ] **1.2. Redis Pool**: Đảm bảo backend có singleton cho Redis connection.
- [ ] **1.3. Schema Service**: Tạo `apps/api/ai/sql/schema_loader.py`.
    - Implement caching schema vào Redis (TTL 1h).
    - Lấy thông tin PK/FK để hỗ trợ JOIN tốt hơn.

### Phase 2: Core Logic (Dự kiến 01/04 - 02/04)
- [ ] **2.1. SQL Generator**: Tạo `apps/api/ai/sql/generator.py`.
    - Tích hợp Few-shot learning (tạo file `few_shot_examples.json`).
    - Thêm logic Pre-clarify cho các câu hỏi mơ hồ.
    - Inject Role-based filters (department_id, user_id).
- [ ] **2.2. SQL Executor**: Tạo `apps/api/ai/sql/executor.py`.
    - Implement strict validation (SELECT only, no multi-statements).
    - Implement **Self-correction loop**: Nếu SQL lỗi, LLM sẽ nhận thông báo lỗi để sửa lại (max 3 retries).
- [ ] **2.3. Formatter**: Tạo `apps/api/ai/sql/formatter.py`.
    - Format kết quả thành Markdown Table.
    - Gọi LLM để diễn giải dữ liệu thành câu trả lời tự nhiên.

### Phase 3: Integration & Testing (Dự kiến 02/04)
- [ ] **3.1. Refactor SQLAgent**: Cập nhật `apps/api/ai/sql_agent.py` để sử dụng các module mới thay vì logic cũ.
- [ ] **3.2. Unit Test**: Viết script test độc lập cho module SQL mới.
- [ ] **3.3. E2E Test**: Test trực tiếp từ Widget với các câu hỏi phức tạp (JOIN nhiều bảng, thống kê).

---

## 🛠️ Cấu trúc thư mục mới đề xuất
```
apps/api/ai/
├── sql/
│   ├── __init__.py
│   ├── schema_loader.py
│   ├── generator.py
│   ├── executor.py
│   ├── formatter.py
│   └── few_shot_examples.json
└── sql_agent.py (cập nhật để gọi các module trong sql/)
```

---

## 📝 Ghi chú bảo mật
- Luôn kiểm tra `Origin` và `tenant_id` trước khi thực thi bất kỳ câu SQL nào.
- Mật khẩu/Credentials của DB tenant phải được decrypt an toàn qua `TenantEngineManager`.
