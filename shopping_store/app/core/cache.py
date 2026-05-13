import json
from app.core.redis import redis_client

async def get_cache(key: str):
    value = await redis_client.get(key)
    if value is None: return None
    return json.loads(value)

async def set_cache(key: str, data: any, ttl: int):
    json_str = json.dumps(data)
    await redis_client.setex(key, ttl, json_str)

async def delete_cache(key: str):
    await redis_client.delete(key)
