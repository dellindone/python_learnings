import os, time, asyncio, httpx, pandas as pd
from python_learnings.asynchronous_programming.async_monitering_website.config import variables
from datetime import datetime
from python_learnings.asynchronous_programming.async_monitering_website.models import WebsiteResult

async def fetch_website(url, client) -> WebsiteResult:
    start = time.perf_counter()
    try:
        response = await client.get(url, timeout=3)
        response_time = time.perf_counter() - start
        
        code = response.status_code
        if 200 <= code < 400: status = "SLOW" if response_time > 2 else "UP"
        elif code in [400, 401, 403]: status = "BLOCKED"
        elif code == 429: status = "RATE_LIMITED"
        elif code >= 500: status = "DOWN"
        else: status = "ERROR"

        return WebsiteResult(
            url=url,
            status=status,
            status_code=code,
            response_time=round(response_time, 2),
            error=response.reason_phrase if code >= 400 else None,
            checked_at=datetime.now().isoformat(timespec="seconds")
        )
    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
        return WebsiteResult(
            url=url,
            status="DOWN",
            error=str(exc),
            checked_at=datetime.now().isoformat(timespec="seconds")
        )

async def fetch_with_retry(url, client, retries=3) -> WebsiteResult:
    last_result = None
    for _ in range(retries):
        results = await fetch_website(url, client)
        last_result = results
        if results.status in ["UP", "SLOW"]: return results
        await asyncio.sleep(1)
    return last_result  # Return the last attempt's result after retries

async def consume_queue(queue, client, results, sem) -> None:
    while True:
        url = await queue.get()
        try:
            if url is variables.sentinal: return
            async with sem:
                result = await fetch_with_retry(url, client)
            results.append(result)
        finally: queue.task_done()
        