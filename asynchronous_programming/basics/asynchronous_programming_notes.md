# Asynchronous Programming in Python (`asyncio`) - Notes

## Source Repository

- Tutorial code repository:
  [CoreyMSchafer/AsyncIO-Code-Examples](https://github.com/CoreyMSchafer/AsyncIO-Code-Examples)

### Repo file map

- `terms.py`:
  terminology demo for synchronous functions, coroutines, tasks, and futures
- `example_1.py`:
  fully synchronous baseline example
- `example_2.py`:
  incorrect first async attempt that awaits coroutines directly and gets no concurrency benefit
- `example_3.py`:
  correct concurrent version using `asyncio.create_task()`
- `example_4.py`:
  shows that `await task_x` does not mean that task must run first
- `example_5.py`:
  blocking the event loop with synchronous code like `time.sleep()`
- `example_6.py`:
  using threads and processes with `asyncio`
- `example_7.py`:
  `gather()` and `TaskGroup` patterns
- `real_world_example_sync_v1.py`:
  original synchronous image download + image processing script
- `real_world_example_async_v1.py`:
  first async improvement using threads for blocking work
- `real_world_example_async_v2.py`:
  improved async version using async-compatible libraries for downloads
- `real_world_example_async_v3.py`:
  more optimized version with concurrency limits and process-based CPU work

## Big Picture

- `asyncio` is Python's built-in library for writing concurrent code using `async` / `await`.
- It is best for **I/O-bound** work:
  - network requests
  - database queries
  - file operations
  - anything that spends time waiting on external systems
- `asyncio` is **not automatically faster**.
- It helps because the program can do other useful work while one task is waiting.

## Core Idea: Concurrency vs Synchronous Execution

### Synchronous code

- One thing happens after another.
- If one operation waits, everything else waits too.

### Concurrent code

- Multiple tasks can make progress over time.
- While one task is waiting, another task can run.

## Important Rule

- `asyncio` is **single-threaded** and runs in a **single process** by default.
- It uses **cooperative multitasking**:
  - tasks voluntarily give up control
  - they do this at `await` points

## Event Loop

- The **event loop** is the engine that runs async code.
- It:
  - starts tasks
  - pauses them when they `await`
  - resumes them when they are ready again
  - shuts down when work is complete

### Modern way to start it

```python
asyncio.run(main())
```

- `asyncio.run()`:
  - creates the event loop
  - runs the async entry function
  - closes the loop when done

## `async` and `await`

### `async def`

- Defines an asynchronous function, also called a **coroutine function**.

### Calling an async function

- Calling it does **not** run it immediately.
- It creates a **coroutine object**.

### `await`

- `await` pauses the current coroutine.
- Control returns to the event loop.
- The event loop can then run something else.

### Key restriction

- You can only use `await` inside an `async def` function.

## Awaitables

Objects you can `await` are called **awaitables**.

The 3 main kinds are:

1. **Coroutines**
2. **Tasks**
3. **Futures**

### 1. Coroutines

- Created when you call an `async def` function.
- Example:

```python
async def fetch():
    await asyncio.sleep(1)
    return "done"

coro = fetch()   # coroutine object
result = await coro
```

### 2. Tasks

- A **task** wraps a coroutine and schedules it on the event loop.
- Tasks are how coroutines actually run concurrently.

```python
task = asyncio.create_task(fetch())
result = await task
```

### 3. Futures

- Low-level objects representing a result that will be available later.
- Similar to JavaScript promises.
- Usually used internally by `asyncio`, not directly in normal application code.

## Very Important Distinction

### Calling a coroutine directly

```python
coro = fetch_data(1)
result = await coro
```

- This does **not** create concurrency by itself.
- It schedules and runs that coroutine when awaited.
- If you do this one by one, tasks run sequentially.

### Scheduling tasks first

```python
task1 = asyncio.create_task(fetch_data(1))
task2 = asyncio.create_task(fetch_data(2))

result1 = await task1
result2 = await task2
```

- This creates real concurrency.
- Both tasks are scheduled before either fully finishes.
- Total runtime becomes close to the longest task, not the sum of all tasks.

## Why `await` Does Not Mean “Run This First”

- `await task2` does **not** mean task 2 must run before task 1.
- It means:
  - "do not continue past this point until task 2 is done"
- The event loop still decides which ready task runs next.

## Why Blocking Code Breaks Async

### Bad example

```python
async def fetch():
    time.sleep(2)
```

- `time.sleep()` blocks the event loop.
- It does not yield control.
- While it runs, no other async task can make progress.

### Good example

```python
async def fetch():
    await asyncio.sleep(2)
```

- `asyncio.sleep()` yields control properly.

## Rule of Thumb

- Do **not** put blocking synchronous code directly inside async code unless you intentionally offload it.

Examples of blocking sync code:

- `time.sleep()`
- `requests.get()`
- heavy CPU work

## When to Use Async vs Threads vs Processes

### Use `asyncio` when

- the work is I/O-bound
- and you have async-compatible libraries available

Examples:

- `httpx`
- `aiohttp`
- async database drivers
- `aiofiles`

### Use threads when

- the work is I/O-bound
- but only synchronous/blocking libraries are available

Example:

- wrapping `requests.get()` with `asyncio.to_thread()`

### Use processes when

- the work is CPU-bound
- the code does heavy computation

Example:

- image processing
- large calculations
- data transformations

## Running Blocking Code with Threads

If a library is sync-only, use:

```python
task = asyncio.create_task(asyncio.to_thread(sync_function, arg1, arg2))
```

- This runs the blocking function in a separate thread.
- The event loop stays responsive.

## Running CPU Work with Processes

Use a process pool for CPU-heavy work:

```python
from concurrent.futures import ProcessPoolExecutor

loop = asyncio.get_running_loop()

with ProcessPoolExecutor() as pool:
    task = loop.run_in_executor(pool, cpu_bound_function, arg)
    result = await task
```

- Processes avoid the limitations of threads for CPU-heavy code.

## Real-World Conversion Strategy

The tutorial walks through converting a script that:

1. downloads images
2. processes images

### Original synchronous timing

- Total: about 23 seconds
- Downloads: about 13 seconds
- Processing: about 10 seconds

### Step 1: Profile first

Use a profiler like **Scalene** to identify:

- which parts are I/O-bound
- which parts are CPU-bound

Interpretation:

- lots of **system time** often points to waiting on I/O
- lots of **Python time** often points to CPU work

### Step 2: Improve downloads

- Downloads were I/O-bound.
- First improvement: use threads with `asyncio.to_thread()` around sync `requests`.
- Better improvement: switch to async libraries like:
  - `httpx` for HTTP
  - `aiofiles` for file writes

### Step 3: Improve processing

- Image processing was CPU-bound.
- Threads did not help much.
- Processes gave a large speedup.

### Final improved timing

- Total: about 5 seconds
- Downloads: about 1.66 seconds
- Processing: about 3.25 seconds

## Helpful Async Tools

### `asyncio.gather()`

Runs multiple awaitables together.

```python
results = await asyncio.gather(*coroutines)
```

Use when:

- you want all results collected together

Important note:

- `gather()` accepts separate awaitables, so `*list_of_coroutines` is often used to unpack a list.

### `TaskGroup`

Modern structured concurrency tool.

```python
async with asyncio.TaskGroup() as tg:
    tasks = [tg.create_task(fetch_data(i)) for i in range(1, 3)]
```

- The task group waits for all tasks automatically when the context exits.
- Often cleaner and safer than manual task management.

## `gather()` vs `TaskGroup`

### Use `gather(..., return_exceptions=True)` when

- you want all tasks to continue even if some fail
- you want results and exceptions collected together

Good example:

- crawling many URLs where one bad URL should not stop the rest

### Use `TaskGroup` when

- tasks should succeed or fail as a unit
- if one fails, the rest should be cancelled
- you want better cleanup and structured error handling

### Recommendation from the tutorial

- Prefer `TaskGroup` for fail-together behavior.
- If using `gather()`, prefer `return_exceptions=True`.
- Avoid relying on the default `gather(return_exceptions=False)` in most cases.

## Async Context Managers

Example:

```python
async with httpx.AsyncClient() as client:
    ...
```

- Used when setup and teardown may involve async I/O.
- Common with:
  - HTTP clients
  - database connections
  - file handling
  - task groups

## Async Iteration

Example:

```python
async for chunk in response.aiter_bytes():
    await f.write(chunk)
```

- Use `async for` when each next item may require waiting.
- Common in streaming network or file operations.

## Limiting Concurrency

Running too many tasks at once can:

- overload your machine
- hammer external servers

### Use a semaphore

```python
semaphore = asyncio.Semaphore(4)

async with semaphore:
    ...
```

- Limits how many operations run concurrently.

### Limit process workers

```python
max_workers = os.cpu_count()
ProcessPoolExecutor(max_workers=max_workers)
```

- Good for CPU-bound workloads.

## Common Mistakes

### 1. Forgetting to `await`

- If you create tasks/coroutines and never await them, they may never finish.
- The script can exit before work is done.

### 2. Assuming calling an async function starts concurrency

- It only creates a coroutine object.
- You still need to schedule or await it properly.

### 3. Using blocking sync code inside async code

- This blocks the event loop.
- You lose concurrency.

### 4. Ending the script before tasks finish

- The event loop can shut down early.
- Some tasks may get cancelled.

## Debugging Tips

### Use a linter

- A good linter can catch many async mistakes.

### Enable asyncio debug mode during development

```python
asyncio.run(main(), debug=True)
```

- Helps catch issues in async code.
- Use in development, not typically in production.

## Mental Model to Remember

- `async def` defines a coroutine function.
- Calling it creates a coroutine object.
- `await` pauses the current coroutine and gives control back to the event loop.
- `asyncio.create_task()` schedules work so multiple tasks can overlap.
- `asyncio` helps with **waiting-heavy** work.
- Threads help when the work is I/O-bound but sync-only.
- Processes help when the work is CPU-heavy.

## Short Summary

- Use `asyncio` for I/O-bound concurrency.
- Use async-compatible libraries whenever possible.
- Use threads for blocking I/O without async alternatives.
- Use processes for CPU-bound work.
- Do not block the event loop with sync calls like `time.sleep()` or `requests.get()`.
- Schedule tasks before awaiting if you want concurrency.
- Use `TaskGroup` or `gather()` to manage multiple tasks cleanly.
- Profile first when deciding what to optimize.

## Exam / Interview Style Quick Answers

### What is `asyncio`?

- Python's built-in library for writing concurrent I/O-bound code using `async` and `await`.

### What does `await` do?

- It pauses the current coroutine and gives control back to the event loop.

### What is the event loop?

- The scheduler/engine that runs, pauses, and resumes async tasks.

### What is a coroutine?

- An async function and the awaitable object created when it is called.

### What is a task?

- A scheduled wrapper around a coroutine that the event loop can run concurrently.

### Why is `time.sleep()` bad in async code?

- It blocks the event loop and prevents other tasks from running.

### When should you use threads?

- For I/O-bound blocking code when no async library exists.

### When should you use processes?

- For CPU-bound heavy computation.
