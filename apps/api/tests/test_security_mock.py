import pytest
from fastapi.testclient import TestClient
from main import app
from unittest.mock import MagicMock, patch, AsyncMock
from models.tenant import Tenant

client = TestClient(app)

# Mock data
MOCK_TENANT = Tenant(
    id=1,
    name="Mock Tenant",
    slug="mock-tenant",
    public_key="pk_live_mock_123",
    secret_key="sk_live_mock_456",
    allowed_origins=["localhost:3000", "example.com"],
    is_active=True
)

def test_missing_api_key():
    response = client.get("/api/v1/chat/test")
    assert response.status_code == 401

@patch("api.middleware.async_session")
@patch("core.rate_limit.rate_limiter.is_rate_limited", new_callable=AsyncMock)
def test_valid_public_key(mock_rate_limit, mock_session_cm):
    # Setup mock rate limit
    mock_rate_limit.return_value = False
    
    # Setup mock session as Async Context Manager
    mock_session = AsyncMock()
    mock_session_cm.return_value.__aenter__.return_value = mock_session
    
    # Setup query result
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = MOCK_TENANT
    mock_session.execute.return_value = mock_result

    response = client.get(
        "/api/v1/chat/test", 
        headers={
            "X-API-Key": "pk_live_mock_123",
            "Origin": "http://localhost:3000"
        }
    )
    assert response.status_code == 200
    assert response.json()["tenant_name"] == "Mock Tenant"
    assert response.json()["is_admin"] is False

@patch("api.middleware.async_session")
@patch("core.rate_limit.rate_limiter.is_rate_limited", new_callable=AsyncMock)
def test_invalid_origin(mock_rate_limit, mock_session_cm):
    mock_rate_limit.return_value = False
    
    mock_session = AsyncMock()
    mock_session_cm.return_value.__aenter__.return_value = mock_session
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = MOCK_TENANT
    mock_session.execute.return_value = mock_result

    response = client.get(
        "/api/v1/chat/test", 
        headers={
            "X-API-Key": "pk_live_mock_123",
            "Origin": "http://hacker.com"
        }
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"]

@patch("api.middleware.async_session")
@patch("core.rate_limit.rate_limiter.is_rate_limited", new_callable=AsyncMock)
def test_rate_limiting_triggered(mock_rate_limit, mock_session_cm):
    mock_rate_limit.return_value = True
    
    mock_session = AsyncMock()
    mock_session_cm.return_value.__aenter__.return_value = mock_session
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = MOCK_TENANT
    mock_session.execute.return_value = mock_result

    response = client.get(
        "/api/v1/chat/test", 
        headers={"X-API-Key": "sk_live_mock_456"}
    )
    assert response.status_code == 429
    assert "Too many" in response.json()["detail"]

