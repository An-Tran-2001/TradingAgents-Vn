from typing import Optional
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.repository import BaseRepository
from app.routers.v1.auth.models.relational import User
from app.dependencies.db import get_db

class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession = Depends(get_db)):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
