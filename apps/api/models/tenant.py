from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, DateTime, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

Base = declarative_base()

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    
    # API Keys
    public_key = Column(String(100), unique=True, index=True, nullable=False) # pk_live_...
    secret_key = Column(String(100), unique=True, index=True, nullable=False) # sk_live_...
    
    # Allowed Domains (JSON list)
    allowed_origins = Column(JSON, default=[])

    # Widget Customization
    widget_color = Column(String(20), default="#2563eb")
    widget_placeholder = Column(String(255), default="Nhập câu hỏi...")
    widget_position = Column(String(20), default="bottom-right") # bottom-right, bottom-left
    widget_welcome_message = Column(String(500), default="Xin chào! Tôi có thể giúp gì cho bạn?")
    widget_avatar_url = Column(String(500), nullable=True)
    widget_font_size = Column(String(10), default="14px")
    widget_show_logo = Column(Boolean, default=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Tenant(name='{self.name}', slug='{self.slug}')>"
