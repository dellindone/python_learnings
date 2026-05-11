from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.repository import user_repository
from app.schemas.user import UpdateUserRequest

from app.core.exceptions import NotFoundException

class UserService:

    async def update_current_user(self, user_id: str, data: UpdateUserRequest, db: AsyncSession):
        user = await user_repository.get_user_by_id(user_id, db)
        if not user: raise NotFoundException("User not found")
        return await user_repository.update_user(user, data.model_dump(exclude_unset=True), db)

user_service = UserService()