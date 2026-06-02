from typing import Any
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.dependencies.auth import get_current_user
from app.routers.v1.auth.models.relational import User
from app.routers.v1.auth.schemas.token import Token
from app.routers.v1.users.schemas.user import UserRead
from app.routers.v1.auth.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    return await auth_service.authenticate_user(form_data)

@router.get("/me", response_model=UserRead)
async def read_users_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user.
    """
    return current_user