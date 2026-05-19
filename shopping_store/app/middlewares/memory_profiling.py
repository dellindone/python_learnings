import tracemalloc
from starlette.middleware.base import BaseHTTPMiddleware

class MemoryProfilingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        snapshot_start = tracemalloc.take_snapshot()
        response = await call_next(request)
        snapshot_end = tracemalloc.take_snapshot()
        stats = snapshot_end.compare_to(snapshot_start, "lineno")
        for stat in stats[:3]:      
            print(stat)
        return response
    