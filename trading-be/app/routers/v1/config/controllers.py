from typing import List
from fastapi import APIRouter, Depends

from app.routers.v1.config.schemas import ProviderInfo, ProviderDetailResponse
from app.routers.v1.config.service import ConfigService
from app.routers.v1.users.repositories.setting import SettingRepository
from fastapi import Request
from jose import jwt
from app.core.config import settings
from app.core.security import ALGORITHM

router = APIRouter(prefix="/config", tags=["config"])


@router.get(
    "/providers",
    response_model=List[ProviderInfo],
    summary="Get all supported LLM providers",
    description="Returns the full list of LLM providers supported by TradingAgents, including their default base URLs, regional variants, and whether they require an API key.",
)
async def list_providers(
    request: Request,
    service: ConfigService = Depends(),
    setting_repo: SettingRepository = Depends()
) -> List[ProviderInfo]:
    user_api_keys = {}
    token = request.headers.get("Authorization")
    if token and token.startswith("Bearer "):
        try:
            token_val = token.split(" ")[1]
            payload = jwt.decode(token_val, settings.SECRET_KEY, algorithms=[ALGORITHM])
            user_id = int(payload.get("sub"))
            user_settings = await setting_repo.get_by_user_id(user_id)
            if user_settings and user_settings.api_keys:
                user_api_keys = user_settings.api_keys
        except Exception:
            pass
            
    return service.list_providers(user_api_keys)


@router.get(
    "/providers/{provider_id}/models",
    response_model=ProviderDetailResponse,
    summary="Get models for a specific provider",
    description="Returns provider details and all available models (quick and deep modes) for the given provider ID (e.g. `openai`, `anthropic`, `google`, `ollama`).",
)
async def get_provider_models(
    provider_id: str,
    request: Request,
    service: ConfigService = Depends(),
    setting_repo: SettingRepository = Depends()
) -> ProviderDetailResponse:
    user_api_keys = {}
    token = request.headers.get("Authorization")
    if token and token.startswith("Bearer "):
        try:
            token_val = token.split(" ")[1]
            payload = jwt.decode(token_val, settings.SECRET_KEY, algorithms=[ALGORITHM])
            user_id = int(payload.get("sub"))
            user_settings = await setting_repo.get_by_user_id(user_id)
            if user_settings and user_settings.api_keys:
                user_api_keys = user_settings.api_keys
        except Exception:
            pass
            
    return service.get_provider_models(provider_id, user_api_keys)
