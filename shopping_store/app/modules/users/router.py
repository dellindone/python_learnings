from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users import controller
from app.core.database import get_db
from app.schemas.user import UpdateUserRequest
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/user", tags=["user"])

@router.get("/me")
async def get_current_user_function(current_user: AsyncSession = Depends(get_current_user)):
    return await controller.get_current_user(current_user)

@router.patch("/me")
async def update_current_user(
    data: UpdateUserRequest,
    current_user: AsyncSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await controller.update_current_user(current_user.id, data, db)