# Shopping Store — Master Learning Plan

> **Purpose:** This is not just a project. It is a structured learning journey.
> Each phase has a clear goal, a build target, and learning checkpoints.
> Do not move to the next phase until you can answer the checkpoint questions confidently.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI (async) |
| Database | PostgreSQL |
| ORM | SQLAlchemy Async |
| Cache / Rate Limiting | Redis |
| Migrations | Alembic |
| Background Workers | ARQ or Celery |
| Auth | JWT (access + refresh tokens) |
| Containerization | Docker + docker-compose |
| Testing | pytest + httpx |
| Load Testing | Locust |

---

## Architecture: Module-Based Layered Design

Every feature lives in `app/modules/<name>/` and follows this internal flow:

```
router.py       → handles HTTP only (routes, status codes, request parsing)
controller.py   → calls service, formats response
service.py      → business logic, validation, orchestration
repository.py   → database queries only
```

**Rules:**
- `router` never talks to `repository` directly
- `service` never imports FastAPI or knows about HTTP
- `repository` never has business logic — only raw DB queries
- `schemas/` holds Pydantic models for request/response shapes
- `models/` holds SQLAlchemy ORM models

```
app/
├── main.py
├── core/
│   ├── config.py          ← env vars, settings
│   ├── database.py        ← async engine, session
│   ├── dependencies.py    ← get_current_user, get_admin_user
│   ├── exceptions.py      ← custom exceptions + handlers
│   └── security.py        ← JWT, password hashing
│
├── models/
│   ├── base.py            ← Base, TimestampMixin
│   ├── user.py
│   ├── refresh_token.py
│   ├── category.py        ← to build
│   ├── product.py         ← to build
│   ├── cart.py            ← to build
│   ├── cart_item.py       ← to build
│   ├── order.py           ← to build
│   ├── order_item.py      ← to build
│   └── review.py          ← to build
│
├── schemas/
│   ├── auth.py
│   ├── user.py
│   ├── product.py         ← to build
│   ├── cart.py            ← to build
│   └── order.py           ← to build
│
├── modules/
│   ├── auth/              ← DONE
│   ├── users/             ← DONE
│   ├── products/          ← ✅ Done
│   ├── cart/              ← Phase 3
│   └── orders/            ← Phase 4
│
└── utils/
    └── response.py        ← success(), error() helpers
```

---

## Progress Tracker

| Phase | Topic | Status |
|---|---|---|
| 1 | Auth (register, login, logout, refresh token) | ✅ Done |
| 1 | Users (get me, update me) | ✅ Done |
| 2 | Products + Categories CRUD | ✅ Done |
| 2 | Admin product management | ✅ Done |
| 2 | Pagination + filtering | 🔲 Pending |
| 3 | Cart management | ✅ Done |
| 4 | Orders + Transactions | ✅ Done |
| 4 | Orders + Transactions | 🔲 |
| 5 | Global error handling (review + harden) | ✅ Done |
| 6 | Rate limiting (Redis) | 🔲 |
| 7 | Redis caching (products, categories) | 🔲 |
| 8 | DB indexing + EXPLAIN ANALYZE | 🔲 |
| 9 | Query optimization (N+1, pagination) | 🔲 |
| 10 | Background workers (email, stock release) | 🔲 |
| 11 | Structured logging | 🔲 |
| 12 | Testing (unit + integration) | 🔲 |
| 13 | Load Testing (Locust) | 🔲 |
| 14 | Docker + docker-compose | 🔲 |

---

## Phase 1 — Auth + Users ✅ Done

**What you built:**
- Register, login, logout, refresh token
- JWT access + refresh token pair
- Hashed refresh tokens stored in DB
- `get_current_user` dependency
- Custom exception hierarchy + global handler
- Standard `success()` / `error()` response helpers

**What you learned:**
- Module-based architecture pattern
- Async SQLAlchemy session management
- JWT creation and verification
- Password hashing with bcrypt
- Dependency injection in FastAPI

**Checkpoint — can you answer these?**
1. Why do we store a hashed version of the refresh token, not the raw token?
2. What happens if the DB commit succeeds but the response never reaches the client?
3. Why is `expire_on_commit=False` set in the session factory?
4. What is the difference between `access_token` and `refresh_token` in terms of lifetime and purpose?
5. If an attacker steals a refresh token directly from the database, can they use it to log in? Why or why not?
6. Why do access tokens have a short expiry (15 min) while refresh tokens last days or weeks? What is the risk of making access tokens long-lived?
7. What is a timing attack on password comparison? Why should you never use `==` to compare passwords or tokens?
8. Two users register with the same email at the exact same millisecond. What prevents both from succeeding? Which layer enforces this?
9. Your `get_current_user` dependency hits the DB on every single request to verify the user exists. What is the trade-off of this approach vs trusting only the JWT payload?
10. What happens to all a user's sessions if you delete their refresh tokens from the DB? Is that a logout from all devices?

---

## Phase 2 — Products + Categories

**Goal:** Build the full products module with public read APIs and admin write APIs.

**What to build:**

| Route | Auth | Description |
|---|---|---|
| `GET /api/v1/products` | Public | List active products, paginated, filter by category |
| `GET /api/v1/products/{id}` | Public | Get single product detail |
| `GET /api/v1/categories` | Public | List all categories |
| `POST /api/v1/admin/products` | Admin only | Create product |
| `PATCH /api/v1/admin/products/{id}` | Admin only | Update product fields |
| `DELETE /api/v1/admin/products/{id}` | Admin only | Soft delete (set is_active=False) |

**Build order:**
1. `models/category.py` — Category ORM model
2. `models/product.py` — Product ORM model (FK to category)
3. Alembic migration for both tables
4. `schemas/product.py` — request + response Pydantic schemas
5. `modules/products/repository.py` — all DB queries
6. `modules/products/service.py` — business logic
7. `modules/products/controller.py` — response formatting
8. `modules/products/router.py` — routes + auth guards
9. Register router in `main.py`

**Key design decisions to think about:**

- `price` column: use `Numeric(10, 2)` not `Float`. Why? Float has binary precision errors — `0.1 + 0.2 ≠ 0.3`. Never use float for money.
- `slug`: auto-generate from `name` in the service layer. Must be unique. Used for SEO-friendly URLs.
- `DELETE` = soft delete only. Set `is_active = False`. Never hard delete products — order history depends on them.
- `PATCH` = partial update. Only update fields that are provided. Use `exclude_unset=True` in Pydantic.
- Admin guard: add `get_admin_user` dependency to `core/dependencies.py`. Checks `user.role == "admin"`.
- Public list endpoint: only return `is_active = True` products.
- Admin list endpoint: return all products including inactive.

**Pagination — implement from day one:**
```
GET /products?page=1&limit=20&category_id=3
```
Never return all rows. Always use `LIMIT` + `OFFSET` at the DB level.

**What you will learn:**
- Foreign key relationships in SQLAlchemy
- Role-based access control via dependencies
- Partial updates with PATCH
- Soft delete pattern
- Pagination design

**Checkpoint — can you answer these?**
1. Why use `Numeric(10, 2)` instead of `Float` for price?
2. What is a slug and why does a product have both `id` and `slug`?
3. Why should DELETE be a soft delete for products?
4. What does `exclude_unset=True` do in a Pydantic `.model_dump()` call?
5. What is the difference between a public and an admin version of the product list?
6. A regular user hits `POST /admin/products`. Should they get a `401 Unauthorized` or `403 Forbidden`? What is the difference?
7. What HTTP status code should a successful `POST /admin/products` return — 200 or 201? Why?
8. Two products have the same name. Is that allowed? What actually makes a product unique in your schema?
9. An admin updates a product's price. What happens to the cached version of that product in Redis? Who is responsible for invalidating it — the service or the repository?
10. A category is deleted while 50 products still reference it. What happens? What are your options (`CASCADE`, `SET NULL`, `RESTRICT`) and which makes the most sense here?
11. What is the difference between `PATCH` and `PUT`? Why is `PATCH` the right choice for updating a product?

---

## Phase 3 — Cart

**Goal:** Each user has one cart. Cart items link to products.

**What to build:**

| Route | Auth | Description |
|---|---|---|
| `GET /api/v1/cart` | User | Get current user's cart with items |
| `POST /api/v1/cart/items` | User | Add product to cart (or increment qty) |
| `PATCH /api/v1/cart/items/{id}` | User | Update quantity |
| `DELETE /api/v1/cart/items/{id}` | User | Remove item from cart |

**Key design decisions:**
- One cart per user. Create it automatically on first add-to-cart if it doesn't exist.
- When fetching cart, also fetch all cart items with product details — think about N+1.
- Validate stock before adding to cart.
- Do NOT cache cart data. It is user-specific and changes constantly.

**What you will learn:**
- One-to-one relationships (user → cart)
- One-to-many relationships (cart → cart_items)
- Eager loading with `selectinload` to avoid N+1
- Upsert logic (add item if not exists, increment if exists)

**Checkpoint:**
1. What is the N+1 problem? How does `selectinload` fix it?
2. What happens if a user adds a product that is out of stock?
3. Why should cart data never be cached in Redis?
4. A user adds product A to their cart. Then the admin sets product A to `is_active = False`. What should happen to the cart item? Should it be shown? Should it block checkout?
5. A user adds the same product to the cart twice. Do you create two rows or increment the quantity of the existing row? What is the SQL operation called for this pattern?
6. What should `GET /cart` return when the cart is empty — an empty list, a 404, or a cart object with zero items?
7. If a user's cart has 3 items, what is the minimum number of DB queries needed to return the full cart with product details? How does `selectinload` achieve this?
8. What happens to a user's cart when they place an order? Who is responsible for clearing it — the cart service or the order service?

---

## Phase 4 — Orders + Transactions

**Goal:** Convert a cart into an order atomically. This is the most critical flow in the app.

**What to build:**

| Route | Auth | Description |
|---|---|---|
| `POST /api/v1/orders` | User | Create order from cart |
| `GET /api/v1/orders` | User | List user's orders |
| `GET /api/v1/orders/{id}` | User | Get order detail |
| `POST /api/v1/orders/{id}/cancel` | User | Cancel order |

**Order creation flow (all inside one transaction):**
```
Validate cart is not empty
  ↓
Check stock for each item
  ↓
Calculate total price
  ↓
BEGIN TRANSACTION
  ↓
Create order record
  ↓
Create order_items (snapshot price + name at time of order)
  ↓
Reduce stock for each product
  ↓
Clear cart
  ↓
COMMIT
  ↓
Publish background job (send email)
  ↓
Return order response
```

**Why snapshot price in order_items?**
Product prices change over time. An order must record the price the customer actually paid, not the current price.

**Key design decisions:**
- `order_items.unit_price` stores the price at time of purchase — never recalculate from current product price.
- `order_items.product_name` stores the name at time of purchase — product names can change.
- If stock check fails mid-transaction → rollback everything.
- Order status: `pending → confirmed → shipped → delivered → cancelled`

**What you will learn:**
- Database transactions (`async with db.begin()`)
- Atomicity: all-or-nothing operations
- Why financial data requires snapshots
- Rollback on partial failure

**Checkpoint:**
1. What does "atomic" mean in the context of a database transaction?
2. Why do we store `unit_price` in `order_items` instead of looking it up from `products`?
3. What happens if we reduce stock but the DB commit fails? How do transactions protect against this?
4. Why is order status a state machine? What transitions are valid?
5. The background email job is enqueued AFTER the transaction commits, not inside it. Why? What goes wrong if you enqueue inside the transaction?
6. 100 users simultaneously try to buy the last unit in stock. How does the DB ensure only one succeeds and the rest get an error? What SQL mechanism prevents overselling?
7. A user cancels an order that has already been shipped. What should happen? How does your status state machine prevent this?
8. What is the difference between optimistic locking and pessimistic locking? Which approach does your stock check use?
9. An order is created and stock is reduced. Then the payment fails. What should happen to the stock? Who triggers the reversal?
10. Why do we store `product_name` as a snapshot in `order_items`? What breaks if we don't, and a product is renamed 6 months later?

---

## Phase 5 — Global Error Handling (Harden)

**Goal:** Review and strengthen error handling across all modules.

**What to do:**
- Ensure every service raises a typed exception (e.g., `NotFoundException`, `ConflictException`)
- Ensure the global handler in `main.py` catches all `AppException` subtypes
- Add a catch-all handler for unhandled exceptions (return 500, log internally)
- Validate that no raw `HTTPException` leaks from service or repository layers

**Checkpoint:**
1. What is the difference between raising `HTTPException` in a service vs raising a custom `AppException`?
2. Where should HTTP status codes be decided — in the service or the exception class?
3. What should a client receive when an unhandled exception occurs in production — the full stack trace or a generic message? Why?
4. What is the difference between a `400 Bad Request` and a `422 Unprocessable Entity`? When does FastAPI automatically return 422?
5. If the DB connection drops in the middle of a request, what exception is raised and what should the client see?
6. Your service raises `NotFoundException` but you forgot to register a handler for it. What does FastAPI return to the client by default?

---

## Phase 6 — Rate Limiting

**Goal:** Protect sensitive endpoints from abuse using Redis.

**What to implement:**

| Endpoint | Limit |
|---|---|
| `POST /auth/login` | 5 requests / minute per IP |
| `POST /auth/register` | 3 requests / minute per IP |
| `GET /products` | 60 requests / minute per user |
| `POST /orders` | 3 requests / minute per user |

**How it works:**
1. Each request increments a Redis counter with a TTL
2. If counter exceeds limit → raise `RateLimitException` (HTTP 429)
3. For authenticated routes: key by `user_id`. For public routes: key by IP.

**What you will learn:**
- Redis `INCR` + `EXPIRE` pattern
- Fixed window vs sliding window algorithms
- Fail-open vs fail-closed (what to do when Redis is down)

**Checkpoint:**
1. What is the "boundary attack" on fixed window rate limiting?
2. Should you fail open or fail closed if Redis goes down? Why?
3. Why rate-limit by user ID for authenticated routes instead of IP?
4. What is the difference between rate limiting and throttling?
5. A user makes 4 requests at 00:59 and 4 more at 01:01. With a fixed window of 5/min, how many requests did they get through? Is this a problem?
6. Your login rate limit is 5/min per IP. An attacker uses 1000 different IPs. Does your rate limiter stop them? What additional defense would you add?
7. Should rate limiting happen before or after JWT authentication middleware in the request pipeline? Why?
8. How would you implement different rate limits for free users (60/min) vs premium users (300/min)?

---

## Phase 7 — Redis Caching

**Goal:** Cache expensive, shared, read-heavy data.

**What to cache:**

| Data | TTL | Cache key pattern |
|---|---|---|
| Product detail | 10 min | `product:{id}` |
| Product list (paginated) | 5 min | `products:page={n}:limit={l}:cat={c}` |
| Categories | 1 hour | `categories:all` |

**Never cache:** cart, orders, payments, user profile.

**Cache-aside pattern (use this):**
```
1. Check Redis → if hit, return immediately
2. If miss → query DB → store in Redis → return
3. On update/delete → invalidate cache key
```

**What you will learn:**
- Cache-aside pattern
- TTL design decisions
- Cache invalidation on write
- Cache stampede problem (awareness, not implementation)

**Checkpoint:**
1. What is a cache stampede? When does it happen?
2. When you update a product, which cache keys must you invalidate?
3. What is the trade-off between a long TTL and a short TTL?
4. Your categories cache has a 1-hour TTL. An admin adds a new category. How long until all users see it? Is that acceptable?
5. What is the difference between cache invalidation (delete the key) and cache refresh (update the key with new data)? When would you use each?
6. Redis runs out of memory. What happens to your cached data? What is an eviction policy and which one (`LRU`, `LFU`, `noeviction`) would you choose for this use case?
7. You cache `products:page=1:limit=20:cat=5`. A product in category 5 gets its price updated. You delete `product:{id}`. Is the list cache now stale? What do you do about it?
8. What is the difference between `Cache-Aside` and `Write-Through` caching? Which are you using and why?

---

## Phase 8 — Database Indexing

**Goal:** Add indexes on the columns you actually query, and measure the impact.

**Indexes to add:**

| Table | Column(s) | Reason |
|---|---|---|
| `products` | `category_id` | Filter by category |
| `products` | `is_active` | Filter active products |
| `products` | `(category_id, is_active, created_at)` | Composite — list query |
| `orders` | `(user_id, created_at DESC)` | User order history |
| `cart_items` | `(cart_id, product_id)` | Cart lookup |

**How to verify:**
Run `EXPLAIN ANALYZE` before and after adding each index. Look for:
- Before: `Seq Scan` (bad for large tables)
- After: `Index Scan` or `Bitmap Index Scan` (good)

**What you will learn:**
- What a sequential scan is and why it's slow at scale
- How B-tree indexes work conceptually
- Composite index column ordering rules
- When NOT to add an index (write-heavy columns, small tables)

**Checkpoint:**
1. What does `Seq Scan` mean in `EXPLAIN ANALYZE` output?
2. What is the leftmost prefix rule for composite indexes?
3. Why do indexes slow down writes?
4. You have a composite index on `(category_id, is_active, created_at)`. Does a query filtering by `is_active` only use this index? Why or why not?
5. What is a covering index? Give an example of when it would help a product list query.
6. Your `products` table has 100 rows. Does adding an index on `category_id` help? At what table size do indexes start to matter?
7. What is the storage cost of an index? If you have 1 million product rows and add 3 indexes, roughly how does that affect storage?
8. When would PostgreSQL choose to ignore your index and do a full table scan anyway? (Hint: think about selectivity and what percentage of rows match.)

---

## Phase 9 — Query Optimization

**Goal:** Eliminate N+1 queries and audit all list endpoints for efficiency.

**What to do:**
- Enable SQLAlchemy query logging (`echo=True`) and inspect queries per endpoint
- Identify any place where you access a relationship inside a loop
- Fix with `selectinload` (for collections) or `joinedload` (for single objects)
- Ensure all list endpoints use `LIMIT` + `OFFSET` — no `.all()` without a limit

**What you will learn:**
- N+1 query detection
- `selectinload` vs `joinedload` trade-offs
- Offset pagination vs cursor pagination
- The true cost of lazy loading

**Checkpoint:**
1. How do you detect an N+1 problem without reading the code?
2. When would you choose cursor pagination over offset pagination?
3. What does `selectinload` generate at the SQL level?
4. `GET /orders?page=50&limit=20` means `OFFSET 980`. Why does this get slower as the page number increases? How does cursor pagination solve this?
5. When is `joinedload` worse than `selectinload`? What happens when you use `joinedload` on two separate one-to-many relationships at the same time?
6. What is the difference between lazy loading and eager loading in SQLAlchemy? Which does your code use by default?
7. You need to return a product list with the total count on the same endpoint. Does that require two separate DB queries, or can it be done in one?
8. What does `EXPLAIN ANALYZE` show you that `EXPLAIN` alone does not?

---

## Phase 10 — Background Workers

**Goal:** Offload slow, non-critical work out of the request/response cycle.

**What to implement:**

| Task | Trigger |
|---|---|
| Send order confirmation email | After order created |
| Release reserved stock | After order cancelled |
| Clear expired carts | Scheduled (daily) |

**Tool:** ARQ (simpler) or Celery (more features). ARQ pairs naturally with async FastAPI.

**Pattern:**
- After committing the order transaction, enqueue a job — do not await it in the request
- Worker runs in a separate process, picks up jobs from Redis queue
- If the job fails, it retries (configure max retries)

**What you will learn:**
- Why background workers exist (keep response times fast)
- Message queue basics
- At-least-once delivery and idempotency
- Separating request lifecycle from side effects

**Checkpoint:**
1. Why should sending an email happen in a background worker, not directly in the order endpoint?
2. What is idempotency and why does it matter for background tasks?
3. What happens to a background job if the worker crashes mid-execution?
4. The order transaction commits but the job fails to enqueue into Redis. The user never gets a confirmation email. How do you handle this? What design prevents silent failures?
5. Your send-email task runs, the email sends, then the task crashes before marking itself complete. The worker retries — the user gets two emails. How do you make the task idempotent?
6. What is a dead letter queue? When would you need one in this project?
7. What is the difference between ARQ and Celery in terms of concurrency model (async vs threaded)?
8. A background job needs to release reserved stock when an order is cancelled. What data does the job need, and where does it get it from?

---

## Phase 11 — Structured Logging

**Goal:** Log meaningful events in a structured, queryable format.

**What to log:**

| Event | Level |
|---|---|
| User login failure | WARNING |
| Order created | INFO |
| Insufficient stock during order | WARNING |
| Rate limit exceeded | WARNING |
| Unhandled exception | ERROR |
| Admin product change | INFO |

**Never log:** passwords, tokens, card numbers, PII beyond user ID.

**Format:** JSON structured logs. Each log line should include `timestamp`, `level`, `event`, `user_id` (if available), `request_id`.

**Checkpoint:**
1. What is the difference between structured logging and plain text logging?
2. Why should you never log a user's password even when debugging?
3. What is a correlation/request ID and why is it useful?
4. What is the difference between `DEBUG`, `INFO`, `WARNING`, `ERROR`, and `CRITICAL` log levels? Give a concrete example of each from this project.
5. An order fails at 2am. You have logs. What fields do you need in every log line to be able to trace exactly what happened for that specific request?
6. Your app logs 10,000 lines per minute. What are the risks of logging too much? What is log sampling?
7. What is the difference between application logs and access logs? Which tool typically handles access logs in production?
8. A user reports that their order was charged but never created. You have logs. Walk through how you would investigate this using log correlation.

---

## Phase 12 — Testing

**Goal:** Write tests that give you real confidence, not fake coverage.

**What to test:**

**Unit tests** (test service logic in isolation):
- `ProductService.create_product` with valid + invalid data
- Order total calculation
- Stock validation logic

**Integration tests** (test the full stack — real DB, real endpoints):
- `POST /auth/register` → creates user, returns tokens
- `GET /products` → returns paginated list
- `POST /orders` → creates order, reduces stock, clears cart
- `POST /orders` with insufficient stock → returns 400, no DB changes

**Tools:** `pytest`, `httpx.AsyncClient`, test DB (separate PostgreSQL DB for tests).

**Checkpoint:**
1. What is the difference between a unit test and an integration test?
2. Why should integration tests use a separate test database?
3. What makes a test "flaky" and how do you prevent it?
4. Your integration test creates a user, places an order, and checks the DB. After the test runs, the DB has data. How do you prevent this from polluting the next test?
5. What is the difference between a fixture and a mock? When would you use each?
6. How do you test that the order transaction rolls back correctly when stock validation fails? What do you assert on?
7. What is test coverage and why is 100% coverage not the goal?
8. You want to test that `POST /orders` returns 400 when stock is 0. What do you need to set up in the DB before calling the endpoint?
9. What is the purpose of `pytest.fixture` with `scope="session"` vs `scope="function"`? Which would you use for the DB connection and why?

---

## Phase 13 — Load Testing (Locust)

**Goal:** Simulate real user traffic, find where your app breaks, and verify that rate limiting, caching, and DB indexes actually help under load.

**What Locust does:**
Locust lets you write Python scripts that simulate hundreds or thousands of concurrent users hitting your API. It shows you response times, failure rates, and requests-per-second in real time.

**What to test:**

| Scenario | Users | What to look for |
|---|---|---|
| Browse products (`GET /products`) | 100 concurrent | Response time with + without Redis cache |
| Product detail (`GET /products/{id}`) | 200 concurrent | Cache hit rate in Redis |
| Login (`POST /auth/login`) | 50 concurrent | Rate limiter kicks in at 5/min per IP |
| Create order (`POST /orders`) | 20 concurrent | Transaction integrity, no overselling |
| Mixed realistic flow | 100 concurrent | Full user journey: browse → cart → order |

**Realistic user flow to simulate:**
```
1. Register or login
2. Browse product list (multiple pages)
3. View a product detail
4. Add to cart
5. Create order
```

**Where Locust files live:**
```
tests/
└── locust/
    ├── locustfile.py         ← main entry point
    ├── scenarios/
    │   ├── browse_products.py
    │   ├── create_order.py
    │   └── auth_flow.py
    └── README.md
```

**What you will learn:**
- How to measure throughput (requests/sec) and latency (p50, p95, p99)
- What "breaking point" looks like — when does your app start returning errors?
- How to compare before/after: add a Redis cache, re-run Locust, compare numbers
- Why p99 latency matters more than average latency
- How rate limiting behaves under real concurrent load

**Key metrics to record after each test run:**

| Metric | What it means |
|---|---|
| RPS (requests/sec) | How much traffic your app can handle |
| p50 latency | 50% of requests are faster than this |
| p95 latency | 95% of requests are faster than this — real user experience |
| p99 latency | The worst 1% — your slowest users |
| Failure rate | % of requests returning 5xx or timeout |

**Experiments to run in order:**
1. Run `GET /products` with 100 users, no cache → record p95 latency
2. Enable Redis cache → re-run → compare p95 latency
3. Run `POST /auth/login` with 50 users → confirm 429s appear after rate limit threshold
4. Run full order flow with 20 users → confirm no stock goes negative in DB
5. Gradually increase users until failure rate exceeds 1% → that is your current capacity

**Checkpoint — can you answer these?**
1. What is the difference between p95 and average latency? Which matters more and why?
2. Your `GET /products` has p95 = 800ms without cache, 12ms with cache. What does that tell you?
3. How do you confirm your rate limiter is working correctly using Locust output?
4. If 2 users concurrently order the last item in stock, what should happen? How do you verify it?
5. What does it mean when Locust shows 0% failure rate but p99 latency is 8 seconds?
6. Your app handles 200 RPS fine but at 201 RPS the failure rate jumps to 30%. What is this called and what does it tell you about your system?
7. How would you use Locust to find the exact maximum concurrent users your app can handle before the failure rate exceeds 1%?
8. During a load test, DB CPU spikes to 95% but app CPU stays at 20%. Where is the bottleneck and what do you investigate first?

---

## Phase 14 — Docker

**Goal:** Run the full stack with one command.

**Services in docker-compose:**
- `api` — FastAPI app
- `postgres` — PostgreSQL 16
- `redis` — Redis 7
- `worker` — Background worker process

**What you will learn:**
- Docker image layers and build caching
- Environment variable management
- Service dependencies (`depends_on`)
- Volume mounting for DB persistence

**Checkpoint:**
1. What is the difference between a Docker image and a container?
2. Why does order of instructions in a Dockerfile matter for build caching?
3. How do you persist PostgreSQL data across container restarts?
4. What is the difference between `CMD` and `ENTRYPOINT` in a Dockerfile?
5. Your app needs a `DATABASE_URL` environment variable. How do you pass it to the container without hardcoding it in the Dockerfile or committing it to git?
6. `depends_on: postgres` in docker-compose means the postgres container starts first. Does it guarantee PostgreSQL is ready to accept connections? What do you do if it doesn't?
7. What is the difference between a bind mount and a named volume? Which would you use for the PostgreSQL data directory and why?
8. Your Docker image is 1.2GB. What are three things you can do to reduce its size?

---

## Database Schema Summary

```
users
  id, name, email, password, role, is_active, created_at, updated_at

categories
  id, name, slug, parent_id (nullable FK → categories)

products
  id, name, slug, description, price (Numeric 10,2), stock, category_id, is_active, created_at, updated_at

carts
  id, user_id (unique FK → users), created_at, updated_at

cart_items
  id, cart_id, product_id, quantity, created_at, updated_at

orders
  id, user_id, status, total_amount, payment_status, created_at, updated_at

order_items
  id, order_id, product_id, product_name (snapshot), unit_price (snapshot), quantity, subtotal

reviews
  id, user_id, product_id, rating (1-5), comment, created_at
```

---

## Standard API Response Format

All endpoints return this shape:

**Success:**
```json
{
  "success": true,
  "message": "Product fetched successfully",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Product not found",
  "error": "NOT_FOUND",
  "data": null
}
```

> Note: Response format standardized — both `response.py` and `exceptions.py` use `"status": true/false` (boolean). Fixed in Phase 1.

---

## What "Done" Looks Like

You are done with this project when:
- [ ] All APIs work end-to-end
- [ ] Order creation is transactional (test: kill the process mid-order, check DB state)
- [ ] Rate limiting blocks abuse on login and order endpoints
- [ ] Redis caching reduces DB load on product endpoints (verify with `redis-cli`)
- [ ] `EXPLAIN ANALYZE` shows `Index Scan` on your main queries
- [ ] No N+1 queries on any list endpoint (verified via query logs)
- [ ] Background worker sends email after order without blocking the response
- [ ] All integration tests pass against a real test DB
- [ ] Locust shows measurable latency drop after enabling Redis cache
- [ ] Locust confirms rate limiter triggers at correct thresholds
- [ ] Concurrent order test confirms no stock overselling
- [ ] Full stack runs with `docker-compose up`
