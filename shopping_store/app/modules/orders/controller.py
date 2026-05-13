from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.response import success
from app.modules.orders.service import order_service
from app.models.user import Users


async def create_order(db: AsyncSession, user: Users) -> dict:
    data = await order_service.create_order(db, user)
    return success(data=data.model_dump(), message="Order created successfully")

async def get_orders(db: AsyncSession, user: Users) -> dict:
    data = await order_service.get_orders(db, user)
    return success(data=[d.model_dump() for d in data], message="Order fetched successfully")

async def cancel_order(db: AsyncSession, user: Users, order_id: UUID) -> dict:
    data = await order_service.cancel_order(db, user, order_id)
    return success(data=data.model_dump(), message="Order cancelled successfully")
