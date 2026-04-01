import logging
from typing import Optional
import redis.asyncio as redis
from core.config import settings

logger = logging.getLogger(__name__)

class RedisPool:
    """
    Async Redis Connection Pool Singleton.
    """
    _pool: Optional[redis.ConnectionPool] = None

    @classmethod
    def get_pool(cls) -> redis.ConnectionPool:
        if cls._pool is None:
            logger.info(f"Initializing Redis Pool: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
            cls._pool = redis.ConnectionPool(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=0,
                decode_responses=True
            )
        return cls._pool

    @classmethod
    def get_client(cls) -> redis.Redis:
        return redis.Redis(connection_pool=cls.get_pool())

    @classmethod
    async def close(cls):
        if cls._pool:
            logger.info("Closing Redis Pool...")
            await cls._pool.disconnect()
            cls._pool = None

def get_redis_client() -> redis.Redis:
    return RedisPool.get_client()
