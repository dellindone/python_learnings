from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.categories.repository import category_repository
from app.schemas.category import CreateCategoryRequest, UpdateCategoryRequest, CategoryResponse
from app.core.exceptions import ConflictException, NotFoundException

class CategoryService:

    async def get_category_by_id(self, db: AsyncSession, category_id: UUID) -> CategoryResponse:
        category = await category_repository.get_category_by_id(db, category_id)
        return CategoryResponse.model_validate(category) if category else None

    async def get_all_categories(self, db: AsyncSession) -> list[CategoryResponse]:
        categories = await category_repository.get_all_categories(db)
        return [CategoryResponse.model_validate(category) for category in categories]

    async def get_category_by_name(self, db: AsyncSession, category_name: str) -> CategoryResponse:
        category = await category_repository.get_category_by_name(db, category_name)
        return CategoryResponse.model_validate(category) if category else None

    async def create_category(self, db: AsyncSession, category_data: CreateCategoryRequest) -> CategoryResponse:
        existing_category = await category_repository.get_category_by_name(db, category_data.name)
        if existing_category: raise ConflictException("Category already exists")
        new_category = await category_repository.create_category(db, category_data)
        return CategoryResponse.model_validate(new_category)

    async def update_category(self, db: AsyncSession, category_id: UUID, update_category_data: UpdateCategoryRequest) -> CategoryResponse:
        existing_category = await category_repository.get_category_by_id(db, category_id)
        if not existing_category: raise NotFoundException("Category Not Found")
        updated_category = await category_repository.update_category(db, existing_category, update_category_data)
        return CategoryResponse.model_validate(updated_category)

    async def delete_category(self, db: AsyncSession, category_id: UUID):
        existing_category = await category_repository.get_category_by_id(db, category_id)
        if not existing_category:
            raise NotFoundException("Category not found to delete")
        await category_repository.delete_category(db, existing_category)

category_service = CategoryService()
