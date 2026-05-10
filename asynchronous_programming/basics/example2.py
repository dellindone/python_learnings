import asyncio


async def fetch_data(param):
    print(f"Do something with {param}...")
    await asyncio.sleep(param)
    print(f"Done with {param}")
    return f"Result of {param}"

async def main():
    result1 = await fetch_data(1)
    print("Fetch 1 fully completed")
    result2 = await fetch_data(2)
    print("Fetch 2 fully completed")
    return [result1, result2]


results = asyncio.run(main())
print(results)