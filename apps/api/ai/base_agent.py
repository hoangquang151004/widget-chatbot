import uuid
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, List
from pydantic import BaseModel

class AgentResponse(BaseModel):
    id: str = str(uuid.uuid4())
    content: str
    metadata: Dict[str, Any] = {}
    citations: Optional[List[Dict[str, Any]]] = None
    component: Optional[Dict[str, Any]] = None # { "type": "product_grid", "data": [...] }

class BaseAgent(ABC):
    """
    Base class for all SaaS-aware agents.
    Every run must provide a tenant_id to ensure data isolation.
    """
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

    @abstractmethod
    async def arun(self, query: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Asynchronously run the agent with the given query.
        Must be implemented by subclasses.
        """
        pass

    def get_tenant_context(self) -> Dict[str, Any]:
        """Returns standard context for logs and database filters."""
        return {"tenant_id": self.tenant_id}
