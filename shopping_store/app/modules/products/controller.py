from uuid import UUID
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.response import success
from app.modules.products.service import product_service
from app.core.exceptions import NotFoundException
from app.schemas.product import CreateProductRequest, UpdateProductRequest

async def get_product_by_id( db: AsyncSession, product_id: UUID) -> dict:
    data = await product_service.get_product_by_id(db, product_id)
    if not data: raise NotFoundException("Product not found by id..")
    return success(data=data.model_dump(), message="Product Fetched Successfully..")

async def get_all_products( db: AsyncSession) -> dict:
    data = await product_service.get_all_products(db)
    return success(data=[d.model_dump() for d in data], message="Product Fetched Successfully..")

async def get_product_by_name( db: AsyncSession, product_name: str) -> dict:
    data = await product_service.get_product_by_name(db, product_name)
    if not data: raise NotFoundException("Product not found by name..")
    return success(data=data.model_dump(), message="Product Fetched Successfully..")

async def get_products_by_category_id( db: AsyncSession, category_id: UUID) -> dict:
    data = await product_service.get_products_by_category_id(db, category_id)
    return success(data=[d.model_dump() for d in data], message="Product Fetched Successfully..")

async def create_product( db: AsyncSession, product_data: CreateProductRequest) -> dict:
    data = await product_service.create_product(db, product_data)
    return success(data=data.model_dump(), message="Product Created Successfully")

async def update_product( db: AsyncSession, product_id: UUID, update_product: UpdateProductRequest) -> dict:
    data = await product_service.update_product(db, product_id, update_product)
    return success(data=data.model_dump(), message="Product Updated Successfully")

async def update_stock( db: AsyncSession, product_id: UUID, new_quantity: int) -> dict:
    data = await product_service.update_stock(db, product_id, new_quantity)
    return success(data=data.model_dump(), message="Product Updated Successfully")

async def update_product_price( db: AsyncSession, product_id: UUID, new_price: Decimal) -> dict:
    data = await product_service.update_product_price(db, product_id, new_price)
    return success(data=data.model_dump(), message="Product Updated Successfully")

async def delete_product( db: AsyncSession, product_id: UUID) -> dict:
    await product_service.delete_product(db, product_id)
    return success(data=None, message="Product Deleted Successfully")
