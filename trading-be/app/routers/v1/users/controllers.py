from typing import Any
from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.routers.v1.auth.models.relational import User
from app.routers.v1.users.schemas.user import UserCreate, UserRead
from app.routers.v1.users.schemas.setting import UserSettingRead, UserSettingUpdate
from app.routers.v1.users.services.user import UserService
from app.routers.v1.users.services.setting import SettingService

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=UserRead)
async def register_user(
    user_in: UserCreate,
    user_service: UserService = Depends()
) -> Any:
    return await user_service.register_user(user_in)

@router.get("/settings", response_model=UserSettingRead)
async def get_user_settings(
    current_user: User = Depends(get_current_user),
    setting_service: SettingService = Depends()
) -> Any:
    return await setting_service.get_user_settings(current_user.id)

@router.put("/settings", response_model=UserSettingRead)
async def update_user_settings(
    settings_in: UserSettingUpdate,
    current_user: User = Depends(get_current_user),
    setting_service: SettingService = Depends()
) -> Any:
    return await setting_service.update_user_settings(current_user.id, settings_in)