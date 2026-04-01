from typing import Annotated, TypedDict, Union, List, Dict, Any, Literal, Optional
from langgraph.graph import StateGraph, END
from ai.llm import gemini_manager
from ai.rag_agent import RAGAgent
from ai.sql_agent import SQLAgent
from ai.base_agent import AgentResponse
from ai.memory import RedisConversationMemory
import json
import logging

logger = logging.getLogger(__name__)

# Define the state of our agent
class AgentState(TypedDict):
    query: str
    tenant_id: str
    session_id: str # Added session_id
    history: List[Dict[str, str]]
    intent: Optional[Literal["RAG", "SQL", "GENERAL"]]
    response: Optional[AgentResponse]

# 0. History Loader Node
async def history_loader_node(state: AgentState) -> Dict[str, Any]:
    memory = RedisConversationMemory(state["tenant_id"], state["session_id"])
    history = await memory.get_history()
    return {"history": history}

# 1. Intent Classifier Node
async def classifier_node(state: AgentState) -> Dict[str, Any]:
    query = state["query"]
    # Tránh dùng .get() vì TypedDict không hỗ trợ trong mọi phiên bản Python
    history = state["history"] if "history" in state else []
    
    # Simple history context for classifier
    history_context = "\n".join([f"{m['role']}: {m['content']}" for m in history[-3:]])
    
    prompt = f"""
    Bạn là một AI router chuyên nghiệp cho hệ thống đa khách hàng (SaaS).
    Hãy phân loại câu hỏi của người dùng vào một trong 3 nhóm sau:
    1. RAG: Câu hỏi liên quan đến tìm kiếm thông tin trong tài liệu (PDF, Word, Kiến thức nội bộ).
    2. SQL: Câu hỏi liên quan đến truy vấn dữ liệu có cấu trúc, báo cáo, con số (Doanh thu, số lượng nhân viên, danh sách khách hàng).
    3. GENERAL: Câu chào hỏi, tán gẫu, hoặc các câu hỏi không thuộc 2 nhóm trên.
    
    BỐI CẢNH LỊCH SỬ (3 câu gần nhất):
    {history_context}
    
    CÂU HỎI HIỆN TẠI: {query}
    
    Trả về kết quả DUY NHẤT dưới dạng JSON: {{"intent": "RAG" | "SQL" | "GENERAL"}}
    """
    
    try:
        model = gemini_manager.get_model()
        res = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(res.text)
        intent = data.get("intent", "GENERAL")
    except Exception as e:
        logger.error(f"Classifier error: {str(e)}")
        intent = "GENERAL"
        
    return {"intent": intent}

# 2. RAG Execution Node
async def rag_node(state: AgentState) -> Dict[str, Any]:
    try:
        agent = RAGAgent(state["tenant_id"])
        # Pass history to RAG agent for reformulation
        response = await agent.arun(
            state["query"],
            context={"history": state["history"] if "history" in state else []}
        )
        
        # MOCK COMPONENT for demo
        if "sản phẩm" in state["query"].lower():
            response.component = {
                "type": "product_grid",
                "data": [
                    { "id": "p1", "name": "Premium Plan", "price": "1.5Mđ", "image_url": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200" },
                    { "id": "p2", "name": "Enterprise Suite", "price": "5.0Mđ", "image_url": "https://images.unsplash.com/photo-1558655146-d09347e92766?w=200" }
                ]
            }
        
        return {"response": response}
    except Exception as e:
        logger.error(f"RAG Node error: {str(e)}")
        return {"response": AgentResponse(content=f"Lỗi khi truy vấn tài liệu: {str(e)}", metadata={"error": True})}

# 3. SQL Execution Node
async def sql_node(state: AgentState) -> Dict[str, Any]:
    try:
        agent = SQLAgent(state["tenant_id"])
        response = await agent.arun(state["query"])
        
        # MOCK COMPONENT for demo
        if "thống kê" in state["query"].lower() or "báo cáo" in state["query"].lower():
            response.component = {
                "type": "bar_chart",
                "data": {
                    "label": "Tương tác khách hàng",
                    "labels": ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
                    "values": [250, 420, 380, 560, 890, 1100, 950]
                }
            }
            
        return {"response": response}
    except Exception as e:
        logger.error(f"SQL Node error: {str(e)}")
        return {"response": AgentResponse(content=f"Lỗi khi truy vấn database: {str(e)}", metadata={"error": True})}

# 4. General Response Node
async def general_node(state: AgentState) -> Dict[str, Any]:
    try:
        history = state["history"] if "history" in state else []
        history_context = "\n".join([f"{m['role']}: {m['content']}" for m in history[-5:]])
        
        system_prompt = f"""
        Bạn là một trợ lý AI thân thiện. Hãy trò chuyện với người dùng.
        LỊCH SỬ TRÒ CHUYỆN:
        {history_context}
        """
        
        model = gemini_manager.get_model(system_instruction=system_prompt)
        res = await model.generate_content_async(state["query"])
        return {
            "response": AgentResponse(
                content=res.text,
                metadata={"node": "general"}
            )
        }
    except Exception as e:
        return {"response": AgentResponse(content="Xin lỗi, tôi gặp sự cố kỹ thuật.", metadata={"error": True})}

# 5. History Saver Node
async def history_saver_node(state: AgentState) -> Dict[str, Any]:
    """Saves the current turn to Redis."""
    memory = RedisConversationMemory(state["tenant_id"], state["session_id"])
    
    # Save user message
    await memory.add_message("user", state["query"])
    
    # Save assistant message if exists
    if state["response"]:
        await memory.add_message("assistant", state["response"].content)
        
    # TRICK: Trả về state hiện tại để LangGraph không báo lỗi "got {}"
    return {"query": state["query"]}

# Build the Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("loader", history_loader_node)
workflow.add_node("classifier", classifier_node)
workflow.add_node("rag_node", rag_node)
workflow.add_node("sql_node", sql_node)
workflow.add_node("general_node", general_node)
workflow.add_node("saver", history_saver_node)

# Add Edges
workflow.set_entry_point("loader")
workflow.add_edge("loader", "classifier")

def route_by_intent(state: AgentState):
    intent = state.get("intent")
    if intent == "RAG":
        return "rag_node"
    elif intent == "SQL":
        return "sql_node"
    else:
        return "general_node"

workflow.add_conditional_edges(
    "classifier",
    route_by_intent,
    {
        "rag_node": "rag_node",
        "sql_node": "sql_node",
        "general_node": "general_node"
    }
)

workflow.add_edge("rag_node", "saver")
workflow.add_edge("sql_node", "saver")
workflow.add_edge("general_node", "saver")
workflow.add_edge("saver", END)

# Compile
orchestrator_graph = workflow.compile()
