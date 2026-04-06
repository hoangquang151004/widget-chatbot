"""
B-008: Unit tests cho SQL validator và Admin helpers.
Chạy: cd apps/api; .venv/Scripts/python -m pytest tests/test_backend.py -v
"""
import pytest

from ai.sql.executor import _validate_sql


# ─────────────────────────────────────────────────────────────────────────────
# Test SQL validation (executor pipeline; LIMIT do LLM/generator)
# ─────────────────────────────────────────────────────────────────────────────

class TestSQLValidate:
    def test_valid_select(self):
        sql = "SELECT id, name FROM users"
        _validate_sql(sql)

    def test_drop_blocked(self):
        with pytest.raises(ValueError, match="cấm"):
            _validate_sql("DROP TABLE users")

    def test_delete_blocked(self):
        with pytest.raises(ValueError, match="cấm"):
            _validate_sql("DELETE FROM users WHERE 1=1")

    def test_update_blocked(self):
        with pytest.raises(ValueError, match="cấm"):
            _validate_sql("UPDATE users SET name='x'")

    def test_insert_blocked(self):
        with pytest.raises(ValueError, match="cấm"):
            _validate_sql("INSERT INTO users VALUES (1, 'a')")

    def test_truncate_blocked(self):
        with pytest.raises(ValueError, match="cấm"):
            _validate_sql("TRUNCATE TABLE users")

    def test_non_select_blocked(self):
        with pytest.raises(ValueError, match="cấm"):
            _validate_sql("EXEC sp_dangerous")

    def test_comment_line_ignored_for_ddl(self):
        """Comment sau -- không được coi là câu DDL thực thi."""
        sql = "SELECT * FROM users -- DROP TABLE users"
        _validate_sql(sql)

    def test_multiline_comment_no_false_delete(self):
        sql = "SELECT * FROM users /* DELETE FROM users */"
        _validate_sql(sql)


# ─────────────────────────────────────────────────────────────────────────────
# Test Admin helper: origin normalization (v2)
# ─────────────────────────────────────────────────────────────────────────────

class TestOriginNormalization:
    def test_wildcard_origin_allowed(self):
        from api.v1.admin import _normalize_origin
        assert _normalize_origin("*") == "*"

    def test_url_origin_is_normalized_to_netloc(self):
        from api.v1.admin import _normalize_origin
        result = _normalize_origin("https://Example.com/")
        assert result == "example.com"

    def test_origin_with_path_is_rejected(self):
        from api.v1.admin import _normalize_origin
        with pytest.raises(Exception):
            _normalize_origin("example.com/path")


# ─────────────────────────────────────────────────────────────────────────────
# Test SecurityUtils (AES encryption)
# ─────────────────────────────────────────────────────────────────────────────

class TestSecurityUtils:
    def test_encrypt_decrypt_roundtrip(self):
        """Dữ liệu mã hoá rồi giải mã phải khớp với gốc."""
        from core.security import security_utils
        original = "super_secret_password_123!"
        encrypted = security_utils.encrypt(original)
        decrypted = security_utils.decrypt(encrypted)
        assert decrypted == original

    def test_encrypted_is_different(self):
        """Ciphertext phải khác plaintext."""
        from core.security import security_utils
        original = "my_password"
        encrypted = security_utils.encrypt(original)
        assert encrypted != original

    def test_is_public_key(self):
        from core.security import security_utils
        assert security_utils.is_public_key("pk_live_abc123") is True
        assert security_utils.is_public_key("sk_live_abc123") is False

    def test_is_secret_key(self):
        from core.security import security_utils
        assert security_utils.is_secret_key("sk_live_abc123") is True
        assert security_utils.is_secret_key("pk_live_abc123") is False

    def test_generate_api_key_format(self):
        from core.security import security_utils
        key = security_utils.generate_api_key("pk_live")
        assert key.startswith("pk_live_")
        assert len(key) > 20
