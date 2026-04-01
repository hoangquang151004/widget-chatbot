import os
import asyncio
from dotenv import load_dotenv
from qdrant_client import AsyncQdrantClient

async def check_qdrant():
    load_dotenv('apps/api/.env')
    host = os.getenv("QDRANT_HOST", "localhost")
    port = int(os.getenv("QDRANT_PORT", 6333))
    collection = os.getenv("QDRANT_COLLECTION_DOCS", "chatbot_documents")
    
    print(f"Connecting to Qdrant at {host}:{port}, collection: {collection}")
    
    client = AsyncQdrantClient(host=host, port=port)
    try:
        if await client.collection_exists(collection):
            info = await client.get_collection(collection)
            print(f"Collection exists. Config: {info.config.params.vectors}")
        else:
            print("Collection does not exist.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(check_qdrant())
