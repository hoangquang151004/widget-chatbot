import asyncio
from sqlalchemy import text
from apps.api.db.session import async_session

async def update_schema():
    print("Đang kiểm tra và cập nhật cấu trúc bảng tenants...")
    async with async_session() as session:
        # Danh sách các cột cần thêm
        columns = [
            ("widget_welcome_message", "VARCHAR(500) DEFAULT 'Xin chào! Tôi có thể giúp gì cho bạn?'"),
            ("widget_avatar_url", "VARCHAR(500)"),
            ("widget_font_size", "VARCHAR(10) DEFAULT '14px'"),
            ("widget_show_logo", "BOOLEAN DEFAULT TRUE")
        ]
        
        for col_name, col_type in columns:
            try:
                # Kiểm tra cột đã tồn tại chưa bằng cách thử SELECT
                await session.execute(text(f"SELECT {col_name} FROM tenants LIMIT 1"))
                print(f"Cột {col_name} đã tồn tại.")
            except Exception:
                # Nếu lỗi nghĩa là cột chưa tồn tại, tiến hành ALTER TABLE
                await session.rollback()
                print(f"Đang thêm cột {col_name}...")
                await session.execute(text(f"ALTER TABLE tenants ADD COLUMN {col_name} {col_type}"))
                await session.commit()
                print(f"Đã thêm cột {col_name} thành công.")
        
    print("Hoàn tất cập nhật database.")

if __name__ == "__main__":
    # Cần set PYTHONPATH để import được apps.api
    import sys
    import os
    sys.path.append(os.getcwd())
    asyncio.run(update_schema())
