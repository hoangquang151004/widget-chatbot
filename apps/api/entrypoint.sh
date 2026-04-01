#!/bin/bash
# ============================================================
# Docker Entrypoint — XenoAI API
# Runs Alembic migrations then starts uvicorn
# ============================================================

set -e

echo "⏳ Waiting for database to be ready..."
# Wait loop as backup (healthcheck in docker-compose should do this)
for i in $(seq 1 30); do
  python -c "
import asyncio, asyncpg, os, sys
async def check():
    try:
        conn = await asyncpg.connect(
            host=os.getenv('POSTGRES_SERVER', 'localhost'),
            port=int(os.getenv('POSTGRES_PORT', 5432)),
            user=os.getenv('POSTGRES_USER', 'postgres'),
            password=os.getenv('POSTGRES_PASSWORD', 'postgres'),
            database=os.getenv('POSTGRES_DB', 'widget_chatbot'),
        )
        await conn.close()
        print('DB ready')
    except Exception as e:
        sys.exit(1)
asyncio.run(check())
" && break
  echo "  Attempt $i/30 — retrying in 2s..."
  sleep 2
done

echo "🔄 Running Alembic migrations..."
alembic upgrade head

echo "🌱 Running seed script (skip if already seeded)..."
python scripts/seed.py --skip-if-exists || true

echo "🚀 Starting API server..."
exec uvicorn main:app --host 0.0.0.0 --port 8001 --workers 2
