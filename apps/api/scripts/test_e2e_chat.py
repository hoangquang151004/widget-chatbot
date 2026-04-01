import requests
import json

def test_chat():
    url = "http://localhost:8001/api/v1/chat"
    headers = {
        "X-API-Key": "pk_live_CXal62yBz9N5WCVYIvEt3fe7rE4Js4VT-Gsg38zjhAg",
        "Content-Type": "application/json"
    }
    payload = {
        "query": "Chào bạn, bạn là ai?",
        "session_id": "test_e2e_session"
    }
    
    print(f"Gửi request tới: {url}")
    print(f"Payload: {json.dumps(payload, ensure_ascii=False)}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response:", json.dumps(response.json(), indent=2, ensure_ascii=False))
        else:
            print("Error:", response.text)
    except Exception as e:
        print(f"Lỗi kết nối: {e}")

if __name__ == "__main__":
    test_chat()
