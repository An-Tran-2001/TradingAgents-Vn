import pytest
import pytest_asyncio
from httpx import AsyncClient
from unittest.mock import patch, MagicMock

@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient, test_user):
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "testpass123"}
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_create_session(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/sessions/",
        json={"title": "Test Chat", "ticker": "AAPL"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Chat"
    assert data["ticker"] == "AAPL"
    assert "id" in data

@pytest.mark.asyncio
async def test_get_sessions(client: AsyncClient, auth_headers):
    # Create one session first
    await client.post(
        "/api/v1/sessions/",
        json={"title": "Test Chat", "ticker": "AAPL"},
        headers=auth_headers
    )
    
    response = await client.get("/api/v1/sessions/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["title"] == "Test Chat"

@pytest.mark.asyncio
async def test_get_session_details(client: AsyncClient, auth_headers):
    # Create session
    create_res = await client.post(
        "/api/v1/sessions/",
        json={"title": "Specific Chat", "ticker": "MSFT"},
        headers=auth_headers
    )
    session_id = create_res.json()["id"]
    
    response = await client.get(f"/api/v1/sessions/{session_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["ticker"] == "MSFT"

@pytest.mark.asyncio
async def test_get_session_details_not_found(client: AsyncClient, auth_headers):
    response = await client.get("/api/v1/sessions/9999", headers=auth_headers)
    assert response.status_code == 404

from unittest.mock import patch, MagicMock, AsyncMock

# Mocking the orchestrator to test the chat endpoint
@pytest.mark.asyncio
@patch("app.routers.v1.agent_chats.services.OrchestratorAgent")
@patch("app.routers.v1.agent_chats.services.MongoStatsCallbackHandler")
async def test_chat_stream_text(MockCallback, MockOrchestrator, client: AsyncClient, auth_headers):
    # Create session
    create_res = await client.post(
        "/api/v1/sessions/",
        json={"title": "Test Chat"},
        headers=auth_headers
    )
    session_id = create_res.json()["id"]

    # Setup Mock
    mock_orchestrator_instance = AsyncMock()
    mock_orchestrator_instance.get_response.return_value = {
        "type": "text", 
        "content": "Hello, I am a mock agent"
    }
    MockOrchestrator.return_value = mock_orchestrator_instance

    response = await client.post(
        f"/api/v1/sessions/{session_id}/chat",
        json={"message": "Hi"},
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert "Hello, I am a mock agent" in response.text
