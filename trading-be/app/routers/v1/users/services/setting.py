from fastapi import Depends, HTTPException
from typing import Any

from app.routers.v1.users.repositories.setting import SettingRepository
from app.routers.v1.users.schemas.setting import UserSettingUpdate
from app.routers.v1.auth.models.relational import UserSetting

class SettingService:
    def __init__(self, setting_repo: SettingRepository = Depends()):
        self.setting_repo = setting_repo

    async def get_user_settings(self, user_id: int) -> UserSetting:
        settings = await self.setting_repo.get_by_user_id(user_id)
        if not settings:
            raise HTTPException(status_code=404, detail="Settings not found for this user.")
        return settings

    async def update_user_settings(self, user_id: int, settings_in: UserSettingUpdate) -> UserSetting:
        settings = await self.setting_repo.get_by_user_id(user_id)
        
        if not settings:
            # Create default if not found
            settings = await self.setting_repo.create(obj_in={"user_id": user_id})

        update_data = settings_in.model_dump(exclude_unset=True)
        updated_settings = await self.setting_repo.update(db_obj=settings, obj_in=update_data)
        
        return updated_settings
