from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "TradingAgents Backend"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "super-secret-key-for-development"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./trading_agents.db"
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "trading_agents_logs"
    
    # AI / LLM Config
    OPENAI_API_KEY: Optional[str] = None
    LLM_PROVIDER: str = "openai"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="allow")

settings = Settings()
