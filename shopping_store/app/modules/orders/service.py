from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.orders.repository import order_repository
from app.modules.cart.repository import cart_repository, cart_item_repository
from app.modules.products.repository import product_repository

from app.models.user import Users
from app.models.order import OrderStatus
from app.schemas.order import OrderResponse

from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException

class OrderService:
    async def create_order(self, db: AsyncSession, user: Users) -> OrderResponse:
        total_amount = 0
        cart = await cart_repository.get_cart_by_user_id(db, user.id)
        if not cart: raise NotFoundException("Cart not found")
        if not cart.items: raise BadRequestException("Cart is empty")

        for item in cart.items:
            product = await product_repository.get_product_by_id(db, item.product_id)
            if product.stock_quantity < item.quantity:
                raise BadRequestException(f"{product.name} has only {product.stock_quantity}.")
            total_amount += product.price * item.quantity

        async with db.begin():
            order = await order_repository.create_order(db, user.id, total_amount)

            for item in cart.items:
                product = await product_repository.get_product_by_id(db, item.product_id)

                await order_repository.create_order_item(
                    db,
                    order_id=order.id,
                    product_id=item.product_id,
                    product_name=product.name,
                    unit_price=product.price,
                    quantity=item.quantity,
                    subtotal=product.price * item.quantity
                )
                product.stock_quantity -= item.quantity
                await db.flush()
            await cart_item_repository.clear_cart(db, cart_id=cart.id)
        return OrderResponse.model_validate(order)
    
    async def get_orders(self, db: AsyncSession, user: Users) -> list[OrderResponse]:
        orders = await order_repository.get_orders_by_user_id(db, user)
        return [OrderResponse.model_validate(order) for order in orders]
    
    async def cancel_order(self, db: AsyncSession, user: Users, order_id: UUID) -> OrderResponse:
        order = await order_repository.get_order_by_id(db, order_id)
        if not order: raise NotFoundException("Order not found")
        if order.user_id != user.id: raise ForbiddenException("Not your order")
        if order.status == OrderStatus.CANCELLED: raise BadRequestException("Order already cancelled")
        if order.status == OrderStatus.DELIVERED: raise BadRequestException("Delivered order cannot be cancelled")
        cancel_order = await order_repository.update_order_status(db, order, OrderStatus.CANCELLED)
        return OrderResponse.model_validate(cancel_order)
    
order_service = OrderService()