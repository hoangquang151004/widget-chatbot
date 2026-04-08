import time
import logging
from redis import Redis
from core.config import settings

logger = logging.getLogger(__name__)

class RateLimiter:
    """Redis-based Rate Limiter for SaaS Tenants, distinguishing between keys."""
    
    PUBLIC_KEY_LIMIT = 60   # 60 req/min (chat widget)
    SECRET_KEY_LIMIT = 100  # 100 req/min (dashboard admin)
    WINDOW = 60             # per 60 seconds

    def __init__(self):
        try:
            self.redis = Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True,
                socket_timeout=2
            )
        except Exception as e:
            logger.error(f"RateLimiter Redis Connection Error: {e}")
            self.redis = None

    async def is_rate_limited(self, tenant_id: str, key_type: str = "public") -> bool:
        """Checks if a tenant exceeded their limit based on key type."""
        if not self.redis:
            return False # Skip check if Redis is down

        limit = self.PUBLIC_KEY_LIMIT if key_type == "public" else self.SECRET_KEY_LIMIT
        
        try:
            key = f"rate_limit:{key_type}:{tenant_id}"
            current = self.redis.get(key)
            
            if current and int(current) >= limit:
                return True
                
            pipe = self.redis.pipeline()
            pipe.incr(key)
            if not current: # Only set expire on first increment
                pipe.expire(key, self.WINDOW)
            pipe.execute()
            
            return False
        except Exception as e:
            logger.error(f"RateLimiter Error: {str(e)}")
            return False

rate_limiter = RateLimiter()
