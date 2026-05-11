from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from uuid import UUID
from datetime import datetime

class CreateProductRequest(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    stock_quantity: int
    sku: str
    category_id: UUID

class ProductResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    price: Decimal
    stock_quantity: int
    sku: str
    is_active: bool
    category_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes = True)

class UpdateProductRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    stock_quantity: int | None = None
    sku: str | None = None
    is_active: bool | None = None
    category_id: UUID | None = None