import time, asyncio

async def fetch_data(param):
    print(f"Do something with {param}...")
    await asyncio.sleep(param)
    print(f"Done with {param}")
    return f"Result of {param}"

async def main():
    task1 = asyncio.create_task(fetch_data(5))
    task2 = asyncio.create_task(fetch_data(1))
    print("Both fetches started, waiting for results...")
    # result1 = await task1
    # print("Fetch 1 fully completed")
    # result2 = await task2
    # print("Fetch 2 fully completed")
    results = await asyncio.gather(task1, task2)
    # return [result1, result2]
    return results

t1 = time.perf_counter()
results = asyncio.run(main())
t2 = time.perf_counter()
print(results)
print(f"Execution time: {t2 - t1:.2f} seconds")