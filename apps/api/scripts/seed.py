"""
Seed script: Tạo tenant demo + Qdrant collection.

Cách chạy:
    cd apps/api
    .venv\Scripts\python.exe scripts/seed.py [--skip-if-exists]
"""
import asyncio
import secrets
import sys
import os
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.future import select
from db.session import async_session
from models.tenant import Tenant

DEMO_SLUG = "demo-tenant"


async def ensure_qdrant_collection():
    """Tạo Qdrant collection nếu chưa có."""
    try:
        from qdrant_client import AsyncQdrantClient
        from qdrant_client.models import Distance, VectorParams
        from core.config import settings

        client = AsyncQdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT, timeout=5)
        collections = await client.get_collections()
        names = [c.name for c in collections.collections]

        if settings.QDRANT_COLLECTION_DOCS not in names:
            await client.create_collection(
                collection_name=settings.QDRANT_COLLECTION_DOCS,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
            print(f"✅  Đã tạo Qdrant collection: '{settings.QDRANT_COLLECTION_DOCS}'")
        else:
            print(f"ℹ️   Qdrant collection '{settings.QDRANT_COLLECTION_DOCS}' đã tồn tại.")

        await client.close()
    except Exception as e:
        print(f"⚠️   Không thể kết nối Qdrant: {e}  (bỏ qua nếu chạy local không có Qdrant)")


async def seed(skip_if_exists: bool = False):
    print("\n=== 🌱 Seed Script — XenoAI Widget ===\n")

    # ── 1. Qdrant collection ─────────────────────────────────────────────────
    await ensure_qdrant_collection()

    # ── 2. Demo tenant ────────────────────────────────────────────────────────
    async with async_session() as session:
        result = await session.execute(select(Tenant).filter(Tenant.slug == DEMO_SLUG))
        existing = result.scalars().first()

        if existing:
            if skip_if_exists:
                print(f"ℹ️   Tenant '{DEMO_SLUG}' đã tồn tại — bỏ qua (--skip-if-exists).")
                tenant = existing
            else:
                print(f"⚠️   Tenant '{DEMO_SLUG}' đã tồn tại.")
                tenant = existing
        else:
            public_key = f"pk_live_{secrets.token_urlsafe(32)}"
            secret_key = f"sk_live_{secrets.token_urlsafe(32)}"

            tenant = Tenant(
                name="Demo Company",
                slug=DEMO_SLUG,
                public_key=public_key,
                secret_key=secret_key,
                allowed_origins=["*"],
                is_active=True,
            )
            session.add(tenant)
            await session.commit()
            await session.refresh(tenant)
            print("✅  Tenant demo đã được tạo.")

    # ── 3. Print keys ─────────────────────────────────────────────────────────
    print(f"\n{'─' * 58}")
    print(f"  Tenant ID   : {tenant.id}")
    print(f"  Name        : {tenant.name}")
    print(f"  Slug        : {tenant.slug}")
    print(f"  Public Key  : {tenant.public_key}")
    print(f"  Secret Key  : {tenant.secret_key}")
    print(f"{'─' * 58}")
    print(f"\n💡 Dùng Public Key để nhúng Widget vào website.")
    print(f"💡 Dùng Secret Key để gọi Admin API (X-API-Key header).\n")
    print("=== Hướng dẫn test nhanh ===")
    print(f'curl -X GET http://localhost:8001/api/v1/admin/me \\')
    print(f'     -H "X-API-Key: {tenant.secret_key}"')
    print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-if-exists", action="store_true",
                        help="Bỏ qua nếu tenant demo đã tồn tại (dùng trong Docker entrypoint)")
    args = parser.parse_args()
    asyncio.run(seed(skip_if_exists=args.skip_if_exists))
