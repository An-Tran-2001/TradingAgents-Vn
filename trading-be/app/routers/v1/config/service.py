"""
Config service: builds the provider and model catalog directly from the
CLI's single source of truth (tradingagents.llm_clients.model_catalog
and cli.utils._llm_provider_table).

No DB. No external calls. Pure in-memory computation.
"""
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
}
# Regional aliases share the same models
_MODEL_CATALOG["qwen-cn"] = _MODEL_CATALOG["qwen"]
_MODEL_CATALOG["glm-cn"] = _MODEL_CATALOG["glm"]
_MODEL_CATALOG["minimax-cn"] = _MODEL_CATALOG["minimax"]


class ConfigService:
    def list_providers(self) -> List[ProviderInfo]:
        return [
            ProviderInfo(
                id=p["id"],
                name=p["name"],
                base_url=p.get("base_url"),
                requires_api_key=p["requires_api_key"],
                regions=p.get("regions"),
            )
            for p in _PROVIDERS
        ]

    def get_provider_models(self, provider_id: str) -> ProviderDetailResponse:
        provider_data = next((p for p in _PROVIDERS if p["id"] == provider_id.lower()), None)
        if not provider_data:
            raise HTTPException(status_code=404, detail=f"Provider '{provider_id}' is not supported.")

        provider_info = ProviderInfo(
            id=provider_data["id"],
            name=provider_data["name"],
            base_url=provider_data.get("base_url"),
            requires_api_key=provider_data["requires_api_key"],
            regions=provider_data.get("regions"),
        )

        model_catalog = _MODEL_CATALOG.get(provider_id.lower(), {})
        models: List[ModelInfo] = []

        # For openrouter and azure, no static models
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
