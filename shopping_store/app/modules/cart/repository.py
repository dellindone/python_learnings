from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, delete
from uuid import UUID

from app.models.cart import Cart
from app.models.cart_item import CartItem

class CartRepository:
    async def get_cart_by_user_id(self, db: AsyncSession, user_id: UUID):
        query = select(Cart).where(Cart.user_id == user_id).options(selectinload(Cart.items))
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def create_cart(self, db: AsyncSession, user_id: UUID) -> Cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
        return cart

class CartItemRepository:
    async def get_cart_item(self, db: AsyncSession, cart_id: UUID, product_id: UUID) -> CartItem:
        query = select(CartItem).where(CartItem.cart_id == cart_id, CartItem.product_id == product_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def add_item(self, db: AsyncSession, cart_id: UUID, product_id: UUID, quantity: int) -> CartItem:
        cart_item = CartItem(cart_id=cart_id, product_id=product_id, quantity=quantity)
        db.add(cart_item)
        await db.commit()
        await db.refresh(cart_item)
        return cart_item
    
    async def update_item_quantity(self, db: AsyncSession, cart_item: CartItem, quantity: int) -> CartItem:
        cart_item.quantity = quantity
        await db.commit()
        await db.refresh(cart_item)
        return cart_item

    async def remove_item(self, db: AsyncSession, cart: CartItem) -> None:
        await db.delete(cart)
        await db.commit()

    async def clear_cart(self, db: AsyncSession, cart_id: UUID) -> None:
        query = delete(CartItem).where(CartItem.cart_id == cart_id)
        await db.execute(query)
        await db.commit()

cart_repository = CartRepository()
cart_item_repository = CartItemRepository()
