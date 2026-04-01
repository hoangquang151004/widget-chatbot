import asyncio
import uuid
from db.session import async_session
from models.tenant import Tenant
from sqlalchemy.future import select

async def seed_test_tenant():
    async with async_session() as session:
        # Check if test tenant exists
        result = await session.execute(select(Tenant).filter(Tenant.slug == "test-tenant"))
        existing = result.scalars().first()
        if existing:
            print(f"Test tenant already exists: ID={existing.id}")
            return

        # Tạo tenant mới cho việc test E2E
        test_tenant = Tenant(
            id=uuid.uuid4(),
            name="Antigravity Demo",
            slug="test-tenant",
            # Public key cho widget nhúng
            public_key="pk_live_antigravity_demo_key",
            # Secret key cho dashboard login
            secret_key="sk_live_antigravity_secret_key",
            allowed_origins=["*"], # Cho phép tất cả trong môi trường dev
            widget_color="#2563eb",
            widget_placeholder="Hỏi tôi bất cứ điều gì...",
            widget_position="bottom-right",
            is_active=True
        )
        session.add(test_tenant)
        await session.commit()
        print(f"Seed success: ID={test_tenant.id}")
        print(f"Public Key: {test_tenant.public_key}")
        print(f"Secret Key: {test_tenant.secret_key}")

if __name__ == "__main__":
    asyncio.run(seed_test_tenant())
