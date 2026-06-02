from typing import Optional
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.repository import BaseRepository
from app.routers.v1.auth.models.relational import UserSetting
from app.dependencies.db import get_db

class SettingRepository(BaseRepository[UserSetting]):
    def __init__(self, db: AsyncSession = Depends(get_db)):
        super().__init__(UserSetting, db)

    async def get_by_user_id(self, user_id: int) -> Optional[UserSetting]:
        result = await self.db.execute(select(UserSetting).where(UserSetting.user_id == user_id))
        return result.scalar_one_or_none()
