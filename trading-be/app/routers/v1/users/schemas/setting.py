from pydantic import BaseModel
from typing import Optional, Dict, Any

class UserSettingBase(BaseModel):
    api_keys: Optional[Dict[str, Any]] = None
    llm_provider: Optional[str] = "openai"
    deep_think_model: Optional[str] = "gpt-4o"
    quick_think_model: Optional[str] = "gpt-4o-mini"
    language: Optional[str] = "English"
    max_debate_rounds: Optional[int] = 1
    max_risk_rounds: Optional[int] = 1
    temperature: Optional[float] = 0.0
    llm_backend_url: Optional[str] = None
    checkpoint_enabled: Optional[bool] = False

class UserSettingUpdate(BaseModel):
    api_keys: Optional[Dict[str, Any]] = None
    llm_provider: Optional[str] = None
    deep_think_model: Optional[str] = None
    quick_think_model: Optional[str] = None
    language: Optional[str] = None
    max_debate_rounds: Optional[int] = None
    max_risk_rounds: Optional[int] = None
    temperature: Optional[float] = None
    llm_backend_url: Optional[str] = None
    checkpoint_enabled: Optional[bool] = None

class UserSettingRead(UserSettingBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
