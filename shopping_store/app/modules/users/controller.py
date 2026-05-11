from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.response import success
from app.modules.users.service import user_service
from app.schemas.user import UpdateUserRequest, UserProfileResponse
from app.models.user import Users

async def get_current_user(user: Users) -> dict:
    return success(
        data=UserProfileResponse.model_validate(user).model_dump(),
        message = "Current user details"
    )

async def update_current_user(user_id: str, data: UpdateUserRequest, db: AsyncSession):
    user_updated_data = await user_service.update_current_user(user_id, data, db)
    return success(
        data=user_updated_data,
        message = "Current user updated"
    )