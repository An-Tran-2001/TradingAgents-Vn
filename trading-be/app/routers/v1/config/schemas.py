from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class ModelInfo(BaseModel):
    id: str
    name: str
    mode: str  # "quick" | "deep"
    is_free: Optional[bool] = None           # True nếu model miễn phí (OpenRouter)
    context_length: Optional[int] = None    # Context window size
    description: Optional[str] = None       # Mô tả ngắn
    pricing: Optional[Dict[str, Any]] = None  # Thông tin giá {prompt, completion}


class ProviderInfo(BaseModel):
    id: str
    name: str
    base_url: Optional[str]
    requires_api_key: bool
    is_ready: bool
    regions: Optional[List[str]] = None  # for providers with multi-region (qwen, glm, minimax)


class ProviderDetailResponse(BaseModel):
    provider: ProviderInfo
    models: List[ModelInfo]
