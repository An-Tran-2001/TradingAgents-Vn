import pytest
from app.routers.v1.config.service import ConfigService
from app.routers.v1.config.schemas import ProviderDetailResponse

@pytest.mark.asyncio
async def test_list_providers():
    service = ConfigService()
    providers = service.list_providers()
    provider_ids = [p.id for p in providers]
    assert "lmstudio" in provider_ids
    assert "ollama" in provider_ids

@pytest.mark.asyncio
async def test_get_provider_models_fallback():
    service = ConfigService()
    # If endpoint isn't running, it should fallback to static catalog
    res = await service.get_provider_models("lmstudio", llm_backend_url="http://invalid-localhost:1234/api/v1")
    assert isinstance(res, ProviderDetailResponse)
    assert len(res.models) > 0
    model_ids = [m.id for m in res.models]
    assert "meta-llama-3-8b-instruct" in model_ids

@pytest.mark.asyncio
async def test_get_provider_models_ollama_mock(monkeypatch):
    import httpx
    
    class MockResponse:
        def __init__(self, json_data, status_code=200):
            self.json_data = json_data
            self.status_code = status_code
        
        def json(self):
            return self.json_data

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass
            
        async def __aenter__(self):
            return self
            
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass
            
        async def get(self, url):
            assert "/api/tags" in url
            return MockResponse({
                "models": [
                    {"name": "llama3.1:8b"}
                ]
            })

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)
    
    service = ConfigService()
    res = await service.get_provider_models("ollama", llm_backend_url="http://localhost:11434/v1")
    assert isinstance(res, ProviderDetailResponse)
    model_ids = [m.id for m in res.models]
    assert "llama3.1:8b" in model_ids

@pytest.mark.asyncio
async def test_get_provider_models_lmstudio_mock_data(monkeypatch):
    import httpx
    
    class MockResponse:
        def __init__(self, json_data, status_code=200):
            self.json_data = json_data
            self.status_code = status_code
        
        def json(self):
            return self.json_data

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass
            
        async def __aenter__(self):
            return self
            
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass
            
        async def get(self, url):
            assert "/models" in url
            return MockResponse({
                "data": [
                    {"id": "meta-llama-3-8b"}
                ]
            })

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)
    
    service = ConfigService()
    res = await service.get_provider_models("lmstudio", llm_backend_url="http://localhost:1234/v1")
    assert isinstance(res, ProviderDetailResponse)
    model_ids = [m.id for m in res.models]
    assert "meta-llama-3-8b" in model_ids

@pytest.mark.asyncio
async def test_get_provider_models_lmstudio_mock_models(monkeypatch):
    import httpx
    
    class MockResponse:
        def __init__(self, json_data, status_code=200):
            self.json_data = json_data
            self.status_code = status_code
        
        def json(self):
            return self.json_data

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass
            
        async def __aenter__(self):
            return self
            
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass
            
        async def get(self, url):
            assert "/models" in url
            return MockResponse({
                "models": [
                    {"key": "google/gemma-3-12b", "type": "llm", "display_name": "Gemma 3 12B"}
                ]
            })

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)
    
    service = ConfigService()
    res = await service.get_provider_models("lmstudio", llm_backend_url="http://localhost:1234/api/v1")
    assert isinstance(res, ProviderDetailResponse)
    model_ids = [m.id for m in res.models]
    assert "google/gemma-3-12b" in model_ids

def test_create_llm_client_lmstudio_no_api_key():
    from tradingagents.llm_clients import create_llm_client
    # Should not raise ValueError or OpenAI validation error
    client = create_llm_client(provider="lmstudio", model="google/gemma-3-12b", api_key=None)
    llm = client.get_llm()
    assert llm.openai_api_key.get_secret_value() == "ollama"
    assert llm.model_name == "google/gemma-3-12b"

def test_create_llm_client_lmstudio_base_url_rewrite():
    from tradingagents.llm_clients import create_llm_client
    client = create_llm_client(provider="lmstudio", model="google/gemma-3-12b", base_url="http://localhost:1234/api/v1")
    llm = client.get_llm()
    assert llm.openai_api_base == "http://localhost:1234/v1"
