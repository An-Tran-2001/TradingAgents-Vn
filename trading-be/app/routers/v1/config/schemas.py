from typing import List, Optional
from pydantic import BaseModel


class ModelInfo(BaseModel):
    id: str
    name: str
    mode: str  # "quick" | "deep"


class ProviderInfo(BaseModel):
    id: str
    name: str
    base_url: Optional[str]
    requires_api_key: bool
    regions: Optional[List[str]] = None  # for providers with multi-region (qwen, glm, minimax)


class ProviderDetailResponse(BaseModel):
    provider: ProviderInfo
    models: List[ModelInfo]
