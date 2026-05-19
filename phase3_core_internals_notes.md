# Phase 3 — Core Internals Notes

---

## 3.1 Closures & LEGB Rule

### Prerequisites
- Functions basics

### LEGB Rule

Python variable dhundhne ka order:

```
L — Local       (function ke andar)
E — Enclosing   (outer function mein)
G — Global      (module level)
B — Built-in    (Python built-ins — len, print etc)
```

Pehle Local mein dhundha → nahi mila → Enclosing → nahi mila → Global → nahi mila → Built-in

---

### Closure Kya Hai?

Inner function + Captured variables from enclosing scope = Closure

```python
def outer():
    message = "Hello"

    def inner():
        print(message)  # enclosing scope se capture kiya

    return inner

func = outer()
func()  # outer() khatam ho gayi — lekin message abhi bhi accessible!
```

`__closure__` mein captured variables store hote hain:
```python
print(func.__closure__[0].cell_contents)  # "Hello"
```

---

### `nonlocal` keyword

Enclosing scope ka variable modify karne ke liye:

```python
def make_counter():
    count = 0

    def counter():
        nonlocal count   # enclosing variable modify karo
        count += 1
        return count

    return counter

c1 = make_counter()
c2 = make_counter()
c1()  # 1
c1()  # 2
c2()  # 1 — alag closure, alag count
```

---

### Advantages
- State maintain karo bina class ke
- Factory functions banane mein useful

### Disadvantages
- Memory leak ho sakta hai — captured variables GC collect nahi karta jab tak closure zinda hai

### Real World Use Case
- Decorators internally Closures use karte hain
- Factory functions — `make_counter`, `make_multiplier`

### Interview Questions
1. LEGB Rule kya hai?
2. Closure kya hota hai?
3. `nonlocal` aur `global` mein kya fark hai?
4. Closure aur Class mein kab kya prefer karoge?

---

## 3.2 Decorators

### Prerequisites
- Closures, `*args/**kwargs`

### Concept

Function ko wrap karo — extra behavior add karo bina original code change kiye.

```python
@timer
def calculate(n):
    return sum(range(n))

# Yeh actually yeh hai:
calculate = timer(calculate)
```

---

### Basic Decorator

```python
import functools

def timer(func):
    @functools.wraps(func)   # original identity preserve karo
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end-start:.4f}s")
        return result
    return wrapper

@timer
def calculate(n):
    """Calculates sum"""
    return sum(range(n))
```

---

### Async Decorator

```python
def async_timer(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)  # await zaroori hai
        end = time.time()
        print(f"{func.__name__} took {end-start:.4f}s")
        return result
    return wrapper
```

---

### `@functools.wraps` Kyun Zaroori Hai?

Bina `@functools.wraps`:
```python
calculate.__name__  # "wrapper" — galat!
calculate.__doc__   # None — galat!
```

`@functools.wraps` ke baad:
```python
calculate.__name__  # "calculate" — sahi!
calculate.__doc__   # "Calculates sum" — sahi!
```

**Rule: Har decorator mein `@functools.wraps` use karo.**

---

### Real World Use Case — Shopping Store

```python
@router.get("/")           # routing decorator
@Depends(get_current_user) # auth decorator
@products_rate_limiter     # rate limiting decorator
async def get_all_products():
    ...
```

---

### Advantages
- Code reuse — ek baar likho, kahin bhi lagao
- Separation of concerns — business logic aur cross-cutting concerns alag

### Disadvantages
- Debugging mushkil — stack trace mein wrapper dikhta hai
- Bina `@functools.wraps` ke identity kho jaati hai

### Anti-patterns
- Zyada decorators stack karna — order confusing ho jaata hai

### Interview Questions
1. Decorator kya hota hai?
2. `@timer` aur `calculate = timer(calculate)` mein kya fark hai?
3. `@functools.wraps` kyun zaroori hai?
4. Async decorator normal decorator se kaise alag hai?

---

## 3.3 Context Managers

### Prerequisites
- Classes & Objects, Exception Handling

### Concept

Resource automatically manage karo — exception aaye ya na aaye.

```python
# Bina context manager:
f = open("file.txt")
f.write("hello")
# exception aaya → file kabhi close nahi hogi!
f.close()

# Context manager se:
with open("file.txt") as f:
    f.write("hello")
# automatically close — hamesha
```

---

### `__enter__` aur `__exit__`

`with` block 2 methods call karta hai:

```python
class DatabaseConnection:
    def __enter__(self):
        print("Connection open")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print("Connection closed")
        return False  # True = exception suppress, False = propagate
```

| Parameter | Matlab |
|---|---|
| `exc_type` | Exception ka type |
| `exc_val` | Exception ka message |
| `exc_tb` | Traceback |
| `return False` | Exception propagate hone do |
| `return True` | Exception suppress karo |

---

### `@contextmanager` — Shortcut

Class banane ki zaroorat nahi:

```python
from contextlib import contextmanager

@contextmanager
def database_connection():
    print("Connection open")
    try:
        yield        # yahan with block execute hota hai
    finally:
        print("Connection closed")  # hamesha close hoga
```

```
yield se pehle → __enter__ jaisa
yield ke baad  → __exit__ jaisa
finally        → exception aaye tab bhi
```

---

### Real World Use Case — Shopping Store

```python
@asynccontextmanager
async def lifespan(app):
    tracemalloc.start()   # startup
    yield
    # shutdown
```

`@asynccontextmanager` = async version of `@contextmanager`

---

### Advantages
- Resource leak nahi hota — hamesha cleanup hota hai
- Clean code — try/finally ki zaroorat nahi

### Disadvantages
- Complex cleanup logic mein class better hai

### Anti-patterns
- Context manager ke andar heavy computation — block hold ho jaata hai

### Interview Questions
1. Context Manager kya hota hai?
2. `__enter__` aur `__exit__` kab call hote hain?
3. `return True` aur `return False` mein kya fark hai?
4. `@contextmanager` aur class-based context manager mein kya fark hai?

---

## 3.4 `*args` aur `**kwargs`

### Prerequisites
- Functions basics

### Concept

```python
def func(*args, **kwargs):
    print(args)    # tuple — positional arguments
    print(kwargs)  # dict  — keyword arguments

func(1, 2, 3, name="Aditya", age=25)
# (1, 2, 3)
# {'name': 'Aditya', 'age': 25}
```

---

### Unpacking

```python
# ** dict ko keyword arguments mein convert karta hai
data = {"name": "Laptop", "price": 50000}
Product(**data)  # same as Product(name="Laptop", price=50000)

# * list ko positional arguments mein convert karta hai
args = [1, 2, 3]
print(*args)     # same as print(1, 2, 3)
```

---

### Real World Use Case — Shopping Store

```python
# Pydantic object → dict → unpack → SQLAlchemy model
Product(**product_data.model_dump())

# Decorator mein — koi bhi arguments accept karo
def timer(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

---

## 3.5 Exception Handling Internals

### Prerequisites
- Python basics

### Key Rules

**1. Child exception pehle, parent baad mein:**
```python
try:
    raise NotFoundException("Not found")
except NotFoundException as e:   # child pehle ✅
    print("NotFoundException")
except AppException as e:         # parent baad ✅
    print("AppException")
```

**2. `finally` hamesha chalta hai:**
```python
try:
    raise Exception("error")
except Exception as e:
    print("caught")
finally:
    print("hamesha!")  # exception aaye ya na aaye
```

**3. Exception Chaining — `from e`:**
```python
try:
    await db.execute(query)
except SQLAlchemyError as e:
    raise AppException("DB operation failed") from e
# "The above exception was the direct cause of the following exception"
```

Root cause preserve hota hai — debugging aasan hoti hai.

---

### Interview Questions
1. `except` block mein order kyun matter karta hai?
2. `finally` kab use karte hain?
3. Exception Chaining kya hai aur kyun useful hai?
4. Custom exception kaise banate hain?

---

## 3.6 `functools` — `lru_cache` aur `partial`

### Prerequisites
- Decorators, Closures

### `lru_cache` — Memoization

Expensive function ka result cache karo — same input pe dobara calculate mat karo:

```python
import functools

@functools.lru_cache(maxsize=128)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

fibonacci(50)
print(fibonacci.cache_info())
# CacheInfo(hits=48, misses=51, maxsize=128, currsize=51)
```

| Stat | Matlab |
|---|---|
| `hits` | Cached result use hua — calculate nahi kiya |
| `misses` | Pehli baar calculate kiya |
| `maxsize` | Max kitne results store honge |
| `currsize` | Abhi kitne cached hain |

Bina cache: fibonacci(50) → 2^50 operations
Cache ke saath: sirf 51 calculations!

---

### `partial` — Pre-filled Arguments

Function ka specialized version banao — kuch arguments fix karke:

```python
from functools import partial

def validate_length(value, min_len, max_len):
    return min_len <= len(value) <= max_len

validate_username = partial(validate_length, min_len=3, max_len=20)
validate_password = partial(validate_length, min_len=8, max_len=50)

validate_username("Aditya")  # True
validate_password("abc")     # False
```

---

### Interview Questions
1. `lru_cache` kya karta hai?
2. `maxsize=None` ka kya matlab hai?
3. `partial` kab use karte hain?
4. `lru_cache` aur Redis cache mein kya fark hai?

---

## 3.7 `dataclasses` vs `namedtuple` vs Normal Class

### Prerequisites
- Classes & Objects

### Comparison

```python
# Normal class — boilerplate zyada
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

# namedtuple — immutable, memory efficient
from collections import namedtuple
Point = namedtuple('Point', ['x', 'y'])

# dataclass — type hints, mutable, auto methods
from dataclasses import dataclass
@dataclass
class Point:
    x: int
    y: int
```

---

### Key Differences

| | Normal Class | namedtuple | dataclass |
|---|---|---|---|
| `__repr__` | Manual | Auto ✅ | Auto ✅ |
| Mutable | ✅ | ❌ | ✅ |
| Boilerplate | Zyada | Kam | Kam |
| Type hints | Manual | ❌ | ✅ |
| Memory | Zyada | Kam | Kam |

---

### Kab Kya Use Karein

| Situation | Use |
|---|---|
| Simple immutable data | `namedtuple` |
| Type hints + methods chahiye | `dataclass` |
| Complex logic chahiye | Normal class |

---

### Interview Questions
1. `dataclass` aur normal class mein kya fark hai?
2. `namedtuple` immutable kyun hai?
3. `dataclass` mein `frozen=True` kya karta hai?
