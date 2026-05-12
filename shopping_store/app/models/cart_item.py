import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class CartItem(Base, TimestampMixin):
    __tablename__ = "cart_items"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cart_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("carts.id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False, default=1)

    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
