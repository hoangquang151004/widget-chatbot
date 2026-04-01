-- Embeddable AI Chatbot Widget - Database Schema
-- Target: PostgreSQL 15+

-- 0. Extensions (Nếu cần cho các bản cũ hơn, bản 15+ gen_random_uuid() đã có sẵn)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Bảng tenants (Thông tin khách hàng)
CREATE TABLE tenants (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    email         TEXT        NOT NULL UNIQUE,
    company       TEXT,
    plan          TEXT        NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bảng tenant_keys (Public & Admin keys)
CREATE TABLE tenant_keys (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key_type      TEXT        NOT NULL CHECK (key_type IN ('public', 'admin')),
    key_value     TEXT        NOT NULL UNIQUE,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    last_used_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, key_type)
);
CREATE INDEX idx_tenant_keys_value ON tenant_keys (key_value);

-- 3. Bảng tenant_allowed_origins (Bảo mật CORS)
CREATE TABLE tenant_allowed_origins (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    origin        TEXT        NOT NULL,
    note          TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, origin)
);
CREATE INDEX idx_origins_tenant ON tenant_allowed_origins (tenant_id);

-- 4. Bảng tenant_configs (Cấu hình widget UI)
CREATE TABLE tenant_configs (
    tenant_id       UUID        PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    primary_color   TEXT        NOT NULL DEFAULT '#2563eb',
    logo_url        TEXT,
    bot_name        TEXT        NOT NULL DEFAULT 'Trợ lý AI',
    greeting        TEXT        NOT NULL DEFAULT 'Xin chào! Tôi có thể giúp gì cho bạn?',
    position        TEXT        NOT NULL DEFAULT 'bottom-right' CHECK (position IN ('bottom-right', 'bottom-left')),
    language        TEXT        NOT NULL DEFAULT 'vi',
    show_sources    BOOLEAN     NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bảng tenant_databases (DB khách hàng - Encrypted)
CREATE TABLE tenant_databases (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    db_type          TEXT        NOT NULL DEFAULT 'postgresql' CHECK (db_type IN ('postgresql', 'mysql')),
    db_host          TEXT        NOT NULL,
    db_port          INTEGER     NOT NULL DEFAULT 5432,
    db_name          TEXT        NOT NULL,
    db_user_enc      BYTEA       NOT NULL,
    db_password_enc  BYTEA       NOT NULL,
    db_ssl           BOOLEAN     NOT NULL DEFAULT TRUE,
    allowed_tables   TEXT[]      NOT NULL DEFAULT '{}',
    schema_cache     JSONB,
    schema_synced_at TIMESTAMPTZ,
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    last_tested_at   TIMESTAMPTZ,
    last_test_ok     BOOLEAN,
    last_test_error  TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tenant_db_tenant ON tenant_databases (tenant_id);

-- 6. Bảng tenant_documents (Tài liệu RAG)
CREATE TABLE tenant_documents (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    filename        TEXT        NOT NULL,
    file_type       TEXT        NOT NULL,
    file_size       INTEGER     NOT NULL,
    storage_path    TEXT        NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
    error_message   TEXT,
    chunk_count     INTEGER,
    qdrant_ids      TEXT[],
    uploaded_by     TEXT,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMPTZ
);
CREATE INDEX idx_documents_tenant ON tenant_documents (tenant_id);
CREATE INDEX idx_documents_status ON tenant_documents (status);

-- 7. Bảng chat_sessions (Phiên hội thoại)
CREATE TABLE chat_sessions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    visitor_id      TEXT        NOT NULL,
    visitor_meta    JSONB,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    message_count   INTEGER     NOT NULL DEFAULT 0,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);
CREATE INDEX idx_sessions_tenant  ON chat_sessions (tenant_id);
CREATE INDEX idx_sessions_visitor ON chat_sessions (visitor_id);
CREATE INDEX idx_sessions_active  ON chat_sessions (tenant_id, is_active);

-- 8. Bảng chat_messages (Tin nhắn chi tiết)
CREATE TABLE chat_messages (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    tenant_id       UUID        NOT NULL,
    role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content         TEXT        NOT NULL,
    intent          TEXT,
    component_type  TEXT,
    component_data  JSONB,
    rag_sources     JSONB,
    sql_query       TEXT,
    sql_row_count   INTEGER,
    latency_ms      INTEGER,
    token_count     INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_session ON chat_messages (session_id);
CREATE INDEX idx_messages_tenant  ON chat_messages (tenant_id);
CREATE INDEX idx_messages_created ON chat_messages (tenant_id, created_at DESC);

-- 9. Bảng chat_analytics (Thống kê tổng hợp)
CREATE TABLE chat_analytics (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date                DATE    NOT NULL,
    total_sessions      INTEGER NOT NULL DEFAULT 0,
    total_messages      INTEGER NOT NULL DEFAULT 0,
    unique_visitors     INTEGER NOT NULL DEFAULT 0,
    rag_count           INTEGER NOT NULL DEFAULT 0,
    sql_count           INTEGER NOT NULL DEFAULT 0,
    action_count        INTEGER NOT NULL DEFAULT 0,
    general_count       INTEGER NOT NULL DEFAULT 0,
    product_grid_count  INTEGER NOT NULL DEFAULT 0,
    chart_count         INTEGER NOT NULL DEFAULT 0,
    order_history_count INTEGER NOT NULL DEFAULT 0,
    payment_form_count  INTEGER NOT NULL DEFAULT 0,
    avg_latency_ms      INTEGER,
    error_count         INTEGER NOT NULL DEFAULT 0,
    UNIQUE (tenant_id, date)
);
CREATE INDEX idx_analytics_tenant_date ON chat_analytics (tenant_id, date DESC);
