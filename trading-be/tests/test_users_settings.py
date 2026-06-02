import pytest
import pytest_asyncio
from httpx import AsyncClient

@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient, test_user):
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "testpass123"}
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_get_user_settings(client: AsyncClient, auth_headers):
    response = await client.get("/api/v1/users/settings", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["llm_provider"] == "openai"
    assert data["deep_think_model"] == "gpt-4o"

@pytest.mark.asyncio
async def test_update_user_settings(client: AsyncClient, auth_headers):
    # Update some settings
    update_data = {
        "llm_provider": "anthropic",
        "deep_think_model": "claude-3-5-sonnet",
        "api_keys": {"openai": "sk-test", "anthropic": "sk-ant-test"}
    }
    
    response = await client.put(
        "/api/v1/users/settings", 
        json=update_data, 
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["llm_provider"] == "anthropic"
    assert data["deep_think_model"] == "claude-3-5-sonnet"
    assert data["api_keys"]["openai"] == "sk-test"
    assert data["api_keys"]["anthropic"] == "sk-ant-test"
    
    # Verify it persisted by fetching again
    get_res = await client.get("/api/v1/users/settings", headers=auth_headers)
    get_data = get_res.json()
    assert get_data["llm_provider"] == "anthropic"

@pytest.mark.asyncio
async def test_partial_update_user_settings(client: AsyncClient, auth_headers):
    # Only update language
    update_data = {"language": "Vietnamese"}
    response = await client.put(
        "/api/v1/users/settings", 
        json=update_data, 
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "Vietnamese"
    # Ensure other settings were not erased
    assert data["llm_provider"] == "anthropic" # from previous test
