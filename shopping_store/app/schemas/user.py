from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator

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
    email: EmailStr | None = None
    password: str | None = None

    @field_validator("password")
    def validate_password(cls, value):
        if value is not None and len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return value
