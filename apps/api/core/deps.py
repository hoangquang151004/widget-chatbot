"""FastAPI dependencies for admin routes."""

from fastapi import HTTPException, Request

TENANT_ROLE = "tenant"
PLATFORM_ADMIN_ROLE = "platform_admin"


def require_tenant_account(request: Request) -> None:
    """Chỉ tài khoản khách hàng (tenant) được dùng endpoint quản trị theo tenant."""
    role = getattr(request.state, "user_role", None)
    if role != TENANT_ROLE:
        raise HTTPException(
            status_code=403,
            detail="Tài khoản quản trị nền tảng không dùng được tính năng này.",
        )
