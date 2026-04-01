import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import redis.asyncio as redis
from core.config import settings

logger = logging.getLogger(__name__)

class RedisConversationMemory:
    """
    Asynchronous Redis-based memory for storing conversation history.
    Scoped by tenant_id and session_id to ensure SaaS isolation.
    """
    
    _pool: Optional[redis.ConnectionPool] = None

    def __init__(self, tenant_id: str, session_id: str, max_history: int = 10):
        self.tenant_id = tenant_id
        self.session_id = session_id
        self.max_history = max_history
        self.redis_key = f"chat_mem:{tenant_id}:{session_id}"
        self.ttl = 3600 * 24 * 7 # 7 days retention

    @classmethod
    def _get_pool(cls) -> redis.ConnectionPool:
        if cls._pool is None:
            cls._pool = redis.ConnectionPool(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True
            )
        return cls._pool

    async def get_client(self) -> redis.Redis:
        return redis.Redis(connection_pool=self._get_pool())

    async def get_history(self) -> List[Dict[str, str]]:
        """Retrieves the last N messages for the current session."""
        client = await self.get_client()
        try:
            raw_history = await client.lrange(self.redis_key, 0, self.max_history - 1)
            history = [json.loads(msg) for msg in raw_history]
            # Redis stores from newest to oldest if we use lpush, 
            # so we might need to reverse if we want chronological order.
            return list(reversed(history))
        except Exception as e:
            logger.error(f"Error getting history from Redis: {str(e)}")
            return []

    async def add_message(self, role: str, content: str):
        """Adds a new message (user or assistant) to the history."""
        client = await self.get_client()
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        try:
            # Push to the head of the list
            await client.lpush(self.redis_key, json.dumps(message))
            # Trim the list to keep only the latest messages
            await client.ltrim(self.redis_key, 0, self.max_history - 1)
            # Set expiration
            await client.expire(self.redis_key, self.ttl)
        except Exception as e:
            logger.error(f"Error adding message to Redis: {str(e)}")

    async def clear(self):
        """Clears the history for the current session."""
        client = await self.get_client()
        try:
            await client.delete(self.redis_key)
        except Exception as e:
            logger.error(f"Error clearing history in Redis: {str(e)}")

    @classmethod
    async def close_all(cls):
        """Closes the Redis pool."""
        if cls._pool:
            await cls._pool.disconnect()
            cls._pool = None
