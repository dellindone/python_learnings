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
│   ├── products/          ← Phase 2
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
| 2 | Products + Categories CRUD | 🔲 Next |
| 2 | Admin product management | 🔲 |
| 2 | Pagination + filtering | 🔲 |
| 3 | Cart management | 🔲 |
| 4 | Orders + Transactions | 🔲 |
| 5 | Global error handling (review + harden) | 🔲 |
| 6 | Rate limiting (Redis) | 🔲 |
| 7 | Redis caching (products, categories) | 🔲 |
| 8 | DB indexing + EXPLAIN ANALYZE | 🔲 |
| 9 | Query optimization (N+1, pagination) | 🔲 |
| 10 | Background workers (email, stock release) | 🔲 |
| 11 | Structured logging | 🔲 |
| 12 | Testing (unit + integration) | 🔲 |
| 13 | Docker + docker-compose | 🔲 |

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

---

## Phase 13 — Docker

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

> Note: Your current `response.py` uses `"status": "True"` (a string) instead of `"success": true` (a boolean). Decide on one format and standardize it across the project before Phase 2.

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
- [ ] Full stack runs with `docker-compose up`
