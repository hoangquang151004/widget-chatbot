import asyncio
import uuid
from db.session import async_session
from models.tenant import Tenant
from sqlalchemy.future import select

async def list_tenants():
    async with async_session() as session:
        result = await session.execute(select(Tenant))
        tenants = result.scalars().all()
        print(f"Total tenants: {len(tenants)}")
        for t in tenants:
            print(f"ID: {t.id}")
            print(f"Slug: {t.slug}")
            print(f"Name: {t.name}")
            print(f"Public Key: {t.public_key}")
            print(f"Secret Key: {t.secret_key}")
            print(f"Is Active: {t.is_active}")
            print("-" * 20)

if __name__ == "__main__":
    asyncio.run(list_tenants())
