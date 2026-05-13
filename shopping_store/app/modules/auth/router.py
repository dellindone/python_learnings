from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth import controller
from app.core.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshTokenRequest, LogoutRequest

from app.middlewares.rate_limiting import register_rate_limit, login_rate_limit

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", status_code=201)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(register_rate_limit)
):
    return await controller.register(data, db)

@router.post("/login")
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(login_rate_limit)

):
    return await controller.login(data, db)

@router.post("/logout")
async def logout(logout_request: LogoutRequest, db: AsyncSession = Depends(get_db)):
    return await controller.logout(logout_request.refresh_token, db)

@router.post("/refresh_token")
async def refresh_token(refresh_token: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    return await controller.refresh_token(refresh_token, db)
