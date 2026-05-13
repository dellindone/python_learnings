import time 
from fastapi import Request, Depends
from app.core.redis import redis_client
from app.core.exceptions import RateLimitException
from app.core.dependencies import get_current_user
from app.models.user import Users

window = 60

async def rate_limit_fixed_window(limit: int, window: int, identifier: str):
    key = f"rate_limit:{identifier}"
    count = await redis_client.incr(key)
    if count == 1: await redis_client.expire(key, window)
    if count > limit: raise RateLimitException()

async def rate_limit(limit: int, window: int, indentifier: str):
    now = time.time()
    current_window_start = int(now // window) * window
    previous_window_start = current_window_start - window

    current_key = f"rate_limit:{indentifier}:{current_window_start}"
    current_count = int(await redis_client.get(current_key) or 0)

    previous_key = f"rate_limit:{indentifier}:{previous_window_start}"
    previous_count = int(await redis_client.get(previous_key) or 0)
    
    time_elapsed = now - current_window_start
    overlap_ratio = (window - time_elapsed) / window
    await redis_client.incr(current_key)
    await redis_client.expire(current_key, window * 2)
    weighted_count = (previous_count * overlap_ratio) + current_count
    if weighted_count > limit: raise RateLimitException()

async def register_rate_limit(request: Request):
    await rate_limit(3, window, request.client.host)

async def login_rate_limit(request: Request):
    await rate_limit(5, window, request.client.host)

async def products_rate_limiter(current_user: Users = Depends(get_current_user)):
    await rate_limit(60, window, str(current_user.id))

async def orders_rate_limiter(current_user: Users = Depends(get_current_user)):
    await rate_limit(3, window, str(current_user.id))
