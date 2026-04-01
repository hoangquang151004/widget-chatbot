# Thiết kế Database

## Tổng quan

Database chính của hệ thống dùng **PostgreSQL 15+**.
Mỗi tenant được phân lập theo `tenant_id` (row-level isolation).
Credentials DB của khách được mã hoá AES-256 trước khi lưu.

---

## Sơ đồ quan hệ

```
tenants
  ├──< tenant_keys          (1 tenant : 2 keys — public + admin)
  ├──1 tenant_configs       (cấu hình widget)
  ├──< tenant_allowed_origins
  ├──< tenant_databases     (DB credentials của khách)
  ├──< tenant_documents     (tài liệu RAG)
  ├──< chat_sessions
  │       └──< chat_messages
  └──< chat_analytics
```

---

## Chi tiết các bảng

### 1. `tenants` — Thông tin tenant

```sql
CREATE TABLE tenants (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  company       TEXT,
  plan          TEXT        NOT NULL DEFAULT 'starter',
  -- starter | pro | enterprise
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2. `tenant_keys` — Public key & Admin key

```sql
CREATE TABLE tenant_keys (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  key_type      TEXT        NOT NULL CHECK (key_type IN ('public', 'admin')),
  -- public  → pk_live_xxx  — nhúng vào widget shop
  -- admin   → sk_live_xxx  — dùng trong dashboard, không bao giờ public

  key_value     TEXT        NOT NULL UNIQUE,
  -- public: pk_live_<24 random bytes urlsafe>
  -- admin:  sk_live_<32 random bytes urlsafe>

  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (tenant_id, key_type)  -- mỗi tenant chỉ có 1 public + 1 admin key
);

CREATE INDEX idx_tenant_keys_value ON tenant_keys (key_value);
CREATE INDEX idx_tenant_keys_tenant ON tenant_keys (tenant_id);
```

**Quy tắc sinh key:**
```
public_key : pk_live_<secrets.token_urlsafe(24)>
admin_key  : sk_live_<secrets.token_urlsafe(32)>
```

---

### 3. `tenant_allowed_origins` — Danh sách origin được phép

```sql
CREATE TABLE tenant_allowed_origins (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  origin        TEXT        NOT NULL,
  -- vd: https://shop.example.com  (không có trailing slash)
  note          TEXT,
  -- ghi chú: "shop chính", "staging", "localhost dev"
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (tenant_id, origin)
);

CREATE INDEX idx_origins_tenant ON tenant_allowed_origins (tenant_id);
```

**Lý do tách bảng riêng** thay vì `TEXT[]`:
- Dễ thêm/xoá từng origin qua API.
- Có thể ghi chú từng origin.
- Query index hiệu quả hơn.

---

### 4. `tenant_configs` — Cấu hình widget

```sql
CREATE TABLE tenant_configs (
  tenant_id       UUID    PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  primary_color   TEXT    NOT NULL DEFAULT '#2563eb',
  logo_url        TEXT,
  bot_name        TEXT    NOT NULL DEFAULT 'Trợ lý AI',
  greeting        TEXT    NOT NULL DEFAULT 'Xin chào! Tôi có thể giúp gì cho bạn?',
  position        TEXT    NOT NULL DEFAULT 'bottom-right',
  -- bottom-right | bottom-left
  language        TEXT    NOT NULL DEFAULT 'vi',
  -- vi | en
  show_sources    BOOLEAN NOT NULL DEFAULT TRUE,
  -- hiển thị nguồn tài liệu RAG không
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 5. `tenant_databases` — DB credentials của khách

```sql
CREATE TABLE tenant_databases (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Thông tin kết nối (db_user và db_password được mã hoá AES-256)
  db_type         TEXT        NOT NULL DEFAULT 'postgresql',
  -- postgresql | mysql
  db_host         TEXT        NOT NULL,
  db_port         INTEGER     NOT NULL DEFAULT 5432,
  db_name         TEXT        NOT NULL,
  db_user_enc     BYTEA       NOT NULL,  -- encrypted
  db_password_enc BYTEA       NOT NULL,  -- encrypted AES-256-GCM
  db_ssl          BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Danh sách bảng Text-to-SQL được phép query
  allowed_tables  TEXT[]      NOT NULL DEFAULT '{}',
  -- vd: ['products', 'orders', 'customers', 'categories']

  -- Schema cache (LLM cần biết cấu trúc để gen SQL)
  schema_cache    JSONB,
  -- vd: { "products": ["id","name","price","stock"], "orders": [...] }
  schema_synced_at TIMESTAMPTZ,

  -- Trạng thái kết nối
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  last_tested_at  TIMESTAMPTZ,
  last_test_ok    BOOLEAN,
  last_test_error TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenant_db_tenant ON tenant_databases (tenant_id);
```

**Encryption flow:**
```
plaintext password
      │
      ▼ AES-256-GCM (key = APP_ENCRYPTION_KEY từ env)
      │
BYTEA lưu vào db_password_enc

Khi dùng:
db_password_enc → decrypt → kết nối DB khách
```

---

### 6. `tenant_documents` — Tài liệu RAG

```sql
CREATE TABLE tenant_documents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Thông tin file
  filename        TEXT        NOT NULL,
  file_type       TEXT        NOT NULL,
  -- pdf | docx | txt
  file_size       INTEGER     NOT NULL,  -- bytes
  storage_path    TEXT        NOT NULL,
  -- đường dẫn lưu file: local path hoặc S3 key

  -- Trạng thái ingestion
  status          TEXT        NOT NULL DEFAULT 'pending',
  -- pending | processing | done | error
  error_message   TEXT,

  -- Kết quả sau ingestion
  chunk_count     INTEGER,
  -- số lượng chunk đã embed vào Qdrant
  qdrant_ids      TEXT[],
  -- danh sách point ID trong Qdrant (để xoá khi cần)

  -- Metadata
  uploaded_by     TEXT,
  -- email admin upload
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ
);

CREATE INDEX idx_documents_tenant   ON tenant_documents (tenant_id);
CREATE INDEX idx_documents_status   ON tenant_documents (status);
```

---

### 7. `chat_sessions` — Phiên hội thoại

```sql
CREATE TABLE chat_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Định danh người dùng cuối (anonymous hoặc có account)
  visitor_id      TEXT        NOT NULL,
  -- fingerprint hoặc user_id từ trang khách truyền vào
  visitor_meta    JSONB,
  -- vd: { "name": "Nguyễn A", "email": "a@gmail.com", "page": "/products" }

  -- Trạng thái
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  message_count   INTEGER     NOT NULL DEFAULT 0,

  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ
);

CREATE INDEX idx_sessions_tenant  ON chat_sessions (tenant_id);
CREATE INDEX idx_sessions_visitor ON chat_sessions (visitor_id);
CREATE INDEX idx_sessions_active  ON chat_sessions (tenant_id, is_active);
```

---

### 8. `chat_messages` — Tin nhắn

```sql
CREATE TABLE chat_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  tenant_id       UUID        NOT NULL,
  -- denormalize để query analytics nhanh

  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT        NOT NULL,

  -- Metadata xử lý AI
  intent          TEXT,
  -- rag | sql | action | general
  component_type  TEXT,
  -- product_grid | chart_bar | order_history | ...
  component_data  JSONB,
  -- toàn bộ JSON payload của component

  -- RAG metadata
  rag_sources     JSONB,
  -- [{ "document_id": "...", "filename": "...", "page": 2, "score": 0.87 }]

  -- SQL metadata
  sql_query       TEXT,
  -- câu SQL đã thực thi (để debug)
  sql_row_count   INTEGER,

  -- Hiệu năng
  latency_ms      INTEGER,
  -- thời gian xử lý tổng (ms)
  token_count     INTEGER,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON chat_messages (session_id);
CREATE INDEX idx_messages_tenant  ON chat_messages (tenant_id);
CREATE INDEX idx_messages_intent  ON chat_messages (tenant_id, intent);
CREATE INDEX idx_messages_created ON chat_messages (tenant_id, created_at DESC);
```

---

### 9. `chat_analytics` — Thống kê tổng hợp (aggregate theo ngày)

```sql
CREATE TABLE chat_analytics (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date                DATE    NOT NULL,

  -- Volume
  total_sessions      INTEGER NOT NULL DEFAULT 0,
  total_messages      INTEGER NOT NULL DEFAULT 0,
  unique_visitors     INTEGER NOT NULL DEFAULT 0,

  -- Intent breakdown
  rag_count           INTEGER NOT NULL DEFAULT 0,
  sql_count           INTEGER NOT NULL DEFAULT 0,
  action_count        INTEGER NOT NULL DEFAULT 0,
  general_count       INTEGER NOT NULL DEFAULT 0,

  -- Component breakdown
  product_grid_count  INTEGER NOT NULL DEFAULT 0,
  chart_count         INTEGER NOT NULL DEFAULT 0,
  order_history_count INTEGER NOT NULL DEFAULT 0,
  payment_form_count  INTEGER NOT NULL DEFAULT 0,

  -- Performance
  avg_latency_ms      INTEGER,
  error_count         INTEGER NOT NULL DEFAULT 0,

  UNIQUE (tenant_id, date)
);

CREATE INDEX idx_analytics_tenant_date ON chat_analytics (tenant_id, date DESC);
```

> Bảng này được cập nhật bởi **Celery beat job** chạy mỗi 5 phút — aggregate từ `chat_messages`.

---

## Tóm tắt tất cả bảng

| Bảng | Mô tả | Ghi chú |
|---|---|---|
| `tenants` | Thông tin khách hàng (tenant) | Core |
| `tenant_keys` | Public key + Admin key | index trên `key_value` |
| `tenant_allowed_origins` | Danh sách origin được phép | Bảo mật CORS |
| `tenant_configs` | Cấu hình giao diện widget | 1-1 với tenant |
| `tenant_databases` | DB credentials của khách | Encrypt AES-256 |
| `tenant_documents` | File tài liệu RAG | Track ingestion status |
| `chat_sessions` | Phiên hội thoại | Theo visitor |
| `chat_messages` | Từng tin nhắn | Lưu component data |
| `chat_analytics` | Thống kê theo ngày | Aggregate job |

---

## Alembic migration

```bash
# Tạo migration
alembic revision --autogenerate -m "init schema"

# Apply
alembic upgrade head

# Rollback 1 bước
alembic downgrade -1
```

---

## Indexes quan trọng

```sql
-- Lookup key (hot path — mọi request đều qua đây)
CREATE INDEX idx_tenant_keys_value ON tenant_keys (key_value);

-- Origin check (hot path)
CREATE INDEX idx_origins_tenant ON tenant_allowed_origins (tenant_id);

-- Chat analytics
CREATE INDEX idx_messages_tenant  ON chat_messages (tenant_id);
CREATE INDEX idx_messages_created ON chat_messages (tenant_id, created_at DESC);
CREATE INDEX idx_analytics_tenant_date ON chat_analytics (tenant_id, date DESC);
```

---

## Lưu ý bảo mật

- `db_user_enc`, `db_password_enc` dùng **AES-256-GCM**, key lưu trong env `APP_ENCRYPTION_KEY`.
- `admin_key` (`sk_live_...`) không bao giờ xuất hiện trong widget frontend.
- Mọi query SQL của tenant đều có `WHERE tenant_id = ?` — không thể cross-tenant.
- DB user của khách cung cấp nên chỉ có quyền **SELECT** trên các bảng được phép.
