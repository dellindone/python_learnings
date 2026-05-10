import asyncio
import time

def sync_function():
    print("Starting synchronous function")
    time.sleep(2)
    print("Finished synchronous function")

# Also known as a coroutine, this function can be paused and resumed, allowing other tasks to run concurrently.
async def async_function1():
    print("Starting asynchronous function1")
    await asyncio.sleep(1)
    print("Finished asynchronous function1")

async def async_function():
    print("Starting asynchronous function")
    await asyncio.sleep(2)
    print("Finished asynchronous function")

async def main():
    # sync_function()

    t1 = asyncio.create_task(async_function())  # This will start the coroutine but not wait for it to finish.
    t2 = asyncio.create_task(async_function1())  # This will start the second coroutine but not wait for it to finish.

    await t1  # This will wait for the first coroutine to finish.
    await t2  # This will wait for the second coroutine to finish.
    
    # await async_function()  # This will execute the coroutine and wait for it to finish.
    # await async_function1()  # This will execute the second coroutine and wait for it to finish.

if __name__ == "__main__":
    asyncio.run(main())