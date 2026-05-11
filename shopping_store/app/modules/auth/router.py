from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth import controller
from app.core.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await controller.register(data, db)

@router.post("/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await controller.login(data, db)

@router.post("/logout")
async def logout(refresh_token: str, db: AsyncSession = Depends(get_db)):
    return await controller.logout(refresh_token, db)

@router.get("/refresh_token")
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    return await controller.refresh_token(refresh_token, db)
