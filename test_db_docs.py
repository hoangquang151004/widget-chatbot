import os
import asyncio
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_conn():
    load_dotenv('apps/api/.env')
    user = os.getenv("POSTGRES_USER")
    password = os.getenv("POSTGRES_PASSWORD")
    server = os.getenv("POSTGRES_SERVER")
    port = os.getenv("POSTGRES_PORT")
    db = os.getenv("POSTGRES_DB")
    
    url = f"postgresql+asyncpg://{user}:{password}@{server}:{port}/{db}"
    print(f"Testing connection to: {url}")
    
    try:
        engine = create_async_engine(url)
        async with engine.connect() as conn:
            r = await conn.execute(text("SELECT filename, status, error_message FROM tenant_documents"))
            docs = r.fetchall()
            print(f"Documents count: {len(docs)}")
            for d in docs:
                print(f"Doc: {d.filename}, Status: {d.status}, Error: {d.error_message}")
        await engine.dispose()
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
