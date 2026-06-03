from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

class ChatSessionCreate(BaseModel):
    title: Optional[str] = None
    ticker: Optional[str] = None

class ChatMessageBase(BaseModel):
    role: str
    agent_name: Optional[str] = None
    content: str
    timestamp: Optional[datetime] = None

class ChatMessageResponse(ChatMessageBase):
    id: int

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    ticker: Optional[str] = None
    status: str
    created_at: datetime
    messages: Optional[List[ChatMessageResponse]] = []

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[dict]] = None
    
    # Configuration from UI
    ticker: Optional[str] = None
    analysis_date: Optional[str] = None
    llm_provider: Optional[str] = "openai"
    model: Optional[str] = "gpt-4o"
    quick_think_model: Optional[str] = None
    deep_think_model: Optional[str] = None
    depth: Optional[str] = "medium"
    reasoning_effort: Optional[str] = "medium"
    output_language: Optional[str] = "en"
    language: Optional[str] = None
    active_teams: Optional[List[str]] = Field(default_factory=lambda: ["Fundamentals", "Sentiment", "News", "Technical"])
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    top_k: Optional[int] = None
    max_tokens: Optional[int] = None
    max_retries: Optional[int] = None
