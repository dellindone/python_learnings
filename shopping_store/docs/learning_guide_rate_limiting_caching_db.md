# Rate Limiting, Caching & DB Optimization — A Practical Learning Guide
### Using a FastAPI Shopping App as the Example

> This guide is written for someone who knows basic Python and FastAPI but has never built production-grade systems.
> After reading each section you should know: **what the concept is**, **why it exists**, **how to build it**, and **what to think about next**.

---

## Before You Start: The Right Mental Model

Imagine your shopping app goes viral. 10,000 users hit it at once.

- Without **rate limiting** → one angry user can send 50,000 requests and crash the server for everyone.
- Without **caching** → every "GET /products" hits PostgreSQL, which can handle maybe 1,000 queries/sec. At 5,000 users all browsing products, you're dead.
- Without **DB optimization** → a single "search products" query takes 3 seconds because it scans every row in the table. With 1 million products, your server just hangs.

These three things are not "advanced" — they are the **minimum bar** for any real app.

---

## Part 1: Rate Limiting

### What is it?

Rate limiting means: **"one user/IP is allowed N requests in a time window. After that, they're blocked temporarily."**

Think of it like a bouncer at a club. You can enter once per hour. If you try again in 10 minutes, you're turned away.

### Why do you need it in a shopping app?

| Scenario | Without Rate Limiting | With Rate Limiting |
|---|---|---|
| Login endpoint | Attacker brute-forces 1 million passwords | After 5 wrong attempts in 1 min, blocked |
| Search endpoint | Bot scrapes your entire catalog in 5 seconds | 30 requests/min max per IP |
| Create order | Double-click bug creates 10 orders in 1 second | 3 orders/min per user |
| Register endpoint | Spam bots create 10,000 fake accounts | 3 registrations/min per IP |

### The Two Algorithms You Must Know

#### Algorithm 1: Fixed Window Counter

```
Window: 1 minute (00:00 → 01:00)
Max: 5 requests

Request 1 at 00:10 → count = 1 ✅
Request 2 at 00:20 → count = 2 ✅
Request 3 at 00:40 → count = 3 ✅
Request 4 at 00:55 → count = 4 ✅
Request 5 at 00:58 → count = 5 ✅
Request 6 at 00:59 → count = 6 ❌ BLOCKED

Window resets at 01:00 → count = 0
```

**Problem with Fixed Window:** A user can send 5 requests at 00:59 and 5 more at 01:01 — that's 10 requests in 2 seconds. This is called the "boundary attack."

#### Algorithm 2: Sliding Window (Better)

Instead of resetting the counter at a fixed time, it looks at the last N seconds from *right now*.

```
Now = 00:59, Window = 60 seconds → look back to 23:59
Count all requests between 23:59 and 00:59.
If count >= 5, block.
```

This is harder to game because the window always moves with time.

> **For beginners:** Start with Fixed Window. It's simpler and works fine for most use cases. Switch to Sliding Window once you understand the tradeoff.

### How Rate Limiting Works with Redis

Redis is a key-value store that lives in memory (extremely fast). For rate limiting, you store:

```
Key:   "rate_limit:login:192.168.1.1"
Value: 3  (number of requests made)
TTL:   60 seconds (auto-deleted after 1 minute)
```

Every request:
1. Check if key exists
2. If yes: increment by 1, check if over limit
3. If no: create key with value 1, set TTL to 60s

Redis does this atomically (in one operation), so no race conditions.

### Setting Up Redis Locally

```bash
# Install Redis (Mac)
brew install redis
brew services start redis

# Test it
redis-cli ping
# Should return: PONG
```

```bash
# Install Python packages
pip install redis fastapi-limiter
```

### Your First Rate Limiter — Step by Step

**Step 1: Create a Redis connection**

```python
# app/core/redis.py
import redis.asyncio as redis

redis_client: redis.Redis = None

async def get_redis() -> redis.Redis:
    return redis_client

async def init_redis():
    global redis_client
    redis_client = redis.from_url("redis://localhost:6379", decode_responses=True)
```

**Step 2: Initialize on app startup**

```python
# app/main.py
from fastapi import FastAPI
from app.core.redis import init_redis, redis_client
from fastapi_limiter import FastAPILimiter

app = FastAPI()

@app.on_event("startup")
async def startup():
    await init_redis()
    await FastAPILimiter.init(redis_client)
```

**Step 3: Apply rate limiting to routes**

```python
# app/api/auth.py
from fastapi import APIRouter, Depends
from fastapi_limiter.depends import RateLimiter

router = APIRouter()

@router.post("/login")
async def login(
    # 5 requests per 60 seconds per IP
    _: None = Depends(RateLimiter(times=5, seconds=60))
):
    return {"message": "logged in"}

@router.post("/register")
async def register(
    _: None = Depends(RateLimiter(times=3, seconds=60))
):
    return {"message": "registered"}
```

**Step 4: Custom rate limiting by user (not just IP)**

`fastapi_limiter` uses IP by default. For authenticated routes, you want per-user limits.

```python
# app/core/rate_limit.py
from fastapi import Request, Response
from fastapi_limiter.depends import RateLimiter

def user_identifier(request: Request) -> str:
    """Use user ID if logged in, otherwise use IP."""
    user = getattr(request.state, "user", None)
    if user:
        return f"user:{user.id}"
    return f"ip:{request.client.host}"

# Usage:
@router.post("/orders")
async def create_order(
    _: None = Depends(RateLimiter(times=3, seconds=60, identifier=user_identifier))
):
    ...
```

### Rate Limits for the Shopping App

| Endpoint | Limit | Reason |
|---|---|---|
| `POST /auth/login` | 5/min per IP | Prevent brute force |
| `POST /auth/register` | 3/min per IP | Prevent spam accounts |
| `GET /products` | 60/min per user | Normal browsing is fine |
| `GET /products/search` | 30/min per user | Search is expensive (DB query) |
| `POST /orders` | 3/min per user | Prevent accidental double-orders |
| `POST /reviews` | 10/min per user | Prevent review spam |

### What Happens When Someone Is Rate Limited?

The server returns HTTP `429 Too Many Requests`.

```json
{
  "success": false,
  "message": "Too many requests. Try again in 45 seconds.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 45
}
```

Add a custom error handler:

```python
# app/main.py
from fastapi_limiter import RateLimitExceeded

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "message": f"Too many requests. Try again in {exc.retry_after} seconds.",
            "code": "RATE_LIMIT_EXCEEDED",
            "retry_after": exc.retry_after
        }
    )
```

### How to Test Rate Limiting

```bash
# Hit login 6 times quickly — 5th should succeed, 6th should return 429
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

Expected output:
```
200
200
200
200
200
429   ← rate limited
```

### After This Section, Think About:

1. **Where in your app are the most dangerous endpoints?** (Login, register, payment — these should have the strictest limits)
2. **Should different users have different limits?** (A paid user might get 200 requests/min vs a free user getting 60)
3. **What if Redis goes down?** (Should you fail open — allow all requests — or fail closed — block all?) Most apps fail open (allow requests) to avoid a Redis outage killing your app.

---

## Part 2: Caching

### What is it?

Caching means: **"save the result of an expensive operation somewhere fast, so next time you skip the expensive part."**

```
Without cache:
User → FastAPI → PostgreSQL (50ms) → User

With cache:
User → FastAPI → Redis (1ms) → User   ← 50x faster!
     (only hits PostgreSQL if data not in Redis)
```

### Why does it matter for a shopping app?

| Endpoint | DB Query Time | With Cache |
|---|---|---|
| `GET /products` (all products) | ~100ms (scans table) | ~2ms (Redis lookup) |
| `GET /products/{id}` | ~10ms | ~1ms |
| `GET /categories` | ~20ms (rarely changes) | ~1ms |
| `GET /products/popular` | ~200ms (aggregation) | ~2ms |

The `GET /categories` is a great example — categories change maybe once a week, but every page load fetches them. Without caching, you're hammering your DB for no reason.

### What NOT to Cache

This is just as important as what to cache.

| Data | Cache? | Why |
|---|---|---|
| Product list | ✅ Yes | Same for all users, changes infrequently |
| Product details | ✅ Yes | Same for all users |
| Categories | ✅ Yes | Almost never changes |
| Popular products | ✅ Yes | Computed, expensive, refreshes every hour |
| Cart | ❌ No | Specific to user, changes constantly |
| Orders | ❌ No | Must always be accurate |
| User profile | ❌ No | Security risk — wrong user sees wrong data |
| Stock count | ❌ No | Must be real-time accurate |
| Payments | ❌ No | Never cache financial data |

**Rule of thumb:** Cache data that is (1) the same for many users AND (2) doesn't need to be 100% real-time accurate.

### Cache Strategies — The Three Patterns

#### Pattern 1: Cache-Aside (Most Common)

```
Read:
1. Check Redis for the key
2. If found (cache hit) → return it immediately
3. If not found (cache miss) → query DB → save to Redis → return it

Write:
1. Write to DB
2. Delete the cached key (so next read re-fetches fresh data)
```

This is what you'll use 90% of the time. Simple to understand and implement.

```python
async def get_product(product_id: int, db: Session, redis: Redis):
    cache_key = f"product:{product_id}"

    # Step 1: check cache
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)  # cache HIT — return immediately

    # Step 2: cache miss — go to DB
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404)

    # Step 3: save to cache for next time (TTL = 10 minutes)
    await redis.setex(cache_key, 600, json.dumps(product_to_dict(product)))

    return product
```

#### Pattern 2: Write-Through

Every time you write to DB, you also update the cache at the same time. Data in cache is always fresh, but writes are slower (two operations instead of one).

```python
async def update_product(product_id: int, data: dict, db: Session, redis: Redis):
    # Write to DB
    product = db.query(Product).filter(Product.id == product_id).first()
    for key, value in data.items():
        setattr(product, key, value)
    db.commit()

    # Also update cache immediately
    cache_key = f"product:{product_id}"
    await redis.setex(cache_key, 600, json.dumps(product_to_dict(product)))
```

#### Pattern 3: Write-Invalidate (Simplest to get right)

When data changes, just DELETE the cache entry. Next read will fetch fresh from DB.

```python
async def update_product(product_id: int, data: dict, db: Session, redis: Redis):
    # Write to DB
    product = db.query(Product).filter(Product.id == product_id).first()
    for key, value in data.items():
        setattr(product, key, value)
    db.commit()

    # Delete cache — next read will get fresh data
    await redis.delete(f"product:{product_id}")
```

> **For beginners:** Use Cache-Aside for reads + Write-Invalidate for writes. This combination is safe, easy to understand, and correct.

### Building a Cache Layer for the Shopping App

**Step 1: A reusable cache helper**

```python
# app/core/cache.py
import json
from typing import Any, Optional
import redis.asyncio as redis

class Cache:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    async def get(self, key: str) -> Optional[Any]:
        value = await self.redis.get(key)
        if value:
            return json.loads(value)
        return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 300):
        await self.redis.setex(key, ttl_seconds, json.dumps(value))

    async def delete(self, key: str):
        await self.redis.delete(key)

    async def delete_pattern(self, pattern: str):
        """Delete all keys matching a pattern. Use carefully — can be slow."""
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)
```

**Step 2: Cache product details**

```python
# app/api/products.py
from app.core.cache import Cache

@router.get("/products/{product_id}")
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    cache: Cache = Depends(get_cache)
):
    cache_key = f"product:{product_id}"

    # Try cache first
    cached_product = await cache.get(cache_key)
    if cached_product:
        return {"success": True, "data": cached_product, "source": "cache"}

    # Fall back to DB
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product_data = {
        "id": product.id,
        "name": product.name,
        "price": float(product.price),
        "description": product.description,
        "category_id": product.category_id,
    }

    # Cache for 10 minutes
    await cache.set(cache_key, product_data, ttl_seconds=600)

    return {"success": True, "data": product_data, "source": "database"}
```

**Step 3: Invalidate cache when product is updated**

```python
@router.patch("/admin/products/{product_id}")
async def update_product(
    product_id: int,
    data: ProductUpdateSchema,
    db: Session = Depends(get_db),
    cache: Cache = Depends(get_cache)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404)

    for field, value in data.dict(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()

    # Invalidate the product cache
    await cache.delete(f"product:{product_id}")
    # Also invalidate the product list cache (since one product changed)
    await cache.delete_pattern("products:list:*")

    return {"success": True, "message": "Product updated"}
```

**Step 4: Cache product list with pagination**

```python
@router.get("/products")
async def list_products(
    page: int = 1,
    page_size: int = 20,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    cache: Cache = Depends(get_cache)
):
    # Cache key includes all parameters that affect the result
    cache_key = f"products:list:page={page}:size={page_size}:cat={category_id}"

    cached = await cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached}

    query = db.query(Product).filter(Product.is_active == True)
    if category_id:
        query = query.filter(Product.category_id == category_id)

    total = query.count()
    products = query.offset((page - 1) * page_size).limit(page_size).all()

    result = {
        "items": [product_to_dict(p) for p in products],
        "total": total,
        "page": page,
        "page_size": page_size
    }

    # Cache for 5 minutes
    await cache.set(cache_key, result, ttl_seconds=300)

    return {"success": True, "data": result}
```

### TTL (Time To Live) — How Long to Cache?

TTL = how long before the cached data expires automatically.

| Data | TTL | Reasoning |
|---|---|---|
| Categories | 1 hour (3600s) | Almost never changes |
| Product details | 10 minutes (600s) | Changes occasionally (price, stock) |
| Product list | 5 minutes (300s) | New products added, prices change |
| Popular products | 30 minutes (1800s) | Computed ranking, refreshing too often is wasteful |
| Search results | 2 minutes (120s) | Fresh enough but not stale |

**Rule:** The more something changes, the lower the TTL. The more expensive to compute, the more you *want* to cache it.

### Cache Stampede Problem

Imagine 1,000 users all request `GET /products` at the same moment the cache expires. All 1,000 see a cache miss, all 1,000 hit the database at once. This can crash your DB.

```
T=0: Cache expires for "products:list:page=1"
T=0.001: 1000 requests arrive → all miss cache → all hit DB
DB: 💀
```

**Solution: Probabilistic Early Expiration** — refresh cache slightly before it expires.

```python
import random

async def get_with_jitter(cache: Cache, key: str, threshold_seconds: int = 30):
    """Refresh cache early with some probability to avoid stampede."""
    ttl = await cache.redis.ttl(key)
    # If TTL is low AND we randomly decide to refresh early
    if ttl < threshold_seconds and random.random() < 0.1:
        return None  # Pretend cache miss, trigger refresh
    return await cache.get(key)
```

> **For now, don't implement this.** Just know the problem exists. Your first version doesn't need this.

### How to Verify Caching Works

Add `"source": "cache"` or `"source": "database"` to your response (remove in production):

```bash
# First request — should say "database"
curl http://localhost:8000/api/v1/products/1
# {"success": true, "data": {...}, "source": "database"}

# Second request — should say "cache"
curl http://localhost:8000/api/v1/products/1
# {"success": true, "data": {...}, "source": "cache"}
```

Or check Redis directly:
```bash
redis-cli keys "product:*"
# "product:1"
# "product:2"

redis-cli ttl "product:1"
# 543  (seconds remaining)
```

### After This Section, Think About:

1. **What's the cost of serving stale data?** If product price is wrong in cache for 5 minutes, is that a business problem? (Usually yes for payments, usually no for browsing)
2. **What if Redis goes down?** Your code should fall back to the database. Use a try/except around cache calls.
3. **How do you invalidate a product list cache when a product is updated?** (Hint: `delete_pattern("products:list:*")` — but this is slow at scale. Welcome to the hardest problem in computer science.)

---

## Part 3: Database Optimization

### Why Queries Get Slow

A database table is like a book. Finding a record without an index is like finding a word in a book without a table of contents — you read every single page.

With 100 rows: fine.
With 1,000,000 rows: your query takes 10 seconds.

### Tool You Must Know: EXPLAIN ANALYZE

Before optimizing anything, you need to see **how PostgreSQL is executing your query.**

```sql
EXPLAIN ANALYZE
SELECT * FROM products WHERE category_id = 5;
```

Output:
```
Seq Scan on products  (cost=0.00..1234.00 rows=50 width=200) (actual time=0.050..245.123 rows=50 loops=1)
  Filter: (category_id = 5)
  Rows Removed by Filter: 49950
Planning Time: 0.5 ms
Execution Time: 245.6 ms
```

**"Seq Scan"** = Sequential Scan = reading every row. This is bad.
**"Index Scan"** = Using an index. This is fast.

### Indexes — The Most Important Optimization

An index is a separate data structure that lets the DB find rows quickly without scanning everything.

```sql
-- Without index: scans all 1 million rows to find category_id = 5
SELECT * FROM products WHERE category_id = 5;  -- 500ms

-- Create an index
CREATE INDEX idx_products_category_id ON products(category_id);

-- With index: jumps directly to the matching rows
SELECT * FROM products WHERE category_id = 5;  -- 2ms
```

**SQLAlchemy model with indexes:**

```python
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Index
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)  # PK is always indexed automatically
    name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Add indexes for columns you frequently query/filter by
    __table_args__ = (
        Index("idx_products_category_id", "category_id"),
        Index("idx_products_is_active", "is_active"),
    )
```

### When to Add an Index

**Add an index when:**
- You filter by this column in WHERE: `WHERE category_id = 5`
- You join tables on this column: `JOIN orders ON orders.user_id = users.id`
- You sort by this column frequently: `ORDER BY created_at DESC`
- It's a foreign key column

**Don't add an index when:**
- The column has very few unique values (like `is_active` = true/false — often not worth it unless the table is huge)
- The table is small (< 10,000 rows — index overhead is not worth it)
- You write to this column very frequently (indexes slow down writes)

### Composite Indexes — When You Filter by Multiple Columns

```python
# You frequently run queries like this:
SELECT * FROM products WHERE category_id = 5 AND is_active = true ORDER BY created_at DESC;
```

A composite index covers multiple columns at once:

```python
__table_args__ = (
    # This single index handles: filter by category + active + sort by date
    Index("idx_products_category_active_created", "category_id", "is_active", "created_at"),
)
```

**Important rule:** The order of columns in a composite index matters. The index works best if you filter by the **leftmost columns first**. An index on `(category_id, is_active)` helps queries that filter by `category_id` alone OR by `category_id + is_active`. It does NOT help queries that filter by `is_active` alone.

```sql
-- Uses the index (filters on leftmost column)
SELECT * FROM products WHERE category_id = 5;

-- Uses the index (filters on both columns)
SELECT * FROM products WHERE category_id = 5 AND is_active = true;

-- Does NOT use the index (skips leftmost column)
SELECT * FROM products WHERE is_active = true;
```

### Full-Text Search — Searching by Name or Description

```sql
-- BAD: This is a "full table scan" — reads every row, doesn't use indexes
SELECT * FROM products WHERE name LIKE '%running shoes%';
```

Why is `LIKE '%something%'` bad? The `%` at the start means "starts with anything" — PostgreSQL can't use an index to skip rows, it must check every single row.

**Solution: PostgreSQL Full-Text Search**

```sql
-- Create a special index for text search
CREATE INDEX idx_products_fts ON products USING gin(to_tsvector('english', name || ' ' || description));

-- Fast text search
SELECT * FROM products
WHERE to_tsvector('english', name || ' ' || description) @@ to_tsquery('english', 'running & shoes');
```

In SQLAlchemy:

```python
from sqlalchemy import func, Index
from sqlalchemy.dialects.postgresql import TSVECTOR

class Product(Base):
    __tablename__ = "products"
    # ... columns ...

    __table_args__ = (
        Index(
            "idx_products_fts",
            func.to_tsvector("english", name + " " + description),
            postgresql_using="gin"
        ),
    )

# In your query:
def search_products(search_term: str, db: Session):
    ts_query = func.to_tsquery("english", search_term.replace(" ", " & "))
    return db.query(Product).filter(
        func.to_tsvector("english", Product.name + " " + Product.description).op("@@")(ts_query)
    ).all()
```

### Pagination — Never Return All Rows

A common beginner mistake:

```python
# BAD: loads all 1 million products into memory
products = db.query(Product).all()
return products[0:20]  # Only needed 20!
```

Correct way:

```python
# GOOD: DB only fetches and sends 20 rows
def list_products(page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    offset = (page - 1) * page_size
    products = db.query(Product).offset(offset).limit(page_size).all()
    total = db.query(Product).count()
    return {"items": products, "total": total, "page": page}
```

**Offset pagination vs Cursor pagination:**

| | Offset Pagination | Cursor Pagination |
|---|---|---|
| How | `OFFSET 1000 LIMIT 20` | `WHERE id > 1000 LIMIT 20` |
| Speed | Slows down on deep pages (OFFSET 100000 is slow) | Always fast |
| Consistent? | No — if row deleted, items shift | Yes — stable |
| Easy to implement? | Yes | Moderate |

For a shopping app: use **offset pagination** for browsing (page 1, 2, 3...) and **cursor pagination** for infinite scroll / feeds.

```python
# Cursor-based pagination
def list_products_cursor(after_id: Optional[int] = None, limit: int = 20, db: Session = Depends(get_db)):
    query = db.query(Product).filter(Product.is_active == True)
    if after_id:
        query = query.filter(Product.id > after_id)
    products = query.order_by(Product.id).limit(limit).all()

    next_cursor = products[-1].id if len(products) == limit else None
    return {"items": products, "next_cursor": next_cursor}
```

### The N+1 Problem — The Silent Killer

This is one of the most common performance bugs. It's called N+1 because you make 1 query to get N records, then N more queries to get related data.

```python
# BAD — N+1 problem
orders = db.query(Order).filter(Order.user_id == user_id).all()
# This runs 1 query ✅

for order in orders:
    items = order.items  # SQLAlchemy fetches this lazily — runs 1 query per order!
    # If you have 50 orders → 50 extra queries = 51 queries total 💀
```

**How to detect it:** Watch your logs. If you see dozens of nearly identical queries for the same route, you have N+1.

**How to fix it — use `joinedload` or `selectinload`:**

```python
from sqlalchemy.orm import joinedload, selectinload

# GOOD — loads everything in 2 queries (not N+1)
orders = (
    db.query(Order)
    .filter(Order.user_id == user_id)
    .options(selectinload(Order.items))  # Pre-load all items in one extra query
    .all()
)

# Now accessing order.items doesn't hit the DB again
for order in orders:
    for item in order.items:  # No extra queries! ✅
        print(item.product_id)
```

**`joinedload` vs `selectinload`:**
- `joinedload` = SQL JOIN — one query, good for one-to-one or small collections
- `selectinload` = separate query with `WHERE id IN (...)` — good for one-to-many collections (orders → items)

### Query Plans — Reading EXPLAIN ANALYZE

Run this in `psql` or any DB tool:

```sql
EXPLAIN ANALYZE
SELECT p.*, c.name as category_name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 20;
```

Look for:
- `Seq Scan` → missing index
- `Index Scan` → good
- `Nested Loop` on large tables → might need better join strategy
- `cost=xxx..yyy` → higher numbers = more work
- `actual time=...` → real execution time

**Action:** If you see `Seq Scan` on a column you filter by in WHERE, add an index on that column.

### Connection Pooling — Don't Open a New DB Connection Per Request

Every DB connection has overhead (authentication, memory, etc.). Opening a new connection for every HTTP request is slow.

**Connection pooling** = maintain a pool of open connections and reuse them.

```python
# app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user:pass@localhost/shopdb"

engine = create_engine(
    DATABASE_URL,
    pool_size=10,         # keep 10 connections open always
    max_overflow=20,      # allow up to 20 extra connections during spikes
    pool_pre_ping=True,   # check if connection is alive before using it
    pool_recycle=3600,    # recycle connections every hour (avoids stale connections)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

For async SQLAlchemy with asyncpg:

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/shopdb",
    pool_size=10,
    max_overflow=20,
)
```

### Putting It Together — Optimized Product Query

```python
# app/api/products.py
from sqlalchemy.orm import selectinload

@router.get("/products")
async def list_products(
    page: int = 1,
    page_size: int = 20,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    cache: Cache = Depends(get_cache),
):
    cache_key = f"products:page={page}:size={page_size}:cat={category_id}:q={search}"

    cached = await cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached}

    query = db.query(Product).filter(Product.is_active == True)

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if search:
        # Full-text search (fast, uses GIN index)
        ts_query = func.to_tsquery("english", search.replace(" ", " & "))
        query = query.filter(
            func.to_tsvector("english", Product.name).op("@@")(ts_query)
        )

    # Efficient: count + paginate in same query execution plan
    total = query.count()
    products = (
        query
        .order_by(Product.created_at.desc())  # Needs index on created_at
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    result = {
        "items": [product_to_dict(p) for p in products],
        "total": total,
        "page": page,
        "pages": (total + page_size - 1) // page_size
    }

    await cache.set(cache_key, result, ttl_seconds=300)
    return {"success": True, "data": result}
```

### Migrations — Adding Indexes to Existing Tables

Use Alembic to manage schema changes:

```bash
pip install alembic
alembic init alembic
```

```python
# alembic/versions/001_add_product_indexes.py
def upgrade():
    op.create_index("idx_products_category_id", "products", ["category_id"])
    op.create_index("idx_products_is_active", "products", ["is_active"])
    op.create_index("idx_products_created_at", "products", ["created_at"])
    op.create_index(
        "idx_products_category_active",
        "products",
        ["category_id", "is_active"]
    )

def downgrade():
    op.drop_index("idx_products_category_active", "products")
    op.drop_index("idx_products_created_at", "products")
    op.drop_index("idx_products_is_active", "products")
    op.drop_index("idx_products_category_id", "products")
```

```bash
alembic upgrade head
```

### After This Section, Think About:

1. **Which queries in your app are slow?** Enable SQLAlchemy query logging and look for slow queries. Any query taking over 100ms should be investigated.
2. **Do you have N+1 problems?** Look at your ORM relationships. Any time you loop over a list and access a related object, you might have N+1.
3. **Are you paginating everywhere?** If any endpoint returns a list of DB objects without a LIMIT, fix it immediately.

---

## Bringing It All Together

Here's how rate limiting, caching, and DB optimization work as a system:

```
Request: GET /products?page=1&category=shoes

1. RATE LIMITING (first layer)
   → Check Redis: has this IP/user made too many requests?
   → If yes: return 429 immediately (DB not touched)
   → If no: continue

2. CACHING (second layer)
   → Check Redis: do we have "products:page=1:cat=shoes" cached?
   → If yes: return cached data immediately (DB not touched)
   → If no: continue

3. DB QUERY (only reached if cache miss)
   → Query PostgreSQL with proper indexes
   → category_id index makes filtering fast
   → LIMIT/OFFSET makes pagination fast
   → joinedload prevents N+1 if loading related data

4. CACHE WRITE
   → Store result in Redis with 5-minute TTL
   → Next request hits cache instead

Total time: 1ms (cache hit) or 15ms (cache miss with indexed query)
vs. 500ms without any optimization
```

---

## Learning Roadmap — What to Build in Order

1. **Build the basic shopping app first** (routes, DB models, auth) without any optimization
2. **Add Redis to the project** — just get it connected and test with `redis-cli ping`
3. **Add rate limiting to login and register** — these are the most critical
4. **Add caching to `GET /products/{id}`** — simplest cache to implement
5. **Add caching to `GET /products`** — includes cache key with pagination params
6. **Add cache invalidation on product update** — this is where it gets tricky
7. **Add indexes** — run EXPLAIN ANALYZE on your main queries and add indexes
8. **Fix N+1 problems** — add `selectinload` to your relationship queries
9. **Add proper pagination** — if you're returning raw `.all()` anywhere, fix it
10. **Load test** — use `locust` or `k6` to simulate 100 concurrent users and watch what breaks

---

## Common Mistakes to Avoid

| Mistake | Why It's a Problem | Fix |
|---|---|---|
| Caching cart data | User sees wrong cart | Never cache user-specific mutable data |
| Setting TTL too high | Users see stale prices | Set TTL based on how often data changes |
| No cache invalidation on update | Cache serves old data forever | Delete cache key when data changes |
| Rate limiting only by IP | 1 user = multiple IPs (mobile) | Rate limit by user ID for authenticated routes |
| `LIKE '%term%'` for search | Full table scan | Use full-text search with GIN index |
| Forgetting to add indexes on FK columns | Slow JOINs | Always index foreign key columns |
| Loading all records then slicing in Python | Out of memory with large tables | Always use LIMIT/OFFSET at the DB level |

---

## Tools for Your Toolkit

| Tool | Purpose |
|---|---|
| `redis-cli monitor` | Watch all Redis commands in real time |
| `EXPLAIN ANALYZE` in psql | See how PostgreSQL runs your query |
| SQLAlchemy `echo=True` | Log all SQL queries to console |
| `pgAdmin` or `DBeaver` | GUI to explore your DB and run queries |
| `locust` (Python) | Load test your API |
| `py-spy` | Profile your Python code to find slowdowns |
