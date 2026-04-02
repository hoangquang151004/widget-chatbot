import logging
import time
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.future import select
from db.session import async_session
from models.tenant import Tenant
from core.security import security_utils
from typing import Optional, List

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Middleware for SaaS Authentication and Domain Validation.
    Injects 'tenant_id' into request.state.
    """
    
    # Path to skip auth (e.g., Health check, Registration)
    SKIP_PATHS = [
        "/api/health", 
        "/api/v1/admin/register", 
        "/api/v1/chat/config",
        "/docs", 
        "/redoc", 
        "/openapi.json"
    ]

    async def dispatch(self, request: Request, call_next):
        # 0. Allow OPTIONS for CORS preflight
        if request.method == "OPTIONS":
            return await call_next(request)

        # 1. Skip auth for specific paths
        if any(request.url.path.startswith(path) for path in self.SKIP_PATHS):
            return await call_next(request)

        # 2. Extract API Key from Header (Support both X-API-Key and X-Widget-Key)
        api_key = request.headers.get("X-Widget-Key") or request.headers.get("X-API-Key")
        if not api_key:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Missing API Key (X-Widget-Key or X-API-Key header)"}
            )

        # 3. Database Authenticate Tenant
        async with async_session() as session:
            # Determine if it's public or secret key
            is_public = security_utils.is_public_key(api_key)
            
            # Query tenant by key
            if is_public:
                query = select(Tenant).filter(Tenant.public_key == api_key, Tenant.is_active == True)
            else:
                query = select(Tenant).filter(Tenant.secret_key == api_key, Tenant.is_active == True)
            
            result = await session.execute(query)
            tenant = result.scalars().first()
            
            if not tenant:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid or inactive API Key"}
                )

            # 4. Domain Validation (Origin Check) for Public Key
            if is_public:
                origin = request.headers.get("Origin") or request.headers.get("Referer")
                
                # If no origin, check if allowed in tenant config (e.g., during development)
                if not origin:
                    # In strict mode, we could reject requests without Origin
                    pass
                else:
                    # Basic origin normalization: remove path, protocol
                    from urllib.parse import urlparse
                    try:
                        parsed_origin = urlparse(origin).netloc
                        allowed_origins = tenant.allowed_origins or []
                        
                        # In dev, we might allow all for test
                        if "*" not in allowed_origins and parsed_origin not in allowed_origins:
                            logger.warning(f"Domain mismatch: {parsed_origin} not in {allowed_origins}")
                            return JSONResponse(
                                status_code=status.HTTP_403_FORBIDDEN,
                                content={"detail": f"Domain {parsed_origin} is not authorized for this widget."}
                            )
                    except Exception:
                        pass

            # 5. Rate Limiting Check
            from core.rate_limit import rate_limiter
            key_type = "public" if is_public else "secret"
            if await rate_limiter.is_rate_limited(str(tenant.id), key_type=key_type):
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": f"Too many {key_type} requests. Please try again later."}
                )

            # 6. Inject Context into Request State
            request.state.tenant_id = str(tenant.id)
            request.state.tenant_name = tenant.name
            request.state.is_admin = not is_public
            
            logger.info(f"Auth Success: Tenant={tenant.name}, ID={tenant.id}, Admin={not is_public}")
            
        # 6. Proceed to next handler
        response = await call_next(request)
        return response
