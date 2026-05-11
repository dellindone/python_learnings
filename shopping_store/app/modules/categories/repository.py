from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.models.category import Category
from app.schemas.category import CreateCategoryRequest, UpdateCategoryRequest

class CategoryRepository:
    async def get_category_by_id(self, db: AsyncSession, category_id: UUID):
        query = select(Category).where(Category.id == category_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all_categories(self, db: AsyncSession):
        query = select(Category).where(Category.is_active == True)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_category_by_name(self, db: AsyncSession, name: str):
        query = select(Category).where(Category.name == name)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def create_category(self, db: AsyncSession, category_data: CreateCategoryRequest) -> Category:
        new_category = Category(**category_data.model_dump(exclude_unset=True))
        db.add(new_category)
        await db.commit()
        await db.refresh(new_category)
        return new_category
    
    async def update_category(self, db: AsyncSession, category: Category, update_data: UpdateCategoryRequest) -> Category:
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(category, field, value)
        await db.commit()
        await db.refresh(category)
        return category
    
    async def delete_category(self, db: AsyncSession, category: Category):
        await db.delete(category)
        await db.commit()
