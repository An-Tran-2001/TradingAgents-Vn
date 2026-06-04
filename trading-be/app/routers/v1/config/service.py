"""
Config service: builds the provider and model catalog directly from the
CLI's single source of truth (tradingagents.llm_clients.model_catalog
and cli.utils._llm_provider_table).

No DB. No external calls. Pure in-memory computation.
"""
import os
from typing import List, Optional, Dict
from fastapi import HTTPException

from app.routers.v1.config.schemas import ProviderInfo, ModelInfo, ProviderDetailResponse

# ── Canonical provider table (mirrors cli/utils.py _llm_provider_table) ───────
# We keep this here as a static copy so trading-be doesn't depend on the CLI
# package at runtime. Any update to cli/utils.py should be reflected here.
_PROVIDERS: List[Dict] = [
    {
        "id": "openai",
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "requires_api_key": True,
    },
    {
        "id": "google",
        "name": "Google Gemini",
        "base_url": None,
        "requires_api_key": True,
    },
    {
        "id": "anthropic",
        "name": "Anthropic Claude",
        "base_url": "https://api.anthropic.com/",
        "requires_api_key": True,
    },
    {
        "id": "xai",
        "name": "xAI (Grok)",
        "base_url": "https://api.x.ai/v1",
        "requires_api_key": True,
    },
    {
        "id": "deepseek",
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com",
        "requires_api_key": True,
    },
    {
        "id": "qwen",
        "name": "Qwen (International)",
        "base_url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        "requires_api_key": True,
        "regions": ["international", "china"],
    },
    {
        "id": "qwen-cn",
        "name": "Qwen (China)",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "requires_api_key": True,
        "regions": ["international", "china"],
    },
    {
        "id": "glm",
        "name": "GLM / Z.AI (International)",
        "base_url": "https://api.z.ai/api/paas/v4/",
        "requires_api_key": True,
        "regions": ["international", "china"],
    },
    {
        "id": "glm-cn",
        "name": "GLM / BigModel (China)",
        "base_url": "https://open.bigmodel.cn/api/paas/v4/",
        "requires_api_key": True,
        "regions": ["international", "china"],
    },
    {
        "id": "minimax",
        "name": "MiniMax (Global)",
        "base_url": "https://api.minimax.io/v1",
        "requires_api_key": True,
        "regions": ["global", "china"],
    },
    {
        "id": "minimax-cn",
        "name": "MiniMax (China)",
        "base_url": "https://api.minimaxi.com/v1",
        "requires_api_key": True,
        "regions": ["global", "china"],
    },
    {
        "id": "openrouter",
        "name": "OpenRouter",
        "base_url": "https://openrouter.ai/api/v1",
        "requires_api_key": True,
    },
    {
        "id": "azure",
        "name": "Azure OpenAI",
        "base_url": None,
        "requires_api_key": True,
    },
    {
        "id": "ollama",
        "name": "Ollama (Local)",
        "base_url": "http://localhost:11434/v1",
        "requires_api_key": False,
    },
    {
        "id": "lmstudio",
        "name": "LM Studio (Local)",
        "base_url": "http://localhost:1234/api/v1",
        "requires_api_key": False,
    },
]

# ── Model catalog (mirrors tradingagents/llm_clients/model_catalog.py) ─────────
_MODEL_CATALOG: Dict[str, Dict[str, List[tuple]]] = {
    "openai": {
        "quick": [
            ("GPT-5.4 Mini - Fast, strong coding and tool use", "gpt-5.4-mini"),
            ("GPT-5.4 Nano - Cheapest, high-volume tasks", "gpt-5.4-nano"),
            ("GPT-5.5 - Latest frontier, 1M context", "gpt-5.5"),
            ("GPT-4.1 - Smartest non-reasoning model", "gpt-4.1"),
        ],
        "deep": [
            ("GPT-5.5 - Latest frontier, 1M context", "gpt-5.5"),
            ("GPT-5.4 - Previous-gen frontier, 1M context, cost-effective", "gpt-5.4"),
            ("GPT-5.2 - Strong reasoning, cost-effective", "gpt-5.2"),
            ("GPT-5.5 Pro - Most capable", "gpt-5.5-pro"),
        ],
    },
    "anthropic": {
        "quick": [
            ("Claude Sonnet 4.6 - Best speed and intelligence balance", "claude-sonnet-4-6"),
            ("Claude Haiku 4.5 - Fastest with near-frontier intelligence", "claude-haiku-4-5"),
            ("Claude Sonnet 4.5 - High-performance for agents", "claude-sonnet-4-5"),
        ],
        "deep": [
            ("Claude Opus 4.8 - Latest frontier, agentic coding", "claude-opus-4-8"),
            ("Claude Opus 4.7 - Previous frontier", "claude-opus-4-7"),
            ("Claude Opus 4.6 - Frontier intelligence", "claude-opus-4-6"),
            ("Claude Sonnet 4.6 - Best speed and intelligence balance", "claude-sonnet-4-6"),
        ],
    },
    "google": {
        "quick": [
            ("Gemini 3.5 Flash - Latest, frontier agentic + coding (GA)", "gemini-3.5-flash"),
            ("Gemini 3.1 Flash Lite - Most cost-efficient (GA)", "gemini-3.1-flash-lite"),
            ("Gemini 2.5 Flash - Balanced, stable", "gemini-2.5-flash"),
            ("Gemini 2.5 Flash Lite - Fast, low-cost", "gemini-2.5-flash-lite"),
        ],
        "deep": [
            ("Gemini 3.1 Pro - Reasoning-first (preview)", "gemini-3.1-pro-preview"),
            ("Gemini 3.5 Flash - Latest GA, strong agentic + coding", "gemini-3.5-flash"),
            ("Gemini 2.5 Pro - Stable pro model", "gemini-2.5-pro"),
            ("Gemini 2.5 Flash - Balanced, stable", "gemini-2.5-flash"),
        ],
    },
    "xai": {
        "quick": [
            ("Grok 4.3 - Latest flagship, fast with built-in reasoning", "grok-4.3"),
            ("Grok Build 0.1 - Coding-specialized, 256K ctx", "grok-build-0.1"),
            ("Grok 4 Fast (Non-Reasoning) - Speed optimized", "grok-4-fast-non-reasoning"),
        ],
        "deep": [
            ("Grok 4.3 - Latest flagship, built-in reasoning, 1M ctx", "grok-4.3"),
            ("Grok 4.20 (Reasoning) - Previous-gen reasoning", "grok-4.20-0309-reasoning"),
            ("Grok 4 Fast (Reasoning) - High-performance", "grok-4-fast-reasoning"),
            ("Grok 4 - Flagship", "grok-4-0709"),
        ],
    },
    "deepseek": {
        "quick": [
            ("DeepSeek V4 Flash - Latest V4 fast model", "deepseek-v4-flash"),
            ("DeepSeek V3.2", "deepseek-chat"),
        ],
        "deep": [
            ("DeepSeek V4 Pro - Latest V4 flagship model", "deepseek-v4-pro"),
            ("DeepSeek V3.2 (thinking)", "deepseek-reasoner"),
            ("DeepSeek V3.2", "deepseek-chat"),
        ],
    },
    "qwen": {
        "quick": [
            ("Qwen 3.6 Flash - Latest fast, agentic coding + vision", "qwen3.6-flash"),
            ("Qwen 3.5 Flash - Previous-gen fast", "qwen3.5-flash"),
        ],
        "deep": [
            ("Qwen 3.7 Max - Latest flagship reasoning agent, 1M ctx", "qwen3.7-max"),
            ("Qwen 3.6 Plus - Vision-language, agentic coding", "qwen3.6-plus"),
            ("Qwen 3.5 Plus - Previous-gen flagship", "qwen3.5-plus"),
        ],
    },
    "glm": {
        "quick": [
            ("GLM-5-Turbo - Fast, switchable thinking modes", "glm-5-turbo"),
            ("GLM-4.7 - Previous-gen flagship", "glm-4.7"),
            ("GLM-4.5-Air - Lightweight, cost-efficient", "glm-4.5-air"),
        ],
        "deep": [
            ("GLM-5.1 - Latest flagship, 204K ctx", "glm-5.1"),
            ("GLM-5 - Flagship, 204K ctx", "glm-5"),
            ("GLM-4.7 - Previous-gen flagship", "glm-4.7"),
        ],
    },
    "minimax": {
        "quick": [
            ("MiniMax-M2.7-highspeed - ~100 TPS, 204K ctx", "MiniMax-M2.7-highspeed"),
            ("MiniMax-M2.5-highspeed - Previous-gen highspeed", "MiniMax-M2.5-highspeed"),
        ],
        "deep": [
            ("MiniMax-M2.7 - Flagship, SOTA on coding/agent", "MiniMax-M2.7"),
            ("MiniMax-M2.7-highspeed - Same quality, ~100 TPS", "MiniMax-M2.7-highspeed"),
            ("MiniMax-M2.5 - Previous-gen flagship", "MiniMax-M2.5"),
            ("MiniMax-M2.1 - Earlier M2 line", "MiniMax-M2.1"),
        ],
    },
    "ollama": {
        "quick": [
            ("Qwen3:latest (8B)", "qwen3:latest"),
            ("GPT-OSS:latest (20B)", "gpt-oss:latest"),
            ("GLM-4.7-Flash:latest (30B)", "glm-4.7-flash:latest"),
        ],
        "deep": [
            ("GLM-4.7-Flash:latest (30B)", "glm-4.7-flash:latest"),
            ("GPT-OSS:latest (20B)", "gpt-oss:latest"),
            ("Qwen3:latest (8B)", "qwen3:latest"),
        ],
    },
    "lmstudio": {
        "quick": [
            ("Llama 3 8B Instruct", "meta-llama-3-8b-instruct"),
            ("Qwen 2.5 7B Instruct", "qwen2.5-7b-instruct"),
        ],
        "deep": [
            ("Llama 3 8B Instruct", "meta-llama-3-8b-instruct"),
            ("Qwen 2.5 7B Instruct", "qwen2.5-7b-instruct"),
        ],
    },
}
# Regional aliases share the same models
_MODEL_CATALOG["qwen-cn"] = _MODEL_CATALOG["qwen"]
_MODEL_CATALOG["glm-cn"] = _MODEL_CATALOG["glm"]
_MODEL_CATALOG["minimax-cn"] = _MODEL_CATALOG["minimax"]

_API_KEY_MAPPING = {
    "openai": ["OPENAI_API_KEY"],
    "google": ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    "anthropic": ["ANTHROPIC_API_KEY"],
    "xai": ["XAI_API_KEY"],
    "deepseek": ["DEEPSEEK_API_KEY"],
    "qwen": ["DASHSCOPE_API_KEY"],
    "qwen-cn": ["DASHSCOPE_CN_API_KEY"],
    "glm": ["ZHIPU_API_KEY"],
    "glm-cn": ["ZHIPU_CN_API_KEY"],
    "minimax": ["MINIMAX_API_KEY"],
    "minimax-cn": ["MINIMAX_CN_API_KEY"],
    "openrouter": ["OPENROUTER_API_KEY"],
    "azure": ["AZURE_OPENAI_API_KEY"],
}

def _check_provider_ready(provider_id: str, requires_api_key: bool, user_api_keys: dict = None) -> bool:
    if not requires_api_key:
        return True
        
    if user_api_keys and provider_id in user_api_keys and user_api_keys[provider_id]:
        return True
        
    env_vars = _API_KEY_MAPPING.get(provider_id, [])
    return any(bool(os.getenv(env_var)) for env_var in env_vars)

class ConfigService:
    def list_providers(self, user_api_keys: dict = None) -> List[ProviderInfo]:
        user_api_keys = user_api_keys or {}
        return [
            ProviderInfo(
                id=p["id"],
                name=p["name"],
                base_url=p.get("base_url"),
                requires_api_key=p["requires_api_key"],
                is_ready=_check_provider_ready(p["id"], p["requires_api_key"], user_api_keys),
                regions=p.get("regions"),
            )
            for p in _PROVIDERS
        ]

    async def get_provider_models(self, provider_id: str, user_api_keys: dict = None, llm_backend_url: Optional[str] = None) -> ProviderDetailResponse:
        user_api_keys = user_api_keys or {}
        provider_lower = provider_id.lower()
        provider_data = next((p for p in _PROVIDERS if p["id"] == provider_lower), None)
        if not provider_data:
            raise HTTPException(status_code=404, detail=f"Provider '{provider_id}' is not supported.")

        provider_info = ProviderInfo(
            id=provider_data["id"],
            name=provider_data["name"],
            base_url=provider_data.get("base_url"),
            requires_api_key=provider_data["requires_api_key"],
            is_ready=_check_provider_ready(provider_data["id"], provider_data["requires_api_key"], user_api_keys),
            regions=provider_data.get("regions"),
        )

        models: List[ModelInfo] = []

        if provider_lower in ("ollama", "lmstudio"):
            base_url = llm_backend_url or provider_data.get("base_url")
            if not base_url:
                base_url = "http://localhost:11434/v1" if provider_lower == "ollama" else "http://localhost:1234/api/v1"

            try:
                import httpx
                base_url_stripped = base_url.rstrip("/")
                if provider_lower == "ollama":
                    if base_url_stripped.endswith("/tags"):
                        url = base_url_stripped
                    else:
                        if base_url_stripped.endswith("/v1"):
                            endpoint = base_url_stripped[:-3]
                        elif base_url_stripped.endswith("/api/v1"):
                            endpoint = base_url_stripped[:-7]
                        else:
                            endpoint = base_url_stripped
                        url = f"{endpoint}/api/tags"
                    
                    async with httpx.AsyncClient(timeout=2.0) as client:
                        response = await client.get(url)
                        if response.status_code == 200:
                            response_data = response.json()
                            for m in response_data.get("models", []):
                                m_name = m.get("name")
                                if m_name:
                                    models.append(ModelInfo(id=m_name, name=m_name, mode="quick"))
                                    models.append(ModelInfo(id=m_name, name=m_name, mode="deep"))
                else:  # lmstudio
                    if base_url_stripped.endswith("/models"):
                        url = base_url_stripped
                    elif base_url_stripped.endswith("/api/v1") or base_url_stripped.endswith("/v1"):
                        url = f"{base_url_stripped}/models"
                    else:
                        url = f"{base_url_stripped}/api/v1/models"
                    
                    async with httpx.AsyncClient(timeout=2.0) as client:
                        response = await client.get(url)
                        if response.status_code == 200:
                            response_data = response.json()
                            if "models" in response_data:
                                for m in response_data.get("models", []):
                                    # filter out non-LLM models if they exist, or show all
                                    m_id = m.get("key") or m.get("id")
                                    m_name = m.get("display_name") or m_id
                                    if m_id:
                                        models.append(ModelInfo(id=m_id, name=m_name, mode="quick"))
                                        models.append(ModelInfo(id=m_id, name=m_name, mode="deep"))
                            elif "data" in response_data:
                                for m in response_data.get("data", []):
                                    m_id = m.get("id")
                                    if m_id:
                                        models.append(ModelInfo(id=m_id, name=m_id, mode="quick"))
                                        models.append(ModelInfo(id=m_id, name=m_id, mode="deep"))
            except Exception as e:
                # Log or print warning, fall back to static list below
                pass

        elif provider_lower == "openrouter":
            # OpenRouter cho phép list models công khai (không cần key).
            # Nếu có API key -> thêm Authorization header (để thấy model private/org)
            # và validate key tại /api/v1/auth/key để update is_ready.
            api_key = (
                user_api_keys.get("openrouter")
                or os.getenv("OPENROUTER_API_KEY")
            )
            try:
                import httpx
                headers: dict = {
                    "HTTP-Referer": "https://tradingagents.ai",
                    "X-Title": "TradingAgents",
                }
                if api_key:
                    headers["Authorization"] = f"Bearer {api_key}"

                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.get(
                        "https://openrouter.ai/api/v1/models",
                        headers=headers,
                    )

                if response.status_code == 200:
                    data = response.json().get("data", [])

                    def _is_free(m: dict) -> bool:
                        pricing = m.get("pricing") or {}
                        prompt_price = str(pricing.get("prompt", "1"))
                        return prompt_price == "0"

                    # Lọc chỉ lấy text/chat completion models
                    chat_models = [
                        m for m in data
                        if "text" in (m.get("architecture", {}).get("output_modalities") or ["text"])
                        or "chat" in m.get("id", "").lower()
                        or not m.get("architecture")
                    ]

                    # Sắp xếp: free trước, rồi theo tên
                    chat_models.sort(key=lambda m: (not _is_free(m), m.get("name", m.get("id", ""))))

                    seen_ids: set = set()
                    for m in chat_models:
                        m_id = m.get("id")
                        m_name = m.get("name") or m_id
                        if not m_id or m_id in seen_ids:
                            continue
                        seen_ids.add(m_id)

                        pricing_raw = m.get("pricing") or {}
                        free = _is_free(m)
                        ctx = m.get("context_length")
                        desc = m.get("description") or ""
                        if len(desc) > 200:
                            desc = desc[:197] + "..."

                        model_info = ModelInfo(
                            id=m_id,
                            name=m_name,
                            mode="quick",
                            is_free=free,
                            context_length=ctx,
                            description=desc if desc else None,
                            pricing={
                                "prompt": pricing_raw.get("prompt", "0"),
                                "completion": pricing_raw.get("completion", "0"),
                            },
                        )
                        models.append(model_info)
                        models.append(model_info.model_copy(update={"mode": "deep"}))

                    # Nếu có API key, validate key hợp lệ -> cập nhật is_ready trong provider_info
                    if api_key:
                        try:
                            async with httpx.AsyncClient(timeout=5.0) as client:
                                key_resp = await client.get(
                                    "https://openrouter.ai/api/v1/auth/key",
                                    headers={"Authorization": f"Bearer {api_key}"},
                                )
                            if key_resp.status_code == 200:
                                key_data = key_resp.json().get("data", {})
                                # Key hợp lệ -> is_ready đã đúng (True từ _check_provider_ready)
                                # Có thể log usage: key_data.get("usage"), key_data.get("limit")
                                pass
                            else:
                                # Key không hợp lệ -> override is_ready = False
                                provider_info = provider_info.model_copy(update={"is_ready": False})
                        except Exception:
                            pass  # Không validate được -> giữ nguyên is_ready

                elif response.status_code == 401:
                    raise HTTPException(status_code=401, detail="OpenRouter API key không hợp lệ.")
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"OpenRouter API error: {response.text[:300]}",
                    )
            except HTTPException:
                raise
            except Exception:
                # Lỗi mạng -> fallback về static catalog bên dưới
                pass

        if not models:
            model_catalog = _MODEL_CATALOG.get(provider_lower, {})
            for mode, options in model_catalog.items():
                seen_ids = set()
                for display_name, model_id in options:
                    if model_id == "custom" or model_id in seen_ids:
                        continue
                    seen_ids.add(model_id)
                    models.append(ModelInfo(
                        id=model_id,
                        name=display_name,
                        mode=mode,
                    ))

        return ProviderDetailResponse(provider=provider_info, models=models)
