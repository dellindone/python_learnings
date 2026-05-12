from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.schemas.order_item import OrderItemResponse

class OrderResponse(BaseModel):
    id: UUID
    user_id: UUID
    status: str
    total_amount: Decimal
    items: list[OrderItemResponse]
    updated_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)