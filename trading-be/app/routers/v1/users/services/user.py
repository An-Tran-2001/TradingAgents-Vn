from fastapi import Depends, HTTPException
from typing import Optional

from app.routers.v1.users.repositories.user import UserRepository
from app.routers.v1.users.repositories.setting import SettingRepository
from app.routers.v1.users.schemas.user import UserCreate
from app.routers.v1.auth.models.relational import User
from app.core.security import get_password_hash

class UserService:
    def __init__(
        self, 
        user_repo: UserRepository = Depends(),
        setting_repo: SettingRepository = Depends()
    ):
        self.user_repo = user_repo
        self.setting_repo = setting_repo

    async def register_user(self, user_in: UserCreate) -> User:
        user = await self.user_repo.get_by_email(user_in.email)
        if user:
            raise HTTPException(
                status_code=400,
                detail="The user with this username already exists in the system."
            )
        
        # Create User
        user_data = {
            "email": user_in.email,
            "password_hash": get_password_hash(user_in.password),
            "is_active": True
        }
        new_user = await self.user_repo.create(obj_in=user_data)
        
        # Initialize default settings
        await self.setting_repo.create(obj_in={"user_id": new_user.id})
        
        return new_user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        return await self.user_repo.get_by_email(email)

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        return await self.user_repo.get(user_id)
