import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Cart(Base, TimestampMixin):
    __tablename__ = "carts"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, unique=True)
    items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")