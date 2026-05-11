from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.categories import controller
from app.models.user import Users
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.schemas.category import CreateCategoryRequest, UpdateCategoryRequest

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/")
async def get_all_categories(
        _: Users = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    return await controller.get_all_categories(db)

@router.get("/search/")
async def get_category_by_name(
        category_name: str,
        _: Users = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    return await controller.get_category_by_name(db, category_name)

@router.get("/{category_id}")
async def get_category_by_id(
        category_id: UUID,
        _: Users = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    return await controller.get_category_by_id(db, category_id)


@router.post("/")
async def create_category(
    category_data: CreateCategoryRequest,
    _: Users = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    return await controller.create_category(db, category_data)

@router.patch("/{category_id}")
async def update_category(
    category_id: UUID,
    category_data: UpdateCategoryRequest,
    _: Users = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    return await controller.update_category(db, category_id, category_data)

@router.delete("/{category_id}")
async def delete_category(
    category_id: UUID,
    _: Users = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    return await controller.delete_category(db, category_id)
