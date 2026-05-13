from uuid import UUID
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.products.repository import product_repository
from app.modules.categories.repository import category_repository
from app.schemas.product import CreateProductRequest, UpdateProductRequest, ProductResponse
from app.core.exceptions import ConflictException, NotFoundException
from app.core.cache import get_cache, set_cache, delete_cache

class ProductService:

    async def get_product_by_id(self, db: AsyncSession, product_id: UUID) -> ProductResponse:
        cache_key = f"product:{product_id}"
        cache_data = await get_cache(cache_key)
        if cache_data: return cache_data
        product = await product_repository.get_product_by_id(db, product_id)
        if not product: return None
        serialized = ProductResponse.model_validate(product).model_dump(mode="json")
        await set_cache(cache_key, serialized, ttl=600)
        return serialized

    async def get_all_products(self, db: AsyncSession) -> list[ProductResponse]:
        cache_key = "products:all"
        cache_data = await get_cache(cache_key)
        if cache_data: return cache_data
        products = await product_repository.get_all_products(db)
        serialized = [ProductResponse.model_validate(p).model_dump(mode="json") for p in products]
        await set_cache(cache_key, serialized, ttl=300)
        return serialized

    async def get_product_by_name(self, db: AsyncSession, product_name: str) -> list[ProductResponse]:
        products = await product_repository.get_product_by_name(db, product_name)
        return [ProductResponse.model_validate(product) for product in products]

    async def get_products_by_category_id(self, db: AsyncSession, category_id: UUID) -> list[ProductResponse]:
        products = await product_repository.get_products_by_category_id(db, category_id)
        return [ProductResponse.model_validate(product) for product in products]

    async def create_product(self, db: AsyncSession, product_data: CreateProductRequest) -> ProductResponse:
        categoty_data = await category_repository.get_category_by_id(db, product_data.category_id)
        if not categoty_data: raise NotFoundException("Category not found")
        sku_exists = await product_repository.get_product_by_sku(db, product_data.sku)
        if sku_exists: raise ConflictException("SKU already exists")
        product = await product_repository.create_product(db, product_data)
        await delete_cache("products:all")
        return ProductResponse.model_validate(product)

    async def update_product(self, db: AsyncSession, product_id: UUID, update_product: UpdateProductRequest) -> ProductResponse:
        product = await product_repository.get_product_by_id(db, product_id)
        if not product: raise NotFoundException("Product Not Found")
        update_product = await product_repository.update_product(db, product, update_product)
        await delete_cache("products:all")
        await delete_cache(f"product:{product_id}")
        return ProductResponse.model_validate(update_product)

    async def update_stock(self, db: AsyncSession, product_id: UUID, new_quantity: int) -> ProductResponse:
        product = await product_repository.get_product_by_id(db, product_id)
        if not product: raise NotFoundException("Product Not Found")
        update_product = await product_repository.update_stock(db, product, new_quantity)
        await delete_cache("products:all")
        await delete_cache(f"product:{product_id}")
        return ProductResponse.model_validate(update_product)

    async def update_product_price(self, db: AsyncSession, product_id: UUID, new_price: Decimal) -> ProductResponse:
        product = await product_repository.get_product_by_id(db, product_id)
        if not product: raise NotFoundException("Product Not Found")
        update_product = await product_repository.update_product_price(db, product, new_price)
        await delete_cache("products:all")
        await delete_cache(f"product:{product_id}")
        return ProductResponse.model_validate(update_product)

    async def delete_product(self, db: AsyncSession, product_id: UUID):
        product = await product_repository.get_product_by_id(db, product_id)
        if not product: raise NotFoundException("Product Not Found")
        await product_repository.delete_product(db, product)
        await delete_cache("products:all")
        await delete_cache(f"product:{product_id}")

product_service = ProductService()