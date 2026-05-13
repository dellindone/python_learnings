from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Users
from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.modules.orders import controller

router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("/")
async def get_orders(
    db: AsyncSession = Depends(get_db),
    user: Users = Depends(get_current_user)
):
    return await controller.get_orders(db, user)

@router.post("/")
async def create_order(
    db: AsyncSession = Depends(get_db),
    user: Users = Depends(get_current_user)
):
    return await controller.create_order(db, user)

@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: Users = Depends(get_current_user)
):
    return await controller.cancel_order(db, user, order_id)
