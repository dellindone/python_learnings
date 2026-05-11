from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import Users

class UserRepository:

    async def get_user_by_id(self, user_id: str, db: AsyncSession):
        query = select(Users).where(Users.id == user_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def update_user(self, user: Users, data: dict, db: AsyncSession):
        for key, value in data.items(): setattr(user, key, value)
        await db.commit()
        await db.refresh(user)
        return user

user_repository = UserRepository()