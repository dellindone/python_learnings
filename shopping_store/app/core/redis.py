import redis.asyncio as aioredis

redis_client = aioredis.Redis(
    host="localhost",
    port=6379,
    decode_responses=True
)
