import google.generativeai as genai
from typing import List, Optional
from core.config import settings

class GeminiManager:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in environment variables")
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = self._ensure_model_prefix(settings.GEMINI_MODEL)
        self.embedding_model_name = self._ensure_model_prefix(settings.EMBEDDING_MODEL)

    def _ensure_model_prefix(self, model_id: str) -> str:
        """Đảm bảo tên model bắt đầu bằng 'models/'."""
        if "/" not in model_id:
            return f"models/{model_id}"
        return model_id

    def get_model(self, system_instruction: Optional[str] = None):
        """Returns a GenerativeModel instance."""
        return genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system_instruction
        )

    async def aget_embeddings(self, text: str, task_type: str = "RETRIEVAL_QUERY") -> List[float]:
        """Asynchronously get embedding for a single text."""
        result = await genai.embed_content_async(
            model=self.embedding_model_name,
            content=text,
            task_type=task_type,
            output_dimensionality=settings.EMBEDDING_DIM
        )
        return result['embedding']

    async def aget_embeddings_batch(self, texts: List[str], task_type: str = "RETRIEVAL_DOCUMENT") -> List[List[float]]:
        """Asynchronously get embeddings for a list of texts."""
        result = await genai.embed_content_async(
            model=self.embedding_model_name,
            content=texts,
            task_type=task_type,
            output_dimensionality=settings.EMBEDDING_DIM
        )
        return result['embedding']

# Global instance
gemini_manager = GeminiManager()
