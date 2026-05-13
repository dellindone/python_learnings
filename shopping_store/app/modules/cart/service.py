from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.cart.repository import cart_repository, cart_item_repository
from app.modules.products.repository import product_repository
from app.core.exceptions import NotFoundException, BadRequestException
from app.schemas.cart import CartResponse
from app.schemas.cart_items import CartItemResponse, AddToCartRequest, UpdateCartItemRequest
from app.models.user import Users

class CartService:
    
    async def add_to_cart(self, db: AsyncSession, user: Users, cart: AddToCartRequest) -> CartItemResponse:
        user_cart = await cart_repository.get_cart_by_user_id(db, user.id)
        if not user_cart:
            user_cart = await cart_repository.create_cart(db, user.id)
        
        user_cart_item = await cart_item_repository.get_cart_item(db, user_cart.id, cart.product_id)
        product = await product_repository.get_active_product_by_id(db, cart.product_id)
        if not product: raise NotFoundException("Product not found or inactive")
        if not user_cart_item:
            if product.stock_quantity < cart.quantity:
                raise BadRequestException(f"Insufficient stock.. Available stock {product.stock_quantity}")
            final_cart_item = await cart_item_repository.add_item(db, user_cart.id, cart.product_id, cart.quantity)
        else:
            final_cart_item = await cart_item_repository.update_item_quantity(db, user_cart_item, cart.quantity + user_cart_item.quantity)
        return CartItemResponse.model_validate(final_cart_item)
        
    async def get_cart(self, db: AsyncSession, user: Users) -> CartResponse:
        user_cart = await cart_repository.get_cart_by_user_id(db, user.id)
        if not user_cart: raise NotFoundException("Cart not found")
        return CartResponse.model_validate(user_cart) 
    
    async def update_cart_item(self, db: AsyncSession, user: Users, product_id: UUID, update_cart: UpdateCartItemRequest) -> CartItemResponse:
        user_cart = await cart_repository.get_cart_by_user_id(db, user.id)
        if not user_cart: raise NotFoundException("Cart not found")
        user_cart_item = await cart_item_repository.get_cart_item(db, user_cart.id, product_id)
        if not user_cart_item: raise NotFoundException("CartItem not found")
        product = await product_repository.get_active_product_by_id(db, product_id)
        if not product: raise NotFoundException("Product not found or inactive")
        if product.stock_quantity < (update_cart.quantity + user_cart_item.quantity):
            raise BadRequestException(f"Insufficient stock.. Available stock {product.stock_quantity}")
        updated_cart = await cart_item_repository.update_item_quantity(db, user_cart_item, user_cart_item.quantity + update_cart.quantity)
        return CartItemResponse.model_validate(updated_cart)

    async def remove_cart_item(self, db: AsyncSession, user: Users, product_id: UUID) -> None:
        user_cart = await cart_repository.get_cart_by_user_id(db, user.id)
        if not user_cart: raise NotFoundException("Cart not found")
        user_cart_item = await cart_item_repository.get_cart_item(db, user_cart.id, product_id)
        if not user_cart_item: raise NotFoundException("CartItem not found")
        await cart_item_repository.remove_item(db, user_cart_item)

cart_service = CartService()
