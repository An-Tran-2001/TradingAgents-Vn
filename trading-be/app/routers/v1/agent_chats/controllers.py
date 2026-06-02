from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.dependencies.auth import get_current_user
from app.routers.v1.auth.models.relational import User
from app.routers.v1.agent_chats.schemas import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatRequest
)
from app.routers.v1.agent_chats.services import ChatService

router = APIRouter(prefix="/sessions", tags=["agent-chats"])

@router.post("/", response_model=ChatSessionResponse)
async def create_chat_session(
    request: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends()
) -> Any:
    return await chat_service.create_session(
        user_id=current_user.id,
        title=request.title,
        ticker=request.ticker
    )

@router.get("/", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends()
) -> Any:
    return await chat_service.get_user_sessions(current_user.id)

@router.get("/{session_id}", response_model=ChatSessionResponse)
async def get_session_details(
    session_id: int,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends()
) -> Any:
    session = await chat_service.get_session(session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.put("/{session_id}", response_model=ChatSessionResponse)
async def update_chat_session(
    session_id: int,
    request: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends()
) -> Any:
    session = await chat_service.get_session(session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    updated = await chat_service.update_session(session_id, request.title)
    return updated

@router.delete("/{session_id}")
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends()
) -> Any:
    session = await chat_service.get_session(session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    await chat_service.delete_session(session_id)
    return {"message": "Session deleted successfully"}

@router.post("/{session_id}/chat")
async def chat_with_agent(
    session_id: int,
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends()
) -> Any:
    session = await chat_service.get_session(session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return StreamingResponse(
        chat_service.chat_stream(session_id, current_user.id, request.model_dump()),
        media_type="text/event-stream"
    )
