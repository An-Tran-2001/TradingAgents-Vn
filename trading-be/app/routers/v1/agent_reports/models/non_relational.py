from beanie import Document
from pydantic import Field
from datetime import datetime, timezone
from typing import Optional, Dict, Any

class AgentLog(Document):
    report_id: Optional[int] = Field(None, description="Linked PostgreSQL Report ID")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    team: str
    agent_name: str
    log_type: str # e.g. Action, Reasoning, Tool
    content: str
    meta_data: Optional[Dict[str, Any]] = None

    class Settings:
        name = "agent_logs"
        indexes = [
            "report_id",
            "agent_name"
        ]

class TokenUsage(Document):
    user_id: int = Field(..., description="Linked PostgreSQL User ID")
    message_id: Optional[int] = Field(None, description="Linked PostgreSQL ChatMessage ID")
    report_id: Optional[int] = Field(None, description="Linked PostgreSQL Report ID")
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "token_usages"
        indexes = [
            "user_id",
            "report_id"
        ]
