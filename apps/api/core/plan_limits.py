"""Hạn mức theo gói dịch vụ — đồng bộ tasks/task_billing_plans.md."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.chat import ChatMessage

AIMessageWindow = Optional[Literal["month", "day"]]


@dataclass(frozen=True)
class PlanLimits:
    """ai_messages_cap = 0 nghĩa là không giới hạn. max_documents None = không giới hạn số file."""

    ai_messages_cap: int
    ai_messages_window: AIMessageWindow
    rag_storage_bytes: int  # 0 = không giới hạn dung lượng RAG
    max_documents: Optional[int]
    max_sql_connections: int


PLAN_LIMITS: dict[str, PlanLimits] = {
    "starter": PlanLimits(
        ai_messages_cap=50,
        ai_messages_window="month",
        rag_storage_bytes=15 * 1024 * 1024,
        max_documents=2,
        max_sql_connections=0,
    ),
    "pro": PlanLimits(
        ai_messages_cap=400,
        ai_messages_window="day",
        rag_storage_bytes=100 * 1024 * 1024,
        max_documents=None,
        max_sql_connections=2,
    ),
    "enterprise": PlanLimits(
        ai_messages_cap=0,
        ai_messages_window=None,
        rag_storage_bytes=500 * 1024 * 1024,
        max_documents=None,
        max_sql_connections=5,
    ),
    "enterprise_pro": PlanLimits(
        ai_messages_cap=0,
        ai_messages_window=None,
        rag_storage_bytes=2 * 1024 * 1024 * 1024,
        max_documents=None,
        max_sql_connections=10,
    ),
}


def normalize_plan(raw: Optional[str]) -> str:
    p = (raw or "starter").strip().lower()
    if p in PLAN_LIMITS:
        return p
    return "starter"


def get_limits(plan: str) -> PlanLimits:
    return PLAN_LIMITS[normalize_plan(plan)]


def plan_allows_sql(plan: str) -> bool:
    return get_limits(plan).max_sql_connections > 0


def _window_start_utc_naive(window: AIMessageWindow) -> Optional[datetime]:
    if window == "month":
        n = datetime.utcnow()
        return n.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if window == "day":
        n = datetime.utcnow()
        return n.replace(hour=0, minute=0, second=0, microsecond=0)
    return None


async def count_user_messages_since(
    session: AsyncSession,
    tenant_uuid: UUID,
    since: datetime,
) -> int:
    q = select(func.count(ChatMessage.id)).where(
        ChatMessage.tenant_id == tenant_uuid,
        ChatMessage.role == "user",
        ChatMessage.created_at >= since,
    )
    return int((await session.execute(q)).scalar() or 0)


async def count_user_messages_all_time(
    session: AsyncSession,
    tenant_uuid: UUID,
) -> int:
    q = select(func.count(ChatMessage.id)).where(
        ChatMessage.tenant_id == tenant_uuid,
        ChatMessage.role == "user",
    )
    return int((await session.execute(q)).scalar() or 0)


async def get_ai_message_usage_for_billing(
    session: AsyncSession,
    tenant_uuid: UUID,
    plan: str,
) -> tuple[int, int, AIMessageWindow]:
    """(current, limit, window) — limit 0 = không giới hạn (trả về current là tổng user message mọi thời)."""
    lim = get_limits(plan)
    if lim.ai_messages_cap == 0:
        total = await count_user_messages_all_time(session, tenant_uuid)
        return total, 0, None
    start = _window_start_utc_naive(lim.ai_messages_window)
    if start is None:
        return 0, lim.ai_messages_cap, lim.ai_messages_window
    cur = await count_user_messages_since(session, tenant_uuid, start)
    return cur, lim.ai_messages_cap, lim.ai_messages_window


async def chat_quota_exceeded(
    session: AsyncSession,
    tenant_uuid: UUID,
    plan: str,
) -> bool:
    cur, cap, _ = await get_ai_message_usage_for_billing(session, tenant_uuid, plan)
    if cap == 0:
        return False
    return cur >= cap
