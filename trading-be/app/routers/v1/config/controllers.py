from typing import List
from fastapi import APIRouter, Depends

from app.routers.v1.config.schemas import ProviderInfo, ProviderDetailResponse
from app.routers.v1.config.service import ConfigService

router = APIRouter(prefix="/config", tags=["config"])


@router.get(
    "/providers",
    response_model=List[ProviderInfo],
    summary="Get all supported LLM providers",
    description="Returns the full list of LLM providers supported by TradingAgents, including their default base URLs, regional variants, and whether they require an API key.",
)
def list_providers(service: ConfigService = Depends()) -> List[ProviderInfo]:
    return service.list_providers()


@router.get(
    "/providers/{provider_id}/models",
    response_model=ProviderDetailResponse,
    summary="Get models for a specific provider",
    description="Returns provider details and all available models (quick and deep modes) for the given provider ID (e.g. `openai`, `anthropic`, `google`, `ollama`).",
)
def get_provider_models(
    provider_id: str,
    service: ConfigService = Depends(),
) -> ProviderDetailResponse:
    return service.get_provider_models(provider_id)
