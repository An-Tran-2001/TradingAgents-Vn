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
    
    # Configuration from UI
    ticker: Optional[str] = None
    llm_provider: Optional[str] = "openai"
    model: Optional[str] = "gpt-4o"
    depth: Optional[str] = "medium"
    reasoning_effort: Optional[str] = "medium"
    active_teams: Optional[List[str]] = Field(default_factory=lambda: ["Fundamentals", "Sentiment", "News", "Technical"])
