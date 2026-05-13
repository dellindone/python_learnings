# Shopping App System Design

## 1. Core Features

-   User registration/login
-   Product listing/search
-   Product details
-   Cart management
-   Order creation
-   Payment mock flow
-   Order history
-   Admin product management
-   Reviews/ratings

## 2. High-Level Architecture

``` text
Client
  ↓
API Gateway / FastAPI App
  ↓
Controllers / Routes
  ↓
Application Use Cases
  ↓
Domain Services
  ↓
Repositories
  ↓
PostgreSQL

FastAPI App
  ↓
Redis
  ↓
Rate Limiting / Caching / Sessions

FastAPI App
  ↓
Background Worker
  ↓
Email / Order Events / Stock Updates
```

## 3. Recommended Folder Structure

``` text
app/
│
├── main.py
├── api/
├── application/
├── domain/
├── infrastructure/
├── schemas/
├── core/
└── tests/
```

## 4. Database Design

Tables:

-   users
-   products
-   categories
-   carts
-   cart_items
-   orders
-   order_items
-   payments
-   reviews

## 5. Important APIs

### Auth

-   POST /api/v1/auth/register
-   POST /api/v1/auth/login
-   POST /api/v1/auth/logout
-   GET /api/v1/users/me
-   PATCH /api/v1/users/me

### Products

-   GET /api/v1/products
-   GET /api/v1/products/{product_id}
-   GET /api/v1/categories
-   POST /api/v1/admin/products
-   PATCH /api/v1/admin/products/{product_id}
-   DELETE /api/v1/admin/products/{product_id}

### Cart

-   GET /api/v1/cart
-   POST /api/v1/cart/items
-   PATCH /api/v1/cart/items/{item_id}
-   DELETE /api/v1/cart/items/{item_id}

### Orders

-   POST /api/v1/orders
-   GET /api/v1/orders
-   GET /api/v1/orders/{order_id}
-   POST /api/v1/orders/{order_id}/cancel

## 6. Create Order Flow

``` text
Client → POST /orders → Controller → UseCase → Validate cart
→ Check stock → Calculate price → Start transaction
→ Create order → Create order_items → Reduce stock
→ Clear cart → Commit → Publish task → Return response
```

## 7. Caching Design

Cache: - product details - product list pages - categories - popular
products - search result pages

Do not cache: - cart - orders - payments - private profile data

## 8. Rate Limiting

Examples: - Login: 5/minute per IP/email - Register: 3/minute per IP -
Product list: 60/minute per user/IP - Search: 30/minute per user/IP -
Create order: 3/minute per user

## 9. DB Optimization

Learn: - indexes - composite indexes - full-text search - pagination -
query plans (EXPLAIN ANALYZE) - avoid N+1 queries

## 10. Error Handling

Use custom exceptions + global handlers.

Example response:

``` json
{
  "success": false,
  "message": "Insufficient stock",
  "code": "INSUFFICIENT_STOCK"
}
```

## 11. Standard API Response

Success:

``` json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

## 12. Background Jobs

-   send order confirmation email
-   clear expired carts
-   generate reports
-   release reserved stock

## 13. Learning Order

1.  Auth
2.  Products
3.  Cart
4.  Orders
5.  Transactions
6.  Global error handling
7.  Rate limiting
8.  Redis caching
9.  DB indexing
10. Query optimization
11. Background workers
12. Tests
13. Dockerize
