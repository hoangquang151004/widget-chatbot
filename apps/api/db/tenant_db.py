import logging
from typing import Dict, Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from core.security import security_utils
from models.tenant_db_config import TenantDatabaseConfig
from db.session import async_session

logger = logging.getLogger(__name__)

class DynamicEngineManager:
    """
    Manages dynamic SQLAlchemy engines for multiple tenants.
    Caches engines in memory to avoid recreation overhead.
    """
    
    _engines: Dict[str, AsyncEngine] = {}
    _sessionmakers: Dict[str, sessionmaker] = {}

    @classmethod
    async def get_engine(cls, tenant_id: str) -> Optional[AsyncEngine]:
        """Returns a cached engine or creates a new one for the tenant."""
        if tenant_id in cls._engines:
            engine = cls._engines[tenant_id]
            # Verify if engine is still alive (optional but recommended for robustness)
            return engine

        # 1. Fetch config from system DB
        async with async_session() as session:
            try:
                # ❗ FIX: tenant_id is UUID in model, but string from state
                query = select(TenantDatabaseConfig).filter(
                    TenantDatabaseConfig.tenant_id == tenant_id,
                    TenantDatabaseConfig.is_active == True
                )
                result = await session.execute(query)
                config = result.scalars().first()

                if not config:
                    logger.error(f"No DB config found for tenant {tenant_id}")
                    return None

                # 2. Decrypt user & password (stored as BYTEA)
                try:
                    # NOTE: config.db_user_enc and config.db_password_enc are bytes
                    # security_utils.decrypt expects base64 string or bytes? Let's check.
                    # Usually, AES-256-GCM encrypted data is stored as raw bytes.
                    db_user = security_utils.decrypt(config.db_user_enc.decode() if isinstance(config.db_user_enc, bytes) else config.db_user_enc)
                    db_pass = security_utils.decrypt(config.db_password_enc.decode() if isinstance(config.db_password_enc, bytes) else config.db_password_enc)
                except Exception as e:
                    logger.error(f"Failed to decrypt DB credentials for tenant {tenant_id}: {str(e)}")
                    return None

                # 3. Construct connection string
                # Support both asyncpg (Postgres) and aiomysql (MySQL)
                driver = "postgresql+asyncpg" if config.db_type == "postgresql" else "mysql+aiomysql"
                url = f"{driver}://{db_user}:{db_pass}@{config.db_host}:{config.db_port}/{config.db_name}"

                # 4. Create Engine with robust pool settings
                connect_args = {}
                if config.db_type == "postgresql":
                    connect_args["command_timeout"] = 30
                
                engine = create_async_engine(
                    url, 
                    future=True, 
                    pool_pre_ping=True, # Automatic health check
                    pool_recycle=3600,   # Recycle connections every hour
                    connect_args=connect_args
                )
                
                cls._engines[tenant_id] = engine
                cls._sessionmakers[tenant_id] = sessionmaker(
                    engine, expire_on_commit=False, class_=AsyncSession
                )
                
                logger.info(f"Created new dynamic engine for tenant {tenant_id} (DB: {config.db_name})")
                return engine
                
            except Exception as e:
                logger.error(f"Error creating engine for tenant {tenant_id}: {str(e)}")
                return None

    @classmethod
    async def refresh_engine(cls, tenant_id: str):
        """Clears cached engine for a tenant, forcing a reconnect on next use."""
        if tenant_id in cls._engines:
            engine = cls._engines.pop(tenant_id)
            cls._sessionmakers.pop(tenant_id, None)
            await engine.dispose()
            logger.info(f"Refreshed engine for tenant {tenant_id}")

    @classmethod
    async def get_session(cls, tenant_id: str) -> Optional[AsyncSession]:
        """Returns a new async session for the specific tenant's database."""
        engine = await cls.get_engine(tenant_id)
        if not engine:
            return None
        
        return cls._sessionmakers[tenant_id]()

    @classmethod
    async def close_all(cls):
        """Disposes all tenant engines (useful for shutdown)."""
        for tid, engine in cls._engines.items():
            await engine.dispose()
        cls._engines.clear()
        cls._sessionmakers.clear()

# Global instance
engine_manager = DynamicEngineManager()
