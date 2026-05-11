from datetime import timedelta, datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import Users
from app.modules.auth.repository import auth_repository
from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token

class AuthService:

    async def _issue_tokens(self, db: AsyncSession, user: Users) -> tuple[str, str]:
        access_token = create_access_token(user_id=user.id, role=user.role)
        refresh_token = create_refresh_token(user_id=user.id)

        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await auth_repository.save_refresh_token(db, user_id=user.id, token=refresh_token, expires_at=expires_at)
        return access_token, refresh_token

    async def register(self, data: Users, db: AsyncSession) -> tuple[Users, str, str]:
        existing_user = await auth_repository.get_user_by_email(db, data.email)
        if existing_user:
            raise ConflictException("Email already registered")

        data.password = hash_password(data.password)
        new_user = await auth_repository.create_user(db, data)

        access_token, refresh_token = await self._issue_tokens(db, new_user)
        return access_token, refresh_token
    
    async def login(self, data: Users, db: AsyncSession) -> tuple[str, str]:
        user = await auth_repository.get_user_by_email(db, data.email)
        if not user or not verify_password(data.password, user.password):
            raise UnauthorizedException("Invalid email or password")

        access_token, refresh_token = await self._issue_tokens(db, user)
        return access_token, refresh_token

    async def refresh_token(self, refresh_token: str, db: AsyncSession) -> tuple[str, str]:
        stored_token = await auth_repository.get_refresh_token(db, refresh_token)
        if not stored_token:
            raise UnauthorizedException("Invalid refresh token")
        
        if stored_token.expires_at < datetime.utcnow():
            await auth_repository.delete_refresh_token(db, refresh_token)
            raise UnauthorizedException("Refresh token expired")
        
        user = await auth_repository.get_user_by_id(db, stored_token.user_id)
        if not user:
            raise UnauthorizedException("User not found")
        return await self._issue_tokens(db, user)

    async def logout(self, refresh_token: str, db: AsyncSession):
        await auth_repository.delete_refresh_token(db, refresh_token)

auth_service = AuthService()
