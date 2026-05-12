from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.cart_items import AddToCartRequest, UpdateCartItemRequest
from app.models.user import Users
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.cart import controller

router = APIRouter(prefix="/cart", tags=["cart"])

@router.get("/")
async def get_cart(
    user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await controller.get_cart(db, user)

@router.post('/')
async def add_to_cart(
    cart: AddToCartRequest,
    user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await controller.add_to_cart(db, user, cart)

@router.patch("/{product_id}")
async def update_cart_item(
    product_id: UUID, 
    update_cart: UpdateCartItemRequest,
    user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await controller.update_cart_item(db, user, product_id, update_cart)

@router.delete('/{product_id}')
async def remove_cart_item(
    product_id: UUID, 
    user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await controller.remove_cart_item(db, user, product_id)