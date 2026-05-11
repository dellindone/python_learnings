# Complete FastAPI Shopping App System Design

# 1. Introduction

This project is a production-style backend system for a shopping portal built using:

- Python
- FastAPI
- PostgreSQL
- Redis
- SQLAlchemy Async
- Docker
- Alembic
- JWT Authentication
- Celery/Background Workers

The goal of this project is to deeply learn:

- API design
- Onion architecture
- Rate limiting
- Redis caching
- Database optimization
- Transactions
- Background workers
- Authentication
- Logging
- Testing
- Scaling concepts

---

# 2. Functional Requirements

## User Features

- Register
- Login
- Logout
- Update profile
- Browse products
- Search products
- Add to cart
- Remove from cart
- Create order
- View order history
- Add reviews

## Admin Features

- Create product
- Update product
- Delete product
- Manage inventory
- View orders
- Manage categories

---

# 3. Non-Functional Requirements

- High availability
- Scalable APIs
- Secure authentication
- Rate limiting
- Optimized queries
- Redis caching
- Structured logging
- Transaction-safe order flow
- Background task support

---

# 4. High-Level Architecture

```text
                    ┌──────────────┐
                    │   Frontend   │
                    └──────┬───────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │ FastAPI Backend  │
                 └────────┬─────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
 ┌────────────┐   ┌──────────────┐   ┌─────────────┐
 │ PostgreSQL │   │    Redis     │   │ Background  │
 │ Database   │   │ Cache/Rate   │   │ Workers     │
 └────────────┘   └──────────────┘   └─────────────┘
```

---

# 5. Onion Architecture

```text
api/controllers
        ↓
application/use_cases
        ↓
domain/services/entities
        ↓
infrastructure/repositories/db/cache
```

Dependency direction always points inward.

Domain layer should never depend on FastAPI or SQLAlchemy.

---

# 6. Recommended Folder Structure

```text
app/
│
├── main.py
│
├── api/
│   └── v1/
│       ├── auth_controller.py
│       ├── user_controller.py
│       ├── product_controller.py
│       ├── cart_controller.py
│       ├── order_controller.py
│       └── admin_controller.py
│
├── application/
│   ├── auth/
│   │   ├── login_user.py
│   │   └── register_user.py
│   │
│   ├── users/
│   │   ├── update_profile.py
│   │   └── get_profile.py
│   │
│   ├── products/
│   │   ├── list_products.py
│   │   ├── search_products.py
│   │   └── get_product.py
│   │
│   ├── cart/
│   │   ├── add_to_cart.py
│   │   ├── remove_from_cart.py
│   │   └── get_cart.py
│   │
│   └── orders/
│       ├── create_order.py
│       └── cancel_order.py
│
├── domain/
│   ├── entities/
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   └── order.py
│   │
│   ├── services/
│   │   ├── pricing_service.py
│   │   ├── inventory_service.py
│   │   └── order_service.py
│   │
│   ├── repositories/
│   │   ├── user_repository.py
│   │   ├── product_repository.py
│   │   └── order_repository.py
│   │
│   └── exceptions.py
│
├── infrastructure/
│   ├── db/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── base.py
│   │   └── session.py
│   │
│   ├── cache/
│   │   └── redis_cache.py
│   │
│   ├── rate_limit/
│   │   └── redis_rate_limiter.py
│   │
│   ├── security/
│   │   ├── jwt.py
│   │   └── password.py
│   │
│   └── workers/
│       └── tasks.py
│
├── schemas/
│   ├── auth_schema.py
│   ├── user_schema.py
│   ├── product_schema.py
│   ├── cart_schema.py
│   └── order_schema.py
│
├── core/
│   ├── config.py
│   ├── dependencies.py
│   ├── exceptions.py
│   ├── logging.py
│   └── responses.py
│
├── tests/
│
└── migrations/
```

---

# 7. Database Design

# users

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

# categories

```sql
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id BIGINT REFERENCES categories(id)
);
```

# products

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    stock INTEGER NOT NULL,
    category_id BIGINT REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

# carts

```sql
CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

# cart_items

```sql
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT REFERENCES carts(id),
    product_id BIGINT REFERENCES products(id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

# orders

```sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

# order_items

```sql
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id),
    product_id BIGINT REFERENCES products(id),
    product_name VARCHAR(255),
    unit_price NUMERIC(10,2),
    quantity INTEGER,
    subtotal NUMERIC(10,2)
);
```

# reviews

```sql
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    product_id BIGINT REFERENCES products(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

# 8. Database Indexing

## Email Lookup

```sql
CREATE INDEX idx_users_email ON users(email);
```

## Product Listing

```sql
CREATE INDEX idx_products_category_created
ON products(category_id, created_at DESC);
```

## Orders By User

```sql
CREATE INDEX idx_orders_user_created
ON orders(user_id, created_at DESC);
```

## Cart Lookup

```sql
CREATE INDEX idx_cart_items_cart_product
ON cart_items(cart_id, product_id);
```

---

# 9. Authentication Design

Use JWT Authentication.

## Login Flow

```text
Client → Login API
       → Verify password
       → Generate JWT
       → Return token
```

## JWT Payload

```json
{
  "user_id": 1,
  "role": "user",
  "exp": 9999999999
}
```

---

# 10. Password Hashing

Use bcrypt.

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"])


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str):
    return pwd_context.verify(password, hashed)
```

---

# 11. API Design

# Auth APIs

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
```

# Product APIs

```http
GET /api/v1/products
GET /api/v1/products/{id}
GET /api/v1/products/search
```

# Cart APIs

```http
GET /api/v1/cart
POST /api/v1/cart/items
DELETE /api/v1/cart/items/{id}
```

# Order APIs

```http
POST /api/v1/orders
GET /api/v1/orders
GET /api/v1/orders/{id}
```

---

# 12. Request and Response Schemas

## Create Product Request

```python
from pydantic import BaseModel
from decimal import Decimal


class ProductCreateRequest(BaseModel):
    name: str
    description: str
    price: Decimal
    stock: int
    category_id: int
```

## Product Response

```python
class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: Decimal
    stock: int
```

---

# 13. Standard API Responses

## Success Response

```json
{
  "success": true,
  "message": "Product fetched successfully",
  "data": {}
}
```

## Error Response

```json
{
  "success": false,
  "message": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

---

# 14. Controller Layer

Controller only handles HTTP.

Example:

```python
@router.post("/products")
async def create_product(
    data: ProductCreateRequest,
    service: ProductService = Depends(get_product_service)
):
    product = await service.create_product(data)

    return success(
        data=ProductResponse.model_validate(product),
        message="Product created"
    )
```

Controller should NOT:

- write SQL
- calculate pricing
- update stock
- handle cache logic

---

# 15. Service Layer

Business logic belongs here.

```python
class ProductService:

    async def create_product(self, data):
        product = Product(**data.model_dump())

        return await self.repository.create(product)
```

---

# 16. Repository Layer

Database logic belongs here.

```python
class ProductRepository:

    async def get_by_id(self, product_id: int):
        stmt = select(Product).where(Product.id == product_id)

        result = await self.db.execute(stmt)

        return result.scalar_one_or_none()
```

---

# 17. Global Exception Handling

## Custom Exceptions

```python
class ProductNotFound(Exception):
    pass


class InsufficientStock(Exception):
    pass
```

## Global Handlers

```python
@app.exception_handler(ProductNotFound)
async def product_not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "message": "Product not found",
            "code": "PRODUCT_NOT_FOUND"
        }
    )
```

---

# 18. Order Creation Flow

```text
Client
  ↓
POST /orders
  ↓
Controller
  ↓
UseCase
  ↓
Validate Cart
  ↓
Check Inventory
  ↓
Calculate Total
  ↓
Start Transaction
  ↓
Create Order
  ↓
Create Order Items
  ↓
Reduce Stock
  ↓
Clear Cart
  ↓
Commit Transaction
  ↓
Publish Background Job
  ↓
Return Response
```

---

# 19. Transactions

Critical operations must use transactions.

```python
async with db.begin():
    order = await create_order()
    await create_order_items()
    await reduce_stock()
```

If any step fails:

```text
ROLLBACK
```

---

# 20. Redis Caching

## What To Cache

- product detail
- product list
- categories
- search results

## What NOT To Cache

- cart
- orders
- payments

## Cache Keys

```text
product:1
products:list:page=1
search:iphone:page=1
categories:all
```

## Example Cache Logic

```python
cache_key = f"product:{product_id}"

cached = await redis.get(cache_key)

if cached:
    return json.loads(cached)

product = await repository.get_by_id(product_id)

await redis.set(cache_key, json.dumps(product), ex=300)
```

---

# 21. Cache Invalidation

When product updates:

```python
await redis.delete(f"product:{product_id}")
```

Also invalidate:

```text
products:list:*
search:*
```

---

# 22. Rate Limiting

Use Redis-based rate limiting.

## Limits

```text
Login: 5/minute
Search: 30/minute
Orders: 3/minute
```

## Redis Keys

```text
rate:login:ip:1.1.1.1
rate:search:user:10
```

## Simple Implementation

```python
count = await redis.incr(key)

if count == 1:
    await redis.expire(key, 60)

if count > limit:
    raise RateLimitExceeded()
```

---

# 23. Pagination

## Offset Pagination

```http
GET /products?page=1&limit=20
```

## Query

```sql
SELECT *
FROM products
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

## Cursor Pagination

Better for large tables.

```http
GET /products?cursor=123
```

---

# 24. N+1 Query Problem

Bad:

```python
for order in orders:
    print(order.user.name)
```

This creates many queries.

Fix using:

```python
selectinload()
joinedload()
```

---

# 25. Query Optimization

Use:

```sql
EXPLAIN ANALYZE
SELECT * FROM products;
```

Learn:

- sequential scan
- index scan
- bitmap heap scan

---

# 26. Full-Text Search

Use PostgreSQL GIN indexes.

```sql
CREATE INDEX idx_products_search
ON products
USING GIN(to_tsvector('english', name || ' ' || description));
```

Search query:

```sql
SELECT *
FROM products
WHERE to_tsvector('english', name || ' ' || description)
@@ plainto_tsquery('iphone');
```

---

# 27. Logging

Log:

- login failures
- order creation
- payment failures
- rate limit exceeded
- admin changes

Do NOT log:

- passwords
- tokens
- card details

Example:

```python
logger.info(
    "Order created",
    extra={"user_id": user.id, "order_id": order.id}
)
```

---

# 28. Background Workers

Use:

- Celery
- Redis Queue
- ARQ

Tasks:

- send email
- sales reports
- analytics
- stock release

Example:

```python
@celery.task
async def send_order_email(order_id):
    pass
```

---

# 29. Docker Setup

## docker-compose.yml

```yaml
version: '3.9'

services:
  api:
    build: .
    ports:
      - "8000:8000"

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

  redis:
    image: redis:7
```

---

# 30. Testing Strategy

## Unit Tests

Test:

- services
- pricing logic
- validation

## Integration Tests

Test:

- APIs
- DB operations
- auth

## Example

```python
async def test_get_product(client):
    response = await client.get("/products/1")

    assert response.status_code == 200
```

---

# 31. Security Best Practices

- Hash passwords
- Validate JWT
- Use HTTPS
- Add rate limiting
- Validate inputs
- Prevent SQL injection
- Prevent mass assignment
- Restrict admin routes

---

# 32. Scaling Ideas

Later improvements:

- API Gateway
- Load balancer
- Read replicas
- CDN
- Elasticsearch
- Kafka
- Microservices

---

# 33. Learning Roadmap

## Phase 1

- FastAPI basics
- CRUD APIs
- PostgreSQL

## Phase 2

- JWT auth
- Onion architecture
- Repository pattern

## Phase 3

- Transactions
- Error handling
- Logging

## Phase 4

- Redis caching
- Rate limiting
- Query optimization

## Phase 5

- Background workers
- Docker
- Testing
- CI/CD

---

# 34. Final Project Outcome

After completing this project you will understand:

- Real API design
- Production architecture
- Redis usage
- DB optimization
- Transactions
- Authentication
- Scalable backend concepts
- Clean code architecture
- Async backend development
- Performance optimization

