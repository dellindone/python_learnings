from uuid import UUID
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.product import Product
from app.schemas.product import CreateProductRequest, UpdateProductRequest

class ProductRepository:
    async def get_product_by_id(self, db: AsyncSession, product_id: UUID) -> Product:
        query = select(Product).where(Product.id == product_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_active_product_by_id(self, db: AsyncSession, product_id: UUID) -> Product:
        query = select(Product).where(Product.id == product_id, Product.is_active == True)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all_products(self, db: AsyncSession) -> list[Product]:
        query = select(Product).where(Product.is_active == True)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_product_by_name(self, db: AsyncSession, product_name: str) -> list[Product]:
        query = select(Product).where(Product.name == product_name)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_product_by_sku(self, db: AsyncSession, sku: str) -> Product:
        query = select(Product).where(Product.sku == sku)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_products_by_category_id(self, db: AsyncSession, category_id: UUID) -> list[Product]:
        query = select(Product).where(Product.category_id == category_id)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def create_product(self, db: AsyncSession, product_data: CreateProductRequest) -> Product:
        new_product = Product(**product_data.model_dump(exclude_unset=True))
        db.add(new_product)
        await db.commit()
        await db.refresh(new_product)
        return new_product

    async def update_product(self, db: AsyncSession, product_data: Product, update_product: UpdateProductRequest) -> Product:
        for field, value in update_product.model_dump(exclude_unset=True).items(): setattr(product_data, field, value)
        await db.commit()
        await db.refresh(product_data)
        return product_data
    
    async def update_stock(self, db: AsyncSession, product_data: Product, new_quantity: int) -> Product:
        product_data.stock_quantity = new_quantity
        await db.commit()
        await db.refresh(product_data)
        return product_data
    
    async def update_product_price(self, db: AsyncSession, product_data: Product, new_price: Decimal) -> Product:
        product_data.price = new_price
        await db.commit()
        await db.refresh(product_data)
        return product_data
    
    async def delete_product(self, db: AsyncSession, product: Product):
        await db.delete(product)
        await db.commit()

product_repository = ProductRepository()