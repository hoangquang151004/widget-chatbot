import os
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from typing import Optional, Union
from core.config import settings

class SecurityUtils:
    """Utilities for encryption, key validation and security."""
    
    @staticmethod
    def is_public_key(key: str) -> bool:
        """Checks if key starts with pk_live_."""
        return key.startswith("pk_live_")

    @staticmethod
    def is_secret_key(key: str) -> bool:
        """Checks if key starts with sk_live_."""
        return key.startswith("sk_live_")

    @staticmethod
    def generate_api_key(prefix: str) -> str:
        """Generates a secure random API key with given prefix."""
        import secrets
        return f"{prefix}_{secrets.token_urlsafe(32)}"

    @classmethod
    def encrypt(cls, data: str) -> str:
        """
        Encrypts data using AES-256-GCM.
        Used for tenant DB credentials.
        """
        key = cls._derive_key(settings.APP_ENCRYPTION_KEY)
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)
        ciphertext = aesgcm.encrypt(nonce, data.encode(), None)
        # Format: base64(nonce + ciphertext)
        return base64.b64encode(nonce + ciphertext).decode('utf-8')

    @classmethod
    def decrypt(cls, encrypted_data: str) -> str:
        """Decrypts AES-256-GCM encrypted data."""
        try:
            data = base64.b64decode(encrypted_data)
            nonce = data[:12]
            ciphertext = data[12:]
            key = cls._derive_key(settings.APP_ENCRYPTION_KEY)
            aesgcm = AESGCM(key)
            decrypted_data = aesgcm.decrypt(nonce, ciphertext, None)
            return decrypted_data.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Failed to decrypt data: {str(e)}")

    @staticmethod
    def _derive_key(raw_key: str) -> bytes:
        """Derives a 32-byte key from string using SHA256."""
        digest = hashes.Hash(hashes.SHA256())
        digest.update(raw_key.encode())
        return digest.finalize()

security_utils = SecurityUtils()
