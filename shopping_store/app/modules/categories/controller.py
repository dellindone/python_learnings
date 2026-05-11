from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.response import success
from app.modules.categories.service import category_service
from app.core.exceptions import NotFoundException
from app.schemas.category import CreateCategoryRequest, UpdateCategoryRequest

async def get_category_by_id(db: AsyncSession, category_id: UUID) -> dict:
    data = await category_service.get_category_by_id(db, category_id)
    if not data: raise NotFoundException("Category not found by id..")
    return success(data=data.model_dump(), message="Category Fetched Successfully..")

async def get_category_by_name(db: AsyncSession, category_name: str) -> dict:
    data = await category_service.get_category_by_name(db, category_name)
    if not data: raise NotFoundException("Category not found by name..")
    return success(data=data.model_dump(), message="Category Fetched Successfully..")

async def get_all_categories(db: AsyncSession) -> dict:
    data = await category_service.get_all_categories(db)
    if not data: return success(data=[], message="No categories found")
    return success(data=[d.model_dump() for d in data], message="Category Fetched Successfully..")

async def create_category(db: AsyncSession, category_data: CreateCategoryRequest) -> dict:
    data = await category_service.create_category(db, category_data)
    return success(data=data.model_dump(), message="Category Created Successfully")

async def update_category(db: AsyncSession, category_id: UUID, category_data: UpdateCategoryRequest) -> dict:
    data = await category_service.update_category(db, category_id, category_data)
    return success(data=data.model_dump(), message="Category Updated Successfully")

async def delete_category(db: AsyncSession, category_id: UUID) -> dict:
    await category_service.delete_category(db, category_id)
    return success(data=None, message="Category Deleted Successfully")
