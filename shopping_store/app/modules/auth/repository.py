from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import Users
from app.models.refresh_token import RefreshToken
from app.core.security import hash_token

class AuthRepository:
    async def get_user_by_email(self, db: AsyncSession, email: str) -> Users:
        query = select(Users).where(Users.email == email)
        user = await db.execute(query)
        return user.scalar_one_or_none()
    
    async def get_user_by_id(self, db: AsyncSession, user_id: str) -> Users:
        query = select(Users).where(Users.id == user_id)
        user = await db.execute(query)
        return user.scalar_one_or_none()
    
    async def create_user(self, db: AsyncSession, user: Users) -> Users:
        new_user = Users(**user.model_dump())
        db.add(new_user)
        await db.flush()
        await db.refresh(new_user)
        return new_user
    
    async def get_refresh_token(self, db: AsyncSession, token: str) -> RefreshToken | None:
        query = select(RefreshToken).where(RefreshToken.token == hash_token(token))
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def save_refresh_token(self, db: AsyncSession, user_id: str, token: str, expires_at: datetime) -> RefreshToken:
        new_token = RefreshToken(user_id=user_id, token=hash_token(token), expires_at=expires_at)
        db.add(new_token)
        await db.commit()
        await db.refresh(new_token)
        return new_token
    
    async def delete_refresh_token(self, db: AsyncSession, token: str):
        query = select(RefreshToken).where(RefreshToken.token == hash_token(token))
        result = await db.execute(query)
        refresh_token = result.scalar_one_or_none()
        if refresh_token:
            await db.delete(refresh_token)
            await db.commit()

auth_repository = AuthRepository()
