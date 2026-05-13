# FastAPI Interview Topics — Level-wise

---

## Index

### [Level 1 — Junior (0–2 years)](#level-1--junior-02-years)
1. [Basics & Core Concepts](#basics--core-concepts)
2. [Pydantic & Data Validation](#pydantic--data-validation)
3. [Forms, Headers & Cookies](#forms-headers--cookies)
4. [Response Types](#response-types)
5. [Authentication Basics](#authentication-basics)
6. [Database Basics](#database-basics)
7. [Error Handling & Validation](#error-handling--validation)

### [Level 2 — Mid (2–5 years)](#level-2--mid-25-years)
8. [Dependency Injection (Deep Dive)](#dependency-injection-deep-dive)
9. [Async Programming](#async-programming)
10. [Concurrency](#concurrency)
11. [Middleware & Lifecycle](#middleware--lifecycle)
12. [Exception Handling (Advanced)](#exception-handling-advanced)
13. [Security (Advanced)](#security-advanced)
14. [Database (Advanced)](#database-advanced)
15. [Settings & Configuration](#settings--configuration)
16. [Testing](#testing)
17. [Background Tasks & Celery](#background-tasks--celery)
18. [Deployment](#deployment)

### [Level 3 — Senior / FAANG (5+ years)](#level-3--senior--faang-5-years)
19. [Architecture & Design Patterns](#architecture--design-patterns)
20. [Microservices & Resilience Patterns](#microservices--resilience-patterns)
21. [Advanced Pydantic](#advanced-pydantic)
22. [Advanced Security & OWASP](#advanced-security--owasp)
23. [Observability & Monitoring](#observability--monitoring)
24. [Performance & Optimization](#performance--optimization)
25. [AsyncIO Internals](#asyncio-internals)
26. [Multi-tenancy](#multi-tenancy)
27. [WebSockets & Streaming](#websockets--streaming)
28. [Advanced API Design](#advanced-api-design)
29. [File Handling](#file-handling)
30. [Caching Strategies](#caching-strategies)
31. [Deployment Strategies (Advanced)](#deployment-strategies-advanced)
32. [Testing Strategies (Advanced)](#testing-strategies-advanced)

---

## Level 1 — Junior (0–2 years)

### Basics & Core Concepts
- What is FastAPI and how is it different from Flask/Django?
- Path parameters vs Query parameters vs Request body
- HTTP methods — GET, POST, PUT, PATCH, DELETE
- Status codes and when to use them
- `APIRouter` — how to split routes across files
- `include_router`, tags, prefixes
- Response models and `response_model` parameter
- Path operations order (gotcha — specific before dynamic)
- `Annotated` type hints — newer FastAPI pattern
- OpenAPI docs — Swagger UI (`/docs`), ReDoc (`/redoc`)

### Pydantic & Data Validation
- What is Pydantic and why does FastAPI use it?
- BaseModel — defining fields, types
- Optional vs required fields
- Default values
- Nested models
- `field_validator` — basic usage
- `model_dump()` and `model_validate()` — Pydantic v2 methods
- Pydantic v1 vs v2 differences

### Forms, Headers & Cookies
- `Form()` — handling HTML form data
- `Header()` — reading request headers
- `Cookie()` — reading cookies
- Setting response cookies and headers
- Difference between `Form` and JSON body
- File + Form data together (`UploadFile` + `Form`)

### Response Types
- `JSONResponse` — default response
- `HTMLResponse` — returning HTML
- `RedirectResponse` — redirects
- `StreamingResponse` — streaming data
- `FileResponse` — sending files
- Custom response class — when and why
- `response_model` vs actual return type

### Authentication Basics
- API Key authentication
- Basic HTTP Auth
- What is JWT — structure (header, payload, signature)
- How to add auth to a route
- Cookie-based sessions vs JWT — tradeoffs

### Database Basics
- SQLAlchemy integration with FastAPI
- Session per request pattern
- Basic CRUD with ORM
- Alembic migrations — what and why
- `Base.metadata.create_all()` — development shortcut vs migrations

### Error Handling & Validation
- `HTTPException` — raising errors
- Custom error messages
- 404 vs 422 vs 500 differences
- Customizing 422 validation error response
- `RequestValidationError` — how to catch and reformat

---

## Level 2 — Mid (2–5 years)

### Dependency Injection (Deep Dive)
- How `Depends()` works internally
- Dependency chaining — one dependency using another
- `yield` dependencies — setup and teardown (DB sessions)
- Request-scoped vs app-scoped dependencies
- Overriding dependencies in tests
- Class-based dependencies
- `Security()` vs `Depends()` — difference in OpenAPI docs

### Async Programming
- `async def` vs `def` in FastAPI — when to use which
- What happens when you use sync code in async endpoint
- `asyncio.gather` — parallel async calls
- `run_in_executor` — running blocking code in thread pool
- Event loop blocking — common mistakes
- Async DB drivers — asyncpg, aiosqlite

### Concurrency
- GIL (Global Interpreter Lock) — what it is and impact on FastAPI
- Threads vs Processes vs Async — kab kya choose karein
- `asyncio.Lock` — race condition prevention
- `asyncio.Semaphore` — limiting concurrent access
- `asyncio.Task` — fire-and-forget background coroutines
- `asyncio.Queue` — producer-consumer pattern
- Thundering herd problem — what it is and solutions
- Worker model — how multiple Uvicorn workers handle concurrent requests
- Thread pool size — `UVICORN_WORKERS`, `max_threads` tuning

### Middleware & Lifecycle
- How middleware works — request/response flow
- Writing custom middleware
- `startup` and `shutdown` events
- Lifespan context manager (new pattern)
- CORS middleware — deep dive
- Trusted host, GZip middleware
- Middleware execution order — which runs first

### Exception Handling (Advanced)
- `@app.exception_handler` — custom global handlers
- Catching `RequestValidationError` globally
- Catching `HTTPException` globally
- Overriding default 422 response format
- Re-raising exceptions with context
- Exception propagation through middleware
- Logging exceptions with stack traces

### Security (Advanced)
- OAuth2 flow — step by step explanation
- `OAuth2PasswordBearer` — how it works
- JWT encode/decode — libraries (python-jose, PyJWT)
- Role-based access control (RBAC)
- Refresh tokens — implementation pattern
- Rate limiting — slowapi or custom middleware
- Rate limiting algorithms — token bucket vs sliding window
- CORS — what it is, why it matters, how to configure
- SQL injection prevention — ORM vs raw queries, parameterized queries

### Database (Advanced)
- Async SQLAlchemy 2.0 — session management
- N+1 query problem — what it is, how to fix
- Connection pooling — why it matters, pool size tuning
- Transaction handling — commit, rollback, savepoints
- Eager loading vs lazy loading
- Alembic deep dive — autogenerate, downgrade, multiple heads
- Read replicas — directing read vs write traffic

### Settings & Configuration
- `pydantic-settings` — `BaseSettings` class
- Loading from `.env` files
- Environment-specific configs (dev/staging/prod)
- Secret management in settings
- Nested settings / sub-models
- Singleton pattern for settings — `lru_cache`
- Validating settings at startup

### Testing
- `TestClient` from Starlette
- Async testing with `httpx.AsyncClient`
- Mocking dependencies with `app.dependency_overrides`
- Fixtures with pytest
- Testing authenticated routes
- Test database setup/teardown
- Parametrize tests — multiple input scenarios
- Testing background tasks

### Background Tasks & Celery
- `BackgroundTasks` — basic usage and limitations
- Error handling in background tasks
- Celery integration with FastAPI
- Celery task retry — `autoretry_for`, `max_retries`
- Celery Beat — scheduled/periodic tasks
- Celery task states — PENDING, STARTED, SUCCESS, FAILURE, RETRY
- When to use BackgroundTasks vs Celery
- Task queues — Redis as broker
- Monitoring Celery — Flower dashboard

### Deployment
- Uvicorn vs Gunicorn — difference and when to use
- Gunicorn + Uvicorn workers setup
- Worker count formula — `2 * CPU cores + 1`
- Dockerfile for FastAPI — multi-stage builds
- Docker Compose — FastAPI + DB + Redis together
- Environment variables and settings management
- Health check endpoints — liveness vs readiness
- Graceful shutdown handling

---

## Level 3 — Senior / FAANG (5+ years)

### Architecture & Design Patterns
- Hexagonal (Ports & Adapters) architecture with FastAPI
- Repository pattern — separating DB logic from business logic
- Service layer pattern
- CQRS — Command Query Responsibility Segregation
- Event sourcing — storing events instead of state, replay concept
- Event-driven architecture — Kafka/RabbitMQ with FastAPI
- Domain-driven design (DDD) concepts
- Strangler fig pattern — migrating monolith to microservices

### Microservices & Resilience Patterns
- FastAPI as a microservice
- Inter-service communication — httpx, gRPC
- Circuit breaker pattern — 3 states (Closed, Open, Half-Open)
- Bulkhead pattern — isolating failures
- Retry with exponential backoff — `tenacity` library
- Service discovery
- API Gateway pattern
- Saga pattern — choreography vs orchestration
- Idempotency in microservices — at-least-once delivery handling

### Advanced Pydantic
- Custom types and validators
- Discriminated unions — polymorphic models
- Generic models
- JSON Schema customization
- `model_config` deep dive
- Alias, exclude, include in serialization
- `computed_field` — derived fields
- Pydantic with FastAPI — serialization performance tips

### Advanced Security & OWASP
- OWASP Top 10 API Security risks
  - Broken Object Level Authorization (BOLA/IDOR)
  - Broken Authentication
  - Excessive Data Exposure
  - Mass Assignment vulnerability
  - Security Misconfiguration
- CSRF protection strategies
- Request signing — HMAC
- Secrets management — HashiCorp Vault, AWS Secrets Manager
- Zero trust architecture concepts
- Security headers — CSP, HSTS, X-Frame-Options
- SQL injection — how ORM protects, when raw queries are dangerous
- Input sanitization vs validation

### Observability & Monitoring
- Structured logging — structlog with FastAPI
- Distributed tracing — OpenTelemetry integration
- Metrics — Prometheus + Grafana
- Correlation IDs across services
- Error tracking — Sentry integration
- Log aggregation — ELK stack
- SLI, SLO, SLA — definitions and how to measure
- Alerting strategies — when to page vs warn

### Performance & Optimization
- Profiling FastAPI apps — py-spy, cProfile
- Response caching — Redis, Cache-Control headers, ETags
- Connection pooling optimization
- Database query optimization — EXPLAIN ANALYZE
- Horizontal scaling strategies
- Load balancing — nginx, HAProxy
- Memory profiling — tracemalloc, memory_profiler
- Common memory leaks in FastAPI — circular references, unclosed connections

### AsyncIO Internals
- Event loop — how it works internally
- Coroutines vs Tasks vs Futures — differences
- `asyncio.create_task()` — concurrent background tasks
- `asyncio.wait()` vs `asyncio.gather()` — differences
- `asyncio.Semaphore` — concurrency limiting in async
- `asyncio.timeout()` — setting timeouts on coroutines
- Debugging async code — `asyncio.get_event_loop().set_debug(True)`
- `uvloop` — faster event loop for production

### Multi-tenancy
- Schema-based multi-tenancy — separate schema per tenant
- Row-based multi-tenancy — `tenant_id` column
- Connection routing per tenant
- Middleware for tenant resolution (subdomain, header, JWT claim)
- Alembic with multi-tenant schemas
- Data isolation guarantees

### WebSockets & Streaming
- WebSocket connection lifecycle
- Connection manager pattern — rooms/channels
- Reconnection handling
- Server-Sent Events (SSE) vs WebSockets — tradeoffs
- Streaming large responses — `StreamingResponse`
- Backpressure in streaming — what and why

### Advanced API Design
- API versioning strategies — URL vs Header vs Query param
- Pagination patterns — cursor vs offset
- OpenAPI schema customization
- Spec-first API design — design contract before code
- GraphQL with FastAPI (Strawberry) — N+1 problem, DataLoader
- gRPC + FastAPI — proto files, streaming types
- Idempotency keys
- Content negotiation — `Accept` header handling
- HATEOAS — hypermedia APIs

### File Handling
- File upload — `UploadFile`
- Streaming large file downloads
- Multipart form data
- S3 integration for file storage
- Chunked upload for large files
- File validation — type, size limits

### Caching Strategies
- Redis integration — sync vs async (aioredis)
- Cache invalidation patterns
- Cache-aside vs write-through vs write-behind
- Distributed caching in microservices
- Cache stampede / thundering herd — prevention with locks
- TTL strategies — when to expire

### Deployment Strategies (Advanced)
- Kubernetes basics — Pods, Services, Deployments, Ingress
- Horizontal Pod Autoscaler (HPA)
- Blue-green deployment — zero downtime releases
- Canary releases — gradual traffic shifting
- Rolling updates — k8s default strategy
- Feature flags — gradual feature rollout
- Database migrations in production — zero downtime strategies

### Testing Strategies (Advanced)
- Load testing — Locust, k6
- Performance benchmarking — baseline metrics
- Contract testing — Pact framework
- Mutation testing — verify test quality
- Chaos engineering basics — fault injection
- End-to-end testing in CI/CD
- Test pyramid — unit vs integration vs e2e ratio

---

## Quick Reference — Level Summary

| Topic | Junior | Mid | Senior |
|-------|--------|-----|--------|
| Routing & Basics | Deep | Know | Know |
| Pydantic | Basic | Advanced | Expert |
| Forms/Headers/Cookies | Basic | Advanced | Know |
| Response Types | Know | Deep | Know |
| Auth | Basic JWT | OAuth2 + RBAC | Zero Trust + OWASP |
| Database | Basic CRUD | Async + Pooling | Distributed TX + Sharding |
| Async | Concept | Internals | Event Loop Mastery |
| Concurrency | — | GIL + Lock/Semaphore | AsyncIO Internals |
| DI | Basic | Advanced Patterns | Architecture |
| Exception Handling | Basic | Global Handlers | Full Strategy |
| Settings | .env basics | pydantic-settings | Vault + Secrets |
| Testing | TestClient | Mocking + Async | Load + Contract |
| Architecture | MVC | Layers | DDD + Hexagonal |
| Observability | Logs | Metrics | Distributed Tracing + SLO |
| Deployment | Docker | Gunicorn + Compose | Kubernetes + Blue-Green |
| Security | JWT | Rate Limiting | OWASP + Zero Trust |
