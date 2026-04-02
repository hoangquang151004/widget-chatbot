from typing import Optional, AsyncGenerator
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.future import select
from db.session import async_session
from models.tenant import Tenant
from ai.orchestrator import orchestrator_graph
from ai.llm import gemini_manager
from ai.memory import RedisConversationMemory
from pydantic import BaseModel
import logging
import json
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = "default"


# ─────────────────────────────────────────────────────────────────────────────
# B-004 Helper: SSE generator
# ─────────────────────────────────────────────────────────────────────────────

async def _stream_gemini(
    tenant_id: str,
    session_id: str,
    query: str,
) -> AsyncGenerator[str, None]:
    """Yields SSE-formatted chunks from Gemini streaming API."""
    try:
        # Load history from Redis
        memory = RedisConversationMemory(tenant_id, session_id)
        history = await memory.get_history()
        history_context = "\n".join(
            [f"{m['role']}: {m['content']}" for m in history[-5:]]
        )

        system_prompt = (
            f"Bạn là trợ lý AI hỗ trợ khách hàng.\n"
            f"LỊCH SỬ TRÒ CHUYỆN:\n{history_context}"
        )

        model = gemini_manager.get_model(system_instruction=system_prompt)
        full_text = ""

        # Gemini streaming
        async for chunk in await model.generate_content_async(
            query,
            stream=True,
        ):
            if chunk.text:
                full_text += chunk.text
                payload = json.dumps({"chunk": chunk.text, "done": False}, ensure_ascii=False)
                yield f"data: {payload}\n\n"

        # Final event: done
        yield f"data: {json.dumps({'chunk': '', 'done': True}, ensure_ascii=False)}\n\n"

        # Save to memory after stream completes
        await memory.add_message("user", query)
        await memory.add_message("assistant", full_text)

    except Exception as e:
        logger.error(f"Stream error for tenant {tenant_id}: {str(e)}")
        error_payload = json.dumps({"error": str(e), "done": True}, ensure_ascii=False)
        yield f"data: {error_payload}\n\n"


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/v1/chat — Full response (LangGraph Orchestrator)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/config")
async def get_widget_config(request: Request):
    """
    Lấy cấu hình giao diện widget dựa trên Public Key.
    Endpoint này công khai cho Widget SDK.
    """
    api_key = request.headers.get("X-Widget-Key") or request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API Key")

    async with async_session() as session:
        from models.tenant import Tenant
        from urllib.parse import urlparse

        # 1. Tìm Tenant bằng public key
        result = await session.execute(
            select(Tenant).filter(Tenant.public_key == api_key, Tenant.is_active == True)
        )
        tenant = result.scalars().first()
        if not tenant:
            raise HTTPException(status_code=401, detail="Invalid API Key")

        # 2. Kiểm tra Origin (Domain Validation)
        origin = request.headers.get("Origin") or request.headers.get("Referer")
        if origin:
            try:
                parsed_origin = urlparse(origin).netloc
                allowed_origins = tenant.allowed_origins or []
                if "*" not in allowed_origins and parsed_origin not in allowed_origins:
                    logger.warning(f"Domain mismatch for config: {parsed_origin} not in {allowed_origins}")
                    raise HTTPException(status_code=403, detail="Domain not authorized")
            except Exception:
                pass

        return {
            "name": tenant.name,
            "widget_color": tenant.widget_color,
            "widget_placeholder": tenant.widget_placeholder,
            "widget_position": tenant.widget_position,
            "widget_welcome_message": tenant.widget_welcome_message,
            "widget_avatar_url": tenant.widget_avatar_url,
            "widget_font_size": tenant.widget_font_size,
            "widget_show_logo": tenant.widget_show_logo,
        }


@router.get("/test")
async def chat_test_endpoint(request: Request):
    """Endpoint dùng để test auth và middleware."""
    return {
        "message": "Xác thực thành công",
        "tenant_id": request.state.tenant_id,
        "tenant_name": request.state.tenant_name,
        "is_admin": request.state.is_admin
    }


@router.post("")
async def chat_endpoint(request: Request, body: ChatRequest):
    """
    Main chat endpoint — LangGraph Orchestrator (RAG / SQL / General).
    Returns full response in one JSON object.
    """
    tenant_id = request.state.tenant_id
    query = body.query
    session_id = body.session_id

    logger.info(f"Chat request: tenant={tenant_id}, session={session_id}, query={query[:60]}")

    try:
        inputs = {
            "query": query,
            "tenant_id": tenant_id,
            "session_id": session_id,
            "history": [],
            "intent": None,
            "response": None,
        }
        final_state = await orchestrator_graph.ainvoke(inputs)
        agent_response = final_state.get("response")

        if not agent_response:
            raise HTTPException(status_code=500, detail="AI Agent không tạo được phản hồi.")

        return {
            "content": agent_response.content,
            "metadata": agent_response.metadata,
            "citations": getattr(agent_response, "citations", []),
            "component": getattr(agent_response, "component", None),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error for tenant {tenant_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi AI nội bộ: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/v1/chat/stream — Streaming response (SSE)  [B-004]
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/stream")
async def chat_stream_endpoint(
    request: Request,
    query: str,
    session_id: str = "default",
):
    """
    B-004: Streaming chat endpoint dùng Server-Sent Events (SSE).
    Widget connect qua EventSource để nhận text theo từng chunk.
    
    Response format (per event):
      data: {"chunk": "...", "done": false}
      data: {"chunk": "",   "done": true}    ← kết thúc stream
      data: {"error": "...", "done": true}   ← nếu có lỗi
    """
    tenant_id = request.state.tenant_id

    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="Query không được để trống.")

    logger.info(f"Stream request: tenant={tenant_id}, session={session_id}")

    return StreamingResponse(
        _stream_gemini(tenant_id, session_id, query.strip()),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",     # disable Nginx buffering
        },
    )


@router.post("/stream")
async def chat_stream_post_endpoint(request: Request, body: ChatRequest):
    """
    B-004 (Option B): Streaming chat endpoint qua Orchestrator.
    Hỗ trợ RAG, SQL và General chat với hiệu ứng streaming.
    """
    tenant_id = request.state.tenant_id
    query = body.query
    session_id = body.session_id

    async def event_stream():
        # 1. Gửi chunk rỗng ngay lập tức để UI hiện bubble và con trỏ nhấp nháy
        # Điều này giúp người dùng thấy AI đang phản hồi ngay lập tức.
        yield f"data: {json.dumps({'chunk': '', 'done': False}, ensure_ascii=False)}\n\n"

        inputs = {
            "query": query,
            "tenant_id": tenant_id,
            "session_id": session_id,
            "history": [],
            "intent": None,
            "response": None,
        }
        
        try:
            # 2. Chạy orchestrator full (Loader -> Classifier -> RAG/SQL -> Saver)
            # Node Classifier và RAG/SQL có thể mất vài giây.
            final_state = await orchestrator_graph.ainvoke(inputs)
            agent_response = final_state.get("response")
            
            if agent_response:
                content = agent_response.content
                
                # 3. Yield từng cụm từ nhỏ để tạo hiệu ứng streaming mượt mà cho UI
                # Thay vì split theo khoảng trắng (chậm), ta có thể yield theo các đoạn ngắn.
                # Hoặc đơn giản là yield từng chữ/từ với delay cực ngắn.
                words = content.split(" ")
                for i, word in enumerate(words):
                    chunk = word + (" " if i < len(words)-1 else "")
                    payload = json.dumps({"chunk": chunk, "done": False}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"
                    # Delay rất ngắn để tạo cảm giác "chạy từng chữ" tự nhiên (giống ChatGPT)
                    await asyncio.sleep(0.02) 
                
                # 4. Gửi kèm citations và component nếu có ở chunk cuối
                final_payload = {
                    "chunk": "",
                    "done": True,
                    "metadata": agent_response.metadata,
                    "citations": getattr(agent_response, "citations", []),
                    "component": getattr(agent_response, "component", None)
                }
                yield f"data: {json.dumps(final_payload, ensure_ascii=False)}\n\n"
            else:
                yield f"data: {json.dumps({'error': 'AI Agent không tạo được phản hồi.', 'done': True}, ensure_ascii=False)}\n\n"
                
        except Exception as e:
            logger.error(f"Stream error for tenant {tenant_id}: {str(e)}")
            yield f"data: {json.dumps({'error': str(e), 'done': True}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )
