from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

class UpdateUserRequest(BaseModel):
    name: str | None = None
    phone: str | None = None