"""Kiểm tra hạn mức widget chat (Bearer / API key đã gắn tenant)."""

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.future import select

from core.plan_limits import chat_quota_exceeded, normalize_plan
from db.session import async_session
from models.tenant import Tenant


async def ensure_widget_chat_allowed(tenant_id: str) -> None:
    """HTTP 429 nếu tenant đã hết hạn mức câu hỏi (theo gói)."""
    try:
        tid = UUID(str(tenant_id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail="tenant_id không hợp lệ") from e

    async with async_session() as session:
        result = await session.execute(select(Tenant.plan).where(Tenant.id == tid))
        row = result.first()
        plan = normalize_plan(row[0] if row else None)
        if await chat_quota_exceeded(session, tid, plan):
            raise HTTPException(
                status_code=429,
                detail="Đã đạt hạn mức tin nhắn AI theo gói hiện tại. Vui lòng nâng cấp hoặc chờ kế tiếp.",
            )
