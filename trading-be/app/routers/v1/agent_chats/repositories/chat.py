from typing import Optional, List
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.routers.v1.agent_chats.models.relational import ChatSession, ChatMessage
from app.dependencies.db import get_db

class ChatSessionRepository(BaseRepository[ChatSession]):
    def __init__(self, db: AsyncSession = Depends(get_db)):
        super().__init__(ChatSession, db)

    async def get_with_messages(self, session_id: int) -> Optional[ChatSession]:
        result = await self.db.execute(
            select(ChatSession)
            .options(selectinload(ChatSession.messages).selectinload(ChatMessage.report))
            .where(ChatSession.id == session_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: int) -> List[ChatSession]:
        result = await self.db.execute(
            select(ChatSession)
            .options(selectinload(ChatSession.messages))
            .where(ChatSession.user_id == user_id)
            .order_by(ChatSession.created_at.desc())
        )
        return result.scalars().all()

class ChatMessageRepository(BaseRepository[ChatMessage]):
    def __init__(self, db: AsyncSession = Depends(get_db)):
        super().__init__(ChatMessage, db)

    async def get_by_session_id(self, session_id: int) -> List[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.timestamp.asc())
        )
        return result.scalars().all()
