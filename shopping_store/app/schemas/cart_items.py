from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class CartItemResponse(BaseModel):
    id: UUID
    cart_id: UUID
    product_id: UUID
    quantity: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AddToCartRequest(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0, description="Quantity must be greater than 0")

class UpdateCartItemRequest(BaseModel):
    quantity: Optional[int] = None
