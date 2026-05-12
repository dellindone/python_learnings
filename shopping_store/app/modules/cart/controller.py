from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Users
from app.utils.response import success
from app.modules.cart.service import cart_service
from app.schemas.cart_items import AddToCartRequest, UpdateCartItemRequest

async def add_to_cart(db: AsyncSession, user: Users, cart: AddToCartRequest) -> dict:
    data = await cart_service.add_to_cart(db, user, cart)
    return success(data=data.model_dump(), message="Item has been added to cart")

async def get_cart(db: AsyncSession, user: Users) -> dict:
    data = await cart_service.get_cart(db, user)
    return success(data=data.model_dump(), message="Cart fetched successfully")

async def update_cart_item(db: AsyncSession, user: Users, product_id: UUID, update_cart: UpdateCartItemRequest) -> dict:
    data = await cart_service.update_cart_item(db, user, product_id, update_cart)
    return success(data=data.model_dump(), message="Cart updated successfully")

async def remove_cart_item(db: AsyncSession, user: Users, product_id: UUID) -> dict:
    await cart_service.remove_cart_item(db, user,product_id)
    return success(data=None, message="Cart Removed successfully")
