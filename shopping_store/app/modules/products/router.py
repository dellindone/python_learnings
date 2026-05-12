from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.products import controller
from app.models.user import Users
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.schemas.product import CreateProductRequest, UpdateProductRequest

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/")
async def get_all_products(
        _: Users = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    return await controller.get_all_products(db)

@router.get("/search")
async def get_product_by_name(
    product_name: str,
    _: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await controller.get_product_by_name(db, product_name)

@router.get("/category/{category_id}")
async def get_products_by_category_id(
        category_id: UUID,
        _: Users = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    return await controller.get_products_by_category_id(db, category_id)

@router.get("/{product_id}")
async def get_product_by_id(
    product_id: UUID,
    _: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await controller.get_product_by_id(db, product_id)

@router.post("/")
async def create_product(
    product_data: CreateProductRequest,
    _: Users = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    return await controller.create_product(db, product_data)

@router.patch("/{product_id}")
async def update_product(
    product_id: UUID,
    product_data: UpdateProductRequest,
    _: Users = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    return await controller.update_product(db, product_id, product_data)

@router.patch("/{product_id}/stock")
async def update_stock(
    product_id: UUID,
    new_quantity: int,
    _: Users = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    return await controller.update_stock(db, product_id, new_quantity)

@router.patch("/{product_id}/price")
async def update_product_price(
    product_id: UUID,
    new_price: Decimal,
    _: Users = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    return await controller.update_product_price(db, product_id, new_price)

@router.delete("/{product_id}")
async def delete_product(
    product_id: UUID,
    _: Users = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    return await controller.delete_product(db, product_id)
