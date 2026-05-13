from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.repository import user_repository
from app.schemas.user import UpdateUserRequest
from app.core.security import hash_password
from app.core.exceptions import NotFoundException

class UserService:

    async def update_current_user(self, user_id: str, data: UpdateUserRequest, db: AsyncSession):
        user = await user_repository.get_user_by_id(user_id, db)
        if not user: raise NotFoundException("User not found")
        update_data = data.model_dump(exclude_unset=True)
        if update_data.get("password"):
            update_data["password"] = hash_password(update_data["password"])
        return await user_repository.update_user(user, update_data, db)

user_service = UserService()
