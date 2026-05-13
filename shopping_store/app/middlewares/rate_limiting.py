from fastapi import Request, Depends
from app.core.redis import redis_client
from app.core.exceptions import RateLimitException
from app.core.dependencies import get_current_user
from app.models.user import Users

window = 60

async def rate_limit(limit: int, window: int, identifier: str):
    key = f"rate_limit:{identifier}"
    count = await redis_client.incr(key)
    if count == 1: await redis_client.expire(key, window)
    if count > limit: raise RateLimitException()


async def register_rate_limit(request: Request):
    await rate_limit(3, window, request.client.host)

async def login_rate_limit(request: Request):
    await rate_limit(5, window, request.client.host)

async def products_rate_limiter(current_user: Users = Depends(get_current_user)):
    await rate_limit(60, window, str(current_user.id))

async def orders_rate_limiter(current_user: Users = Depends(get_current_user)):
    await rate_limit(3, window, str(current_user.id))
