import os, time, asyncio, httpx, pandas as pd
from python_learnings.asynchronous_programming.async_monitering_website.config import variables

from python_learnings.asynchronous_programming.async_monitering_website.storage import update_status_to_csv
from python_learnings.asynchronous_programming.async_monitering_website.checker import consume_queue
from python_learnings.asynchronous_programming.async_monitering_website.summary import print_summary

async def add_to_queue(queue, urls) -> None:
    for url in urls: await queue.put(url)
    print(f"Added {len(urls)} URLs to the queue.")

async def main() -> None:
    sem = asyncio.Semaphore(variables.max_concurrent_requests)
    results, queue = [], asyncio.Queue()
    
    data = await asyncio.to_thread(pd.read_csv, variables.csv_file_path)
    await add_to_queue(queue, data.get('url', []).to_list())
    for _ in range(variables.max_worker): await queue.put(variables.sentinal)  # Sentinel values to signal workers to exit

    async with httpx.AsyncClient(follow_redirects=True, headers=variables.headers) as client:
        async with asyncio.TaskGroup() as tg:
            for _ in range(variables.max_worker): tg.create_task(consume_queue(queue, client, results, sem))

    print_summary(results)
    await update_status_to_csv(results)

if __name__ == "__main__":
    start = time.perf_counter()
    asyncio.run(main())
    end = time.perf_counter()
    print(f"Execution time: {end - start:.2f} seconds")
