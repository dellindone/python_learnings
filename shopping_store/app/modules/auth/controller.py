from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Users
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.modules.auth.service import auth_service
from app.utils.response import success

async def register(data: RegisterRequest, db: AsyncSession):
    access_token, refresh_token = await auth_service.register(data, db)
    token_data = TokenResponse(access_token=access_token, refresh_token=refresh_token)
    return success(data=token_data.model_dump(), message="User registered successfully")

async def login(data: LoginRequest, db: AsyncSession):
    access_token, refresh_token = await auth_service.login(data, db)
    token_data = TokenResponse(access_token=access_token, refresh_token=refresh_token)
    return success(data=token_data.model_dump(), message="Login successful")

async def refresh_token(refresh_token: str, db: AsyncSession):
    access_token, refresh_token = await auth_service.refresh_token(refresh_token, db)
    token_data = TokenResponse(access_token=access_token, refresh_token=refresh_token)
    return success(data=token_data.model_dump(), message="Token refreshed successfully")

async def logout(refresh_token: str, db: AsyncSession):
    await auth_service.logout(refresh_token, db)
    return success(data=None, message="Logout successful")
