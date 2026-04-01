import asyncio
from ai.vector_store import SaaSVectorStore
from ai.llm import gemini_manager
from core.config import settings

async def check():
    print(f"Checking Gemini with model: {settings.GEMINI_MODEL}")
    try:
        embedding = await gemini_manager.aget_embeddings("Hello world")
        print(f"Gemini Embedding OK. Dim: {len(embedding)}")
    except Exception as e:
        print(f"Gemini Error: {e}")

    print("\nChecking Qdrant...")
    try:
        vs = SaaSVectorStore(tenant_id="test_tenant")
        client = await vs.get_client()
        collections = await client.get_collections()
        print(f"Qdrant Collections: {[c.name for c in collections.collections]}")
        
        # Test upsert/search
        texts = ["Test RAG document content"]
        metadatas = [{"source": "test.txt"}]
        await vs.upsert_documents(texts, metadatas)
        print("Upsert OK.")
        
        results = await vs.search("RAG document")
        print(f"Search Results: {len(results)}")
        for r in results:
            print(f"- {r['text']} (Score: {r['score']})")
            
    except Exception as e:
        print(f"Qdrant/RAG Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check())
