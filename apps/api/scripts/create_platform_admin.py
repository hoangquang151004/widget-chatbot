"""
Tạo tài khoản platform_admin (Super Admin) trong bảng tenants.

Không dùng API đăng ký công khai. Chạy sau khi đã alembic upgrade (cột role).

Ví dụ:
  cd apps/api
  .venv/Scripts/python scripts/create_platform_admin.py --email admin@example.com --password 'YourSecurePass1!'

Hoặc biến môi trường:
  set PLATFORM_ADMIN_EMAIL=...
  set PLATFORM_ADMIN_PASSWORD=...
  .venv/Scripts/python scripts/create_platform_admin.py
"""
from __future__ import annotations

import argparse
import asyncio
import os
import sys
import uuid

from sqlalchemy.future import select

# Allow running as script from apps/api
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.security import security_utils  # noqa: E402
from db.session import async_session  # noqa: E402
from models.tenant import Tenant  # noqa: E402

DEFAULT_NAME = "Platform Administrator"


async def main_async(email: str, password: str, display_name: str) -> int:
    if len(password) < 8:
        print("Mật khẩu phải có ít nhất 8 ký tự.", file=sys.stderr)
        return 1

    async with async_session() as session:
        result = await session.execute(select(Tenant).filter(Tenant.email == email))
        existing = result.scalars().first()
        if existing:
            if existing.role != "platform_admin":
                print(
                    f"Email {email} đã tồn tại với role={existing.role}. "
                    "Không ghi đè — dùng email khác hoặc cập nhật thủ công.",
                    file=sys.stderr,
                )
                return 1
            existing.password_hash = security_utils.hash_password(password)
            existing.name = display_name or existing.name
            await session.commit()
            print(f"Đã cập nhật mật khẩu / tên cho platform admin: {email}")
            return 0

        tenant = Tenant(
            id=uuid.uuid4(),
            name=display_name,
            email=email,
            password_hash=security_utils.hash_password(password),
            plan="enterprise",
            role="platform_admin",
            is_active=True,
        )
        session.add(tenant)
        await session.commit()
        print(f"Đã tạo platform admin: {email} (id={tenant.id})")
        return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Tạo hoặc reset mật khẩu platform admin.")
    parser.add_argument("--email", default=os.getenv("PLATFORM_ADMIN_EMAIL", "").strip())
    parser.add_argument("--password", default=os.getenv("PLATFORM_ADMIN_PASSWORD", ""))
    parser.add_argument("--name", default=os.getenv("PLATFORM_ADMIN_NAME", DEFAULT_NAME))
    args = parser.parse_args()

    if not args.email or not args.password:
        print(
            "Thiếu email hoặc mật khẩu. Dùng --email / --password hoặc "
            "PLATFORM_ADMIN_EMAIL / PLATFORM_ADMIN_PASSWORD.",
            file=sys.stderr,
        )
        sys.exit(1)

    code = asyncio.run(main_async(args.email, args.password, args.name))
    sys.exit(code)


if __name__ == "__main__":
    main()
