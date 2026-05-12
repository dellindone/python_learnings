from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class OrderItemResponse(BaseModel):
    id: UUID
    order_id: UUID
    product_id: UUID
    product_name: str
    unit_price: Decimal
    quantity: int
    subtotal: Decimal
    updated_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

