from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.schemas.cart_items import CartItemResponse

class CartResponse(BaseModel):
    id: UUID
    user_id: UUID
    items: list[CartItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)