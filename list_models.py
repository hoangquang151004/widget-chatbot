import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv('apps/api/.env')
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

print("Listing available models that support embedContent...")
for m in genai.list_models():
    if 'embedContent' in m.supported_generation_methods:
        print(f"Model: {m.name}")
