import asyncio
import httpx
import uuid
import time
import os
import sys

# Thêm root vào path để có thể import các module của apps/api
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://localhost:8000/api/v1"

# API Keys cho 2 tenant mẫu
TENANT_A_KEY = "sk_live_tenant_a_secret_123"
TENANT_B_KEY = "sk_live_tenant_b_secret_456"

async def test_e2e_rag_flow():
    """
    Kịch bản: 
    1. Tenant A upload tài liệu chứa 'bí mật'.
    2. Đợi file chuyển sang status 'done'.
    3. Tenant A hỏi chatbot -> AI phải trả lời đúng.
    4. Tenant B hỏi cùng câu hỏi -> AI không được phép biết.
    """
    print("🚀 Bắt đầu kiểm thử E2E RAG Flow...")

    async with httpx.AsyncClient() as client:
        # --- BƯỚC 1: UPLOAD TÀI LIỆU (TENANT A) ---
        print("\n[Tenant A] Đang upload tài liệu...")
        content = "Mật mã bí mật của dự án Gemini là: 987654321. Chỉ nhân viên mới được biết."
        file_path = "gemini_secret.txt"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

        try:
            with open(file_path, "rb") as f:
                response = await client.post(
                    f"{BASE_URL}/files/upload",
                    headers={"X-API-Key": TENANT_A_KEY},
                    files={"file": ("gemini_secret.txt", f, "text/plain")}
                )
            
            if response.status_code != 200:
                print(f"❌ Upload thất bại: {response.text}")
                return

            doc_id = response.json()["id"]
            print(f"✅ Upload thành công. Doc ID: {doc_id}")

            # --- BƯỚC 2: POLLING TRẠNG THÁI ---
            print("[Tenant A] Đang chờ xử lý tài liệu...")
            for _ in range(30): # Chờ tối đa 30s
                status_res = await client.get(
                    f"{BASE_URL}/files/status/{doc_id}",
                    headers={"X-API-Key": TENANT_A_KEY}
                )
                status = status_res.json()["status"]
                if status == "done":
                    print("✅ Xử lý tài liệu hoàn tất!")
                    break
                elif status == "error":
                    print(f"❌ Lỗi xử lý: {status_res.json().get('error_message')}")
                    return
                await asyncio.sleep(2)
            else:
                print("❌ Quá thời gian chờ xử lý.")
                return

            # --- BƯỚC 3: TRUY VẤN (TENANT A - SUCCESS) ---
            print("\n[Tenant A] Đang hỏi chatbot về mật mã...")
            query = "Mật mã bí mật của dự án Gemini là gì?"
            chat_res = await client.post(
                f"{BASE_URL}/chat",
                headers={"X-API-Key": TENANT_A_KEY},
                json={
                    "message": query,
                    "visitor_id": "tester_a"
                }
            )
            
            answer = chat_res.json().get("content", "")
            print(f"🤖 Bot A trả lời: {answer}")
            
            if "987654321" in answer:
                print("✅ [PASS] Tenant A đã lấy được thông tin từ RAG.")
            else:
                print("❌ [FAIL] Bot A không trả lời đúng thông tin bí mật.")

            # --- BƯỚC 4: TRUY VẤN (TENANT B - ISOLATION) ---
            print("\n[Tenant B] Đang thử hỏi chatbot câu tương tự...")
            chat_res_b = await client.post(
                f"{BASE_URL}/chat",
                headers={"X-API-Key": TENANT_B_KEY},
                json={
                    "message": query,
                    "visitor_id": "tester_b"
                }
            )
            
            answer_b = chat_res_b.json().get("content", "")
            print(f"🤖 Bot B trả lời: {answer_b}")
            
            if "987654321" not in answer_b:
                print("✅ [PASS] Tenant B không có quyền truy cập dữ liệu của Tenant A.")
            else:
                print("❌ [FAIL] Cách ly dữ liệu thất bại! Tenant B thấy thông tin của Tenant A.")

        finally:
            # Dọn dẹp
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Xóa file trong DB/Vector Store (nếu cần)
            if 'doc_id' in locals():
                await client.delete(
                    f"{BASE_URL}/files/{doc_id}",
                    headers={"X-API-Key": TENANT_A_KEY}
                )
                print(f"\n🧹 Đã dọn dẹp dữ liệu kiểm thử (Doc ID: {doc_id}).")

if __name__ == "__main__":
    asyncio.run(test_e2e_rag_flow())
