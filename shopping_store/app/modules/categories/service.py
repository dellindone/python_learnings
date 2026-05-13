from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.categories.repository import category_repository
from app.schemas.category import CreateCategoryRequest, UpdateCategoryRequest, CategoryResponse
from app.core.exceptions import ConflictException, NotFoundException
from app.core.cache import get_cache, set_cache, delete_cache
class CategoryService:

    async def get_category_by_id(self, db: AsyncSession, category_id: UUID) -> CategoryResponse:
        cache_key = f"category:{category_id}"
        cache_data = await get_cache(cache_key)
        if cache_data: return cache_data
        category = await category_repository.get_category_by_id(db, category_id)
        if not category: return None
        serialized = CategoryResponse.model_validate(category).model_dump(mode="json")
        await set_cache(cache_key, serialized, 3600)
        return serialized

    async def get_all_categories(self, db: AsyncSession) -> list[CategoryResponse]:
        cache_key = "categories:all"
        cache_data = await get_cache(cache_key)
        if cache_data: return cache_data
        categories = await category_repository.get_all_categories(db)
        serialized = [CategoryResponse.model_validate(category).model_dump(mode="json") for category in categories]
        await set_cache(cache_key, serialized, 3600)
        return serialized

    async def get_category_by_name(self, db: AsyncSession, category_name: str) -> CategoryResponse:
        category = await category_repository.get_category_by_name(db, category_name)
        return CategoryResponse.model_validate(category) if category else None

    async def create_category(self, db: AsyncSession, category_data: CreateCategoryRequest) -> CategoryResponse:
        existing_category = await category_repository.get_category_by_name(db, category_data.name)
        if existing_category: raise ConflictException("Category already exists")
        new_category = await category_repository.create_category(db, category_data)
        await delete_cache("categories:all")
        return CategoryResponse.model_validate(new_category)

    async def update_category(self, db: AsyncSession, category_id: UUID, update_category_data: UpdateCategoryRequest) -> CategoryResponse:
        existing_category = await category_repository.get_category_by_id(db, category_id)
        if not existing_category: raise NotFoundException("Category Not Found")
        updated_category = await category_repository.update_category(db, existing_category, update_category_data)
        await delete_cache("categories:all")
        await delete_cache(f"category:{category_id}")
        return CategoryResponse.model_validate(updated_category)

    async def delete_category(self, db: AsyncSession, category_id: UUID):
        existing_category = await category_repository.get_category_by_id(db, category_id)
        if not existing_category:
            raise NotFoundException("Category not found to delete")
        await delete_cache("categories:all")
        await delete_cache(f"category:{category_id}")
        await category_repository.delete_category(db, existing_category)

category_service = CategoryService()
