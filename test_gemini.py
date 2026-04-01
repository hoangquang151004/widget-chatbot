import os
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai

async def test_gemini_embedding():
    load_dotenv('apps/api/.env')
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = "models/gemini-embedding-001"
    
    print(f"Using API Key: {api_key[:10]}...")
    print(f"Using Model: {model_name}")
    
    genai.configure(api_key=api_key)
    
    texts = ["Hello world", "This is a test"]
    
    try:
        print("Testing batch embedding...")
        result = await genai.embed_content_async(
            model=model_name,
            content=texts,
            task_type="RETRIEVAL_DOCUMENT"
        )
        print(f"Result type: {type(result)}")
        embeddings = result['embedding']
        print(f"Number of embeddings: {len(embeddings)}")
        print(f"Vector size: {len(embeddings[0])}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini_embedding())
