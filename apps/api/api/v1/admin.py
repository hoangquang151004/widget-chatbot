import secrets
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import text
from sqlalchemy.engine import URL
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import create_async_engine
from db.session import async_session
from models.tenant import Tenant
from models.tenant_db_config import TenantDatabaseConfig
from core.security import security_utils
from core.config import settings
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import re

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class RegisterTenantSchema(BaseModel):
    name: str
    slug: str                              # e.g. "my-company"
    email: EmailStr
    password: str
    allowed_origins: Optional[List[str]] = ["*"]


class DBConfigSchema(BaseModel):
    db_type: str
    db_host: str
    db_port: int
    db_name: str
    db_username: str
    db_password: str


class TenantUpdateSchema(BaseModel):
    name: Optional[str] = None
    allowed_origins: Optional[List[str]] = None
    widget_color: Optional[str] = None
    widget_placeholder: Optional[str] = None
    widget_position: Optional[str] = None
    widget_welcome_message: Optional[str] = None
    widget_avatar_url: Optional[str] = None
    widget_font_size: Optional[str] = None
    widget_show_logo: Optional[bool] = None


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _generate_key(prefix: str) -> str:
    """Generate a secure random API key with given prefix."""
    return f"{prefix}_{secrets.token_urlsafe(32)}"


def _validate_slug(slug: str) -> str:
    """Validate and normalize a slug (lowercase, alphanumeric + dash)."""
    slug = slug.lower().strip()
    if not re.match(r"^[a-z0-9][a-z0-9\-]{1,98}[a-z0-9]$", slug):
        raise HTTPException(
            status_code=400,
            detail="Slug chỉ được chứa chữ thường, số và dấu gạch ngang, độ dài 3-100 ký tự."
        )
    return slug


# ─────────────────────────────────────────────────────────────────────────────
# B-002: Register new tenant (Public endpoint — no auth required)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
async def register_tenant(payload: RegisterTenantSchema):
    """
    Tạo tenant mới và cấp cặp API keys.
    Không yêu cầu xác thực (public endpoint).
    """
    slug = _validate_slug(payload.slug)

    async with async_session() as session:
        # Check slug uniqueness
        existing = await session.execute(
            select(Tenant).filter(Tenant.slug == slug)
        )
        if existing.scalars().first():
            raise HTTPException(status_code=409, detail=f"Slug '{slug}' đã tồn tại.")

        existing_email = await session.execute(
            select(Tenant).filter(Tenant.email == payload.email)
        )
        if existing_email.scalars().first():
            raise HTTPException(status_code=409, detail="Email đã được sử dụng.")

        if len(payload.password) < 8:
            raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 8 ký tự.")

        public_key = _generate_key("pk_live")
        secret_key = _generate_key("sk_live")

        tenant = Tenant(
            name=payload.name,
            slug=slug,
            email=payload.email,
            password_hash=security_utils.hash_password(payload.password),
            public_key=public_key,
            secret_key=secret_key,
            allowed_origins=payload.allowed_origins or ["*"],
            is_active=True,
        )
        session.add(tenant)
        await session.commit()
        await session.refresh(tenant)

    return {
        "message": "Tenant đã được tạo thành công.",
        "tenant_id": str(tenant.id),
        "name": tenant.name,
        "email": tenant.email,
        "slug": tenant.slug,
        "public_key": tenant.public_key,
        "allowed_origins": tenant.allowed_origins,
    }


# ─────────────────────────────────────────────────────────────────────────────
# B-002b: POST /login — Đăng nhập bằng Email/Password
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/login")
async def login(payload: LoginSchema):
    """Đăng nhập bằng Email và Password, trả về Bearer token cho dashboard."""
    async with async_session() as session:
        result = await session.execute(
            select(Tenant).filter(Tenant.email == payload.email)
        )
        tenant = result.scalars().first()

        if not tenant or not tenant.password_hash:
            raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác.")

        if not security_utils.verify_password(payload.password, tenant.password_hash):
            raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác.")

        if not tenant.is_active:
            raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa.")

        access_token = security_utils.generate_admin_token(
            tenant_id=str(tenant.id),
            email=tenant.email or "",
        )

        return {
            "message": "Đăng nhập thành công.",
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "tenant": {
                "id": str(tenant.id),
                "name": tenant.name,
                "email": tenant.email,
            },
        }


# ─────────────────────────────────────────────────────────────────────────────
# GET /me — Thông tin tenant hiện tại
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_tenant_info(request: Request):
    """Lấy thông tin chi tiết của Tenant hiện tại. Yêu cầu Bearer token."""
    if not request.state.is_admin:
        raise HTTPException(status_code=403, detail="Yêu cầu Bearer token hợp lệ")

    async with async_session() as session:
        result = await session.execute(
            select(Tenant).filter(Tenant.id == request.state.tenant_id)
        )
        tenant = result.scalars().first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant không tồn tại.")

        return {
            "id": str(tenant.id),
            "name": tenant.name,
            "email": tenant.email,
            "slug": tenant.slug,
            "public_key": tenant.public_key,
            "allowed_origins": tenant.allowed_origins,
            "widget_color": tenant.widget_color,
            "widget_placeholder": tenant.widget_placeholder,
            "widget_position": tenant.widget_position,
            "widget_welcome_message": tenant.widget_welcome_message,
            "widget_avatar_url": tenant.widget_avatar_url,
            "widget_font_size": tenant.widget_font_size,
            "widget_show_logo": tenant.widget_show_logo,
            "is_active": tenant.is_active,
        }


# ─────────────────────────────────────────────────────────────────────────────
# B-003a: PATCH /me — Cập nhật thông tin tenant
# ─────────────────────────────────────────────────────────────────────────────

@router.patch("/me")
async def update_tenant_info(payload: TenantUpdateSchema, request: Request):
    """Cập nhật name, allowed_origins và widget settings của tenant. Yêu cầu Bearer token."""
    if not request.state.is_admin:
        raise HTTPException(status_code=403, detail="Yêu cầu Bearer token hợp lệ")

    async with async_session() as session:
        result = await session.execute(
            select(Tenant).filter(Tenant.id == request.state.tenant_id)
        )
        tenant = result.scalars().first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant không tồn tại.")

        if payload.name is not None:
            tenant.name = payload.name
        if payload.allowed_origins is not None:
            tenant.allowed_origins = payload.allowed_origins
        if payload.widget_color is not None:
            tenant.widget_color = payload.widget_color
        if payload.widget_placeholder is not None:
            tenant.widget_placeholder = payload.widget_placeholder
        if payload.widget_position is not None:
            tenant.widget_position = payload.widget_position
        if payload.widget_welcome_message is not None:
            tenant.widget_welcome_message = payload.widget_welcome_message
        if payload.widget_avatar_url is not None:
            tenant.widget_avatar_url = payload.widget_avatar_url
        if payload.widget_font_size is not None:
            tenant.widget_font_size = payload.widget_font_size
        if payload.widget_show_logo is not None:
            tenant.widget_show_logo = payload.widget_show_logo

        await session.commit()
        await session.refresh(tenant)

    return {
        "message": "Cập nhật thành công.",
        "name": tenant.name,
        "allowed_origins": tenant.allowed_origins,
        "widget_color": tenant.widget_color,
        "widget_placeholder": tenant.widget_placeholder,
        "widget_position": tenant.widget_position,
        "widget_welcome_message": tenant.widget_welcome_message,
        "widget_avatar_url": tenant.widget_avatar_url,
        "widget_font_size": tenant.widget_font_size,
        "widget_show_logo": tenant.widget_show_logo,
    }


# ─────────────────────────────────────────────────────────────────────────────
# B-003b: POST /rotate-keys — Xoay vòng API keys
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/rotate-keys")
async def rotate_api_keys(request: Request):
    """
    Tạo cặp API keys mới và vô hiệu hoá keys cũ ngay lập tức.
    Yêu cầu Bearer token. Hành động không thể hoàn tác.
    """
    if not request.state.is_admin:
        raise HTTPException(status_code=403, detail="Yêu cầu Bearer token hợp lệ")

    async with async_session() as session:
        result = await session.execute(
            select(Tenant).filter(Tenant.id == request.state.tenant_id)
        )
        tenant = result.scalars().first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant không tồn tại.")

        new_public_key = _generate_key("pk_live")
        new_secret_key = _generate_key("sk_live")

        tenant.public_key = new_public_key
        tenant.secret_key = new_secret_key

        await session.commit()

    return {
        "message": "Keys đã được xoay vòng. Hãy cập nhật ngay vào ứng dụng của bạn.",
        "new_public_key": new_public_key,
        "new_secret_key": new_secret_key,
    }


# ─────────────────────────────────────────────────────────────────────────────
# DB Config endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/database")
async def save_db_config(config: DBConfigSchema, request: Request):
    """Lưu và mã hoá cấu hình Database khách hàng."""
    if not request.state.is_admin:
        raise HTTPException(status_code=403, detail="Yêu cầu Bearer token hợp lệ")

    tenant_id = request.state.tenant_id
    encrypted_user = security_utils.encrypt(config.db_username).encode()
    encrypted_pass = security_utils.encrypt(config.db_password).encode()

    async with async_session() as session:
        result = await session.execute(
            select(TenantDatabaseConfig).filter(TenantDatabaseConfig.tenant_id == tenant_id)
        )
        db_config = result.scalars().first()

        if db_config:
            db_config.db_type = config.db_type
            db_config.db_host = config.db_host
            db_config.db_port = config.db_port
            db_config.db_name = config.db_name
            db_config.db_user_enc = encrypted_user
            db_config.db_password_enc = encrypted_pass
        else:
            db_config = TenantDatabaseConfig(
                tenant_id=tenant_id,
                db_type=config.db_type,
                db_host=config.db_host,
                db_port=config.db_port,
                db_name=config.db_name,
                db_user_enc=encrypted_user,
                db_password_enc=encrypted_pass,
            )
            session.add(db_config)

        await session.commit()

    # Invalidate SQL schema cache
    from ai.sql_agent import SQLAgent
    if tenant_id in SQLAgent._schema_cache:
        del SQLAgent._schema_cache[tenant_id]

    return {"message": "Cấu hình database đã được lưu thành công."}


@router.get("/database")
async def get_db_config(request: Request):
    """Lấy cấu hình DB (password sẽ bị ẩn)."""
    if not request.state.is_admin:
        raise HTTPException(status_code=403, detail="Yêu cầu Bearer token hợp lệ")

    async with async_session() as session:
        result = await session.execute(
            select(TenantDatabaseConfig).filter(
                TenantDatabaseConfig.tenant_id == request.state.tenant_id
            )
        )
        config = result.scalars().first()
        if not config:
            return {"message": "Chưa có cấu hình database.", "config": None}

        # Decrypt username
        try:
            db_username = security_utils.decrypt(config.db_user_enc.decode())
        except Exception:
            db_username = "Error decrypting"

        return {
            "config": {
                "db_type": config.db_type,
                "db_host": config.db_host,
                "db_port": config.db_port,
                "db_name": config.db_name,
                "db_username": db_username,
                "db_password": "••••••••",    # never expose
            }
        }


@router.post("/database/test")
async def test_db_connection(config: DBConfigSchema, request: Request):
    """Kiểm tra kết nối tới database của khách hàng mà không lưu cấu hình."""
    if not request.state.is_admin:
        raise HTTPException(status_code=403, detail="Yêu cầu Bearer token hợp lệ")

    driver = "postgresql+asyncpg" if config.db_type == "postgresql" else "mysql+aiomysql"
    
    # Sử dụng URL object để tự động handle các ký tự đặc biệt trong password
    url = URL.create(
        drivername=driver,
        username=config.db_username,
        password=config.db_password,
        host=config.db_host,
        port=config.db_port,
        database=config.db_name,
    )

    try:
        # Tạo engine tạm thời để test
        engine = create_async_engine(url, future=True)
        async with engine.connect() as conn:
            # Thực hiện một query đơn giản nhất
            await conn.execute(text("SELECT 1"))
        await engine.dispose()
        return {"message": "Kết nối thành công!", "status": "success"}
    except Exception as e:
        return {
            "message": f"Kết nối thất bại: {str(e)}",
            "status": "error"
        }
