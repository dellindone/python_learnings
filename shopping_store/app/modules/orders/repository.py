from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from uuid import UUID
from decimal import Decimal

from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.user import Users

class OrderRepository:
    async def create_order(self, db: AsyncSession, user_id: UUID, total_amount: Decimal) -> Order:
        order = Order(user_id=user_id,total_amount=total_amount)
        db.add(order)
        await db.commit()
        await db.refresh(order)
        return order

    async def get_order_by_id(self, db: AsyncSession, order_id: UUID) -> Order:
        query = select(Order).where(Order.id == order_id).options(selectinload(Order.items))
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def create_order_item(self, db: AsyncSession, order_id: UUID, product_id: UUID, product_name: str, unit_price: Decimal, quantity: int, subtotal: Decimal) -> OrderItem:
        order_item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            product_name=product_name,
            unit_price=unit_price,
            quantity=quantity,
            subtotal=subtotal
        )
        db.add(order_item)
        await db.commit()
        await db.refresh(order_item)
        return order_item

    async def get_orders_by_user_id(self, db: AsyncSession, user: Users) -> list[Order]:
        orders = select(Order).where(Order.user_id == user.id).options(selectinload(Order.items))
        result = await db.execute(orders)
        return result.scalars().all()

    async def update_order_status(self, db: AsyncSession, order: Order, status: OrderStatus) -> Order:
        order.status = status
        await db.commit()
        await db.refresh(order)
        return order
    
order_repository = OrderRepository()