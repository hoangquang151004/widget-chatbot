import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

print("Listing all available models...")
for m in genai.list_models():
    print(f"Model: {m.name}")
    print(f"  Methods: {m.supported_generation_methods}")
    print(f"  Description: {m.description}")
    print("-" * 20)
