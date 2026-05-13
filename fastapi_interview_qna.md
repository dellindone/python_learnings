# FastAPI Interview Questions & Answers — Level-wise

---

# Level 1 — Junior (0–2 years)

## Basics & Core Concepts

**Q1. FastAPI kya hai aur Flask/Django se kaise alag hai?**

FastAPI ek modern Python web framework hai jo high performance APIs banane ke liye use hota hai. Yeh ASGI-based hai aur async ko natively support karta hai.

| Feature | FastAPI | Flask | Django |
|---------|---------|-------|--------|
| Async support | Native | Plugin se | Partial |
| Auto docs | Yes (Swagger) | No | No |
| Type hints | Core feature | Optional | Optional |
| Speed | Very fast | Moderate | Moderate |
| Use case | APIs | APIs + Web | Full-stack |

---

**Q2. Path parameter, Query parameter, aur Request body mein kya farak hai?**

- **Path parameter** — URL ka part hota hai: `/users/{user_id}`
- **Query parameter** — URL ke baad `?` se aata hai: `/users?page=1&limit=10`
- **Request body** — HTTP body mein JSON data aata hai, usually POST/PUT mein

---

**Q3. Status codes — kab kaunsa use karein?**

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET |
| 201 | Created | Successful POST |
| 204 | No Content | DELETE success |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Logged in but no permission |
| 404 | Not Found | Resource nahi mila |
| 422 | Unprocessable Entity | Validation error (FastAPI default) |
| 500 | Internal Server Error | Server side bug |

---

**Q4. Path operations ka order kyun matter karta hai?**

FastAPI routes ko upar se neeche match karta hai. Agar dynamic route pehle ho, toh specific route kabhi match nahi hoga.

```
/users/me   ← yeh kabhi nahi chalega
/users/{id} ← yeh pehle match ho jayega "me" ko bhi
```

Sahi order:
```
/users/me   ← pehle specific
/users/{id} ← phir dynamic
```

---

## Pydantic & Data Validation

**Q5. Pydantic kya hai aur FastAPI isko kyun use karta hai?**

Pydantic Python ki data validation library hai. FastAPI isko use karta hai kyunki:
- Request data ko automatically validate karta hai
- Type hints se schema generate karta hai
- Auto documentation ke liye OpenAPI schema banata hai
- Serialization/deserialization handle karta hai

---

**Q6. Optional field kaise define karein?**

```python
from typing import Optional
from pydantic import BaseModel

class User(BaseModel):
    name: str           # required
    email: str          # required
    age: Optional[int] = None   # optional
```

---

**Q7. `field_validator` kab use karte hain?**

Jab custom validation logic chahiye ho — jaise email format check, password strength, etc.

```python
from pydantic import BaseModel, field_validator

class User(BaseModel):
    email: str

    @field_validator('email')
    def email_must_have_at(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email')
        return v
```

---

## Authentication Basics

**Q8. JWT kya hota hai? Structure explain karo.**

JWT (JSON Web Token) teen parts ka hota hai, dot se separate:

```
header.payload.signature
```

- **Header** — algorithm type (HS256)
- **Payload** — user data (user_id, role, expiry)
- **Signature** — header + payload ko secret key se sign kiya

JWT stateless hota hai — server ko session store nahi karna padta.

---

## Database Basics

**Q9. Session per request pattern kya hota hai?**

Har HTTP request ke liye ek naya DB session khulta hai aur request khatam hone par band ho jaata hai. Yeh `yield` dependency se implement hota hai.

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

**Q10. 404 vs 422 vs 500 mein kya farak hai?**

- **404** — Resource hi nahi mila (user ID exist nahi karta)
- **422** — Resource mila, lekin data galat format mein hai (Pydantic validation fail)
- **500** — Server ka bug — kuch unexpected crash hua

---

# Level 2 — Mid (2–5 years)

## Dependency Injection

**Q11. `Depends()` internally kaise kaam karta hai?**

FastAPI route execute hone se pehle saari dependencies resolve karta hai. Yeh ek tree banata hai aur leaf nodes pehle execute hote hain.

1. FastAPI route signature scan karta hai
2. `Depends()` dekha toh pehle wo function call karta hai
3. Result ko route function mein inject karta hai
4. Agar `yield` hai toh cleanup baad mein hoti hai

---

**Q12. Dependency chaining kya hoti hai?**

Ek dependency doosri dependency pe depend kar sakti hai.

```python
def get_db():
    yield db

def get_current_user(db = Depends(get_db)):
    # db already resolved hai
    return user

@app.get("/profile")
def profile(user = Depends(get_current_user)):
    return user
```

---

**Q13. Test mein dependency override kaise karte hain?**

```python
def override_get_db():
    yield test_db

app.dependency_overrides[get_db] = override_get_db

# Test ke baad clear karo
app.dependency_overrides.clear()
```

---

## Async Programming

**Q14. `async def` vs `def` — kab kaunsa use karein?**

| | `async def` | `def` |
|--|-------------|-------|
| DB calls (async driver) | Yes | No |
| External API calls (httpx) | Yes | No |
| CPU-heavy work | No | Yes (thread pool mein) |
| Sync library use | No | Yes |

Sync `def` ko FastAPI automatically thread pool mein run karta hai taaki event loop block na ho.

---

**Q15. Event loop blocking kya hota hai aur kaise avoid karein?**

Jab async endpoint mein blocking/sync code directly run hota hai toh poora server us ek request ke liye ruk jaata hai — baaki sab wait karte hain.

**Galat:**
```python
async def get_data():
    time.sleep(5)  # event loop block!
```

**Sahi:**
```python
import asyncio

async def get_data():
    await asyncio.sleep(5)  # non-blocking
```

Sync library use karni ho toh:
```python
loop = asyncio.get_event_loop()
result = await loop.run_in_executor(None, blocking_function)
```

---

**Q16. `asyncio.gather` kya karta hai?**

Multiple async operations ko parallel mein run karta hai — ek ke khatam hone ka wait nahi karna.

```python
results = await asyncio.gather(
    fetch_user(user_id),
    fetch_orders(user_id),
    fetch_notifications(user_id)
)
```

Teen separate DB calls ek saath chalenge — total time max(3) instead of sum(3).

---

## Middleware & Lifecycle

**Q17. Middleware kaise kaam karta hai?**

Middleware request aur response ke beech mein hota hai — har request se pehle aur har response ke baad chalta hai.

```
Request → Middleware 1 → Middleware 2 → Route Handler
Response ← Middleware 1 ← Middleware 2 ← Route Handler
```

Use cases: logging, auth check, CORS headers, request timing.

---

**Q18. Lifespan kya hota hai aur kyun use karte hain?**

App startup aur shutdown pe ek baar kuch run karna ho (DB connection pool banana, ML model load karna) toh lifespan use karte hain.

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_db_pool()
    yield
    # Shutdown
    await close_db_pool()

app = FastAPI(lifespan=lifespan)
```

---

## Security

**Q19. OAuth2 flow step-by-step explain karo.**

1. User apna username/password bhejta hai `/token` endpoint pe
2. Server verify karta hai credentials
3. Server JWT token banata hai aur return karta hai
4. Client har request mein `Authorization: Bearer <token>` header bhejta hai
5. Server token verify karta hai aur user identify karta hai

---

**Q20. RBAC (Role-Based Access Control) kaise implement karte hain FastAPI mein?**

1. JWT payload mein role store karo (`admin`, `user`, `moderator`)
2. Token decode karte waqt role extract karo
3. Route level pe role check karo dependency ke through

```python
def require_admin(current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user
```

---

## Database

**Q21. N+1 query problem kya hota hai?**

Ek query se list aati hai, phir har item ke liye alag query chalti hai.

**Problem:** 1 user list query + 100 order queries = 101 queries

**Solution:** JOIN ya eager loading use karo — ek hi query mein sab laao.

```python
# SQLAlchemy eager loading
users = db.query(User).options(joinedload(User.orders)).all()
```

---

**Q22. Connection pooling kyun important hai?**

Har request pe naya DB connection banana expensive hai. Pool mein connections pre-created hote hain aur reuse hote hain.

- **Without pool:** 100 requests = 100 new connections (slow, DB overload)
- **With pool:** 100 requests = 10 connections shared (fast, efficient)

---

## Testing

**Q23. FastAPI mein dependency mock kaise karte hain?**

```python
from fastapi.testclient import TestClient

def fake_current_user():
    return User(id=1, name="Test User", role="admin")

app.dependency_overrides[get_current_user] = fake_current_user
client = TestClient(app)

response = client.get("/profile")
```

---

**Q24. Async endpoints test kaise karte hain?**

```python
import pytest
import httpx
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_users():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/users")
    assert response.status_code == 200
```

---

## Deployment

**Q25. Uvicorn vs Gunicorn — kya farak hai?**

- **Uvicorn** — ASGI server, single process, async support, development ke liye
- **Gunicorn** — WSGI process manager, multiple worker processes manage karta hai
- **Production** mein dono saath use karte hain:

```
Gunicorn (process manager) → Uvicorn workers (ASGI)
```

```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

`-w 4` matlab 4 worker processes — CPU cores ke hisaab se set karo.

---

# Level 3 — Senior / FAANG (5+ years)

## Architecture & Design Patterns

**Q26. Repository pattern kya hota hai aur FastAPI mein kyun use karein?**

Repository pattern DB logic ko business logic se alag karta hai.

```
Route → Service → Repository → Database
```

**Fayde:**
- DB easily swap kar sakte hain (PostgreSQL → MongoDB)
- Business logic test karna easy — DB mock karo
- Code readable aur maintainable

---

**Q27. CQRS kya hota hai?**

Command Query Responsibility Segregation — read aur write operations ko alag models/paths mein separate karna.

- **Command** — data change karta hai (create, update, delete)
- **Query** — sirf data read karta hai

**Kyun?** Read aur write ke patterns alag hote hain. Write pe strong consistency chahiye, read pe performance. Alag optimize kar sakte ho.

---

**Q28. Hexagonal Architecture FastAPI mein kaise apply hoti hai?**

```
External World (HTTP, DB, Queue)
        ↓
    Adapters (FastAPI routes, SQLAlchemy repos)
        ↓
    Ports (Interfaces/ABCs)
        ↓
    Core Domain (Business Logic — pure Python, no framework)
```

Core domain FastAPI ya DB ko bilkul nahi jaanta. Sab kuch adapters handle karte hain. Isse framework change karna easy ho jaata hai.

---

## Microservices

**Q29. Circuit breaker pattern kya hota hai?**

Jab ek service down ho, toh baaki services bhi us pe continuously requests bhejti hain aur fail hoti hain. Circuit breaker yeh rokata hai.

**3 states:**
- **Closed** — Normal, sab requests jaati hain
- **Open** — Service down, requests immediately fail (no waiting)
- **Half-Open** — Thodi requests jaati hain check karne ke liye

Library: `circuitbreaker` ya `tenacity` Python mein.

---

**Q30. Saga pattern kya hota hai distributed transactions ke liye?**

Microservices mein ek single DB transaction nahi hoti. Saga ek sequence of local transactions hai — agar koi fail ho toh compensating transactions chalti hain (undo karna).

**Example:** Order place karna
1. Order create karo
2. Payment deduct karo
3. Inventory update karo
4. ← Agar step 3 fail ho toh step 2 ko reverse karo (refund)

---

## Observability

**Q31. Distributed tracing kya hota hai aur kyun important hai?**

Microservices mein ek user request multiple services se guzarti hai. Tracing se pata chalta hai request kahan kitna time laga aur kahan fail hua.

**Tools:** OpenTelemetry + Jaeger/Zipkin

Har request ko ek unique `trace_id` milta hai jo sab services mein propagate hota hai.

---

**Q32. Structured logging kya hota hai?**

Plain text logs ke bajaye JSON format mein logs — easily searchable aur parseable.

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "service": "order-service",
  "trace_id": "abc123",
  "user_id": 42,
  "message": "Payment failed",
  "error": "insufficient_funds"
}
```

**Library:** `structlog` Python mein.

---

## Performance

**Q33. FastAPI app ko kaise profile karein?**

```python
# py-spy — production safe, no code change
py-spy top --pid <process_id>

# cProfile — development mein
python -m cProfile -o output.prof main.py
```

Profiling se pata chalta hai kaunsa function sabse zyada time le raha hai.

---

**Q34. Cache-aside pattern kya hota hai?**

1. Request aaye — pehle cache check karo (Redis)
2. Cache hit — directly return karo
3. Cache miss — DB se fetch karo, cache mein store karo, return karo

```
Request → Redis (hit?) → Yes: return
                       → No: DB fetch → Redis store → return
```

---

## Advanced API Design

**Q35. API versioning ke strategies kya hain? Kaunsi best hai?**

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| URL versioning | `/v1/users` | Simple, visible | URL change hoti hai |
| Header versioning | `API-Version: 1` | Clean URLs | Less visible |
| Query param | `/users?version=1` | Easy testing | Messy URLs |

**Best practice:** URL versioning (`/v1/`, `/v2/`) — most explicit aur cacheable.

---

**Q36. Cursor-based pagination vs Offset pagination — kab kya use karein?**

**Offset:** `SELECT * FROM users LIMIT 10 OFFSET 100`
- Simple lekin slow on large datasets
- Page skip ho sakta hai agar data insert/delete ho

**Cursor:** `SELECT * FROM users WHERE id > last_seen_id LIMIT 10`
- Fast even on millions of rows
- Consistent — real-time data mein bhi sahi kaam karta hai
- Social feeds, infinite scroll ke liye best

---

**Q37. Idempotency key kya hota hai aur kyun important hai?**

Agar network issue se client same request dobara bheje (payment, order) toh duplicate operations ho sakte hain.

Idempotency key ek unique ID hai jo client request ke saath bhejta hai. Server agar same key dobara dekhe toh cached response return karta hai — duplicate operation nahi karta.

**Header:** `Idempotency-Key: uuid-here`

---

## WebSockets

**Q38. WebSocket connection manager pattern kya hota hai?**

Multiple clients ko manage karne ke liye ek centralized manager class banate hain.

```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active_connections.remove(ws)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)
```

---

**Q39. SSE vs WebSockets — kab kya use karein?**

| | WebSocket | SSE |
|--|-----------|-----|
| Direction | Bidirectional | Server → Client only |
| Protocol | ws:// | HTTP |
| Use case | Chat, games | Live feeds, notifications |
| Complexity | High | Low |
| Browser support | All | All (IE except) |

**Rule:** Sirf server se data aana ho toh SSE. Client bhi data bheje toh WebSocket.

---

## Advanced Security

**Q40. HMAC request signing kya hota hai?**

Client apni request ke body + timestamp ko secret key se sign karke header mein bhejta hai. Server same sign karta hai aur compare karta hai.

**Fayde:**
- Request tamper nahi ho sakti
- Replay attacks se protection (timestamp check)
- API key se zyada secure

Used by: AWS, Stripe, Razorpay APIs.

---

---

# Gap-Fill Questions — Previously Missing Topics

---

# Level 1 Additions

## Forms, Headers & Cookies

**Q41. `Form()` aur JSON body mein kya farak hai?**

JSON body mein `Content-Type: application/json` hota hai. Form data mein `Content-Type: application/x-www-form-urlencoded` hota hai — HTML forms yahi bhejte hain.

```python
from fastapi import Form

@app.post("/login")
def login(username: str = Form(), password: str = Form()):
    return {"username": username}
```

Ek endpoint mein dono ek saath nahi ho sakte — ya JSON body ya Form.

---

**Q42. Request headers aur cookies kaise read karte hain?**

```python
from fastapi import Header, Cookie

@app.get("/info")
def info(
    user_agent: str = Header(default=None),
    session_id: str = Cookie(default=None)
):
    return {"user_agent": user_agent, "session": session_id}
```

Header names mein FastAPI automatically hyphens ko underscores mein convert karta hai — `user-agent` → `user_agent`.

---

## Response Types

**Q43. `StreamingResponse` kab use karte hain?**

Jab poora response ek saath generate nahi hota — large files, real-time data, CSV export.

```python
from fastapi.responses import StreamingResponse

def generate_csv():
    yield "id,name\n"
    for i in range(1000):
        yield f"{i},user_{i}\n"

@app.get("/export")
def export():
    return StreamingResponse(generate_csv(), media_type="text/csv")
```

Faayda: Server ko poora data memory mein rakhne ki zaroorat nahi.

---

**Q44. `response_model` vs actual return type — kya farak hai?**

- **`response_model`** — OpenAPI docs aur response serialization/filtering ke liye
- **Actual return** — jo function return karta hai

```python
class UserPublic(BaseModel):
    id: int
    name: str
    # password field nahi hai

@app.get("/user", response_model=UserPublic)
def get_user() -> UserDB:  # DB model mein password hai
    return db_user  # password automatically filter ho jayega
```

`response_model` sensitive fields ko response se hatata hai.

---

## Error Handling

**Q45. Default 422 response format kaise customize karein?**

```python
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"error": "Invalid input", "details": str(exc.errors())}
    )
```

Default FastAPI 422 format bahut verbose hota hai — production mein custom format better hota hai.

---

# Level 2 Additions

## Concurrency

**Q46. GIL kya hota hai aur FastAPI pe iska kya impact hai?**

GIL (Global Interpreter Lock) ek CPython mechanism hai — ek time pe sirf ek Python thread execute hoti hai.

**Impact on FastAPI:**
- CPU-bound tasks ke liye threading useless hai — GIL block karta hai
- I/O-bound tasks (DB, HTTP) ke liye threads fine hain — GIL release hota hai I/O wait mein
- **Best solution:** Async/await for I/O, `multiprocessing` for CPU-heavy work

```
Threads = I/O concurrency (GIL releases during I/O)
Processes = True parallelism (each process has own GIL)
Async = Best I/O concurrency (no threading overhead)
```

---

**Q47. `asyncio.Lock` kab use karte hain?**

Jab multiple coroutines ek shared resource access karein aur race condition ka risk ho.

```python
import asyncio

lock = asyncio.Lock()
counter = 0

async def increment():
    global counter
    async with lock:
        temp = counter
        await asyncio.sleep(0)  # context switch yahan ho sakta tha
        counter = temp + 1
```

**Bina lock ke:** Dono coroutines same value read kar sakte hain — ek increment lost ho jaata.

---

**Q48. `asyncio.Semaphore` kya hota hai?**

Lock sirf ek ko allow karta hai. Semaphore N concurrent access allow karta hai.

```python
semaphore = asyncio.Semaphore(10)  # max 10 concurrent

async def fetch_url(url):
    async with semaphore:
        return await httpx.get(url)

# 100 URLs fetch karo, but max 10 at a time
tasks = [fetch_url(url) for url in urls]
await asyncio.gather(*tasks)
```

Use case: External API rate limits — 10 requests/second allow hai.

---

**Q49. Thundering herd problem kya hota hai?**

Cache expire hone par ek saath hazaaron requests DB pe aati hain — DB overload.

**Solutions:**
1. **Cache lock** — sirf pehli request DB se fetch kare, baaki wait karein
2. **Stale-while-revalidate** — purana cache serve karo, background mein refresh karo
3. **Jitter** — random TTL variation taaki sab ek saath expire na ho

---

## Exception Handling (Advanced)

**Q50. Global exception handler kaise banate hain?**

```python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # log karo
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )
```

Isse koi bhi unhandled exception user ko raw stack trace nahi dikhata — production safety.

---

**Q51. `HTTPException` ko globally override kyun karte hain?**

Default FastAPI `HTTPException` response format:
```json
{"detail": "Not found"}
```

Production mein consistent format chahiye:
```json
{"error": "NOT_FOUND", "message": "User not found", "status": 404}
```

```python
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status": exc.status_code}
    )
```

---

## Settings & Configuration

**Q52. `pydantic-settings` ka `lru_cache` pattern kyun use karte hain?**

```python
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    debug: bool = False

    class Config:
        env_file = ".env"

@lru_cache
def get_settings():
    return Settings()

# Dependency mein use karo
@app.get("/info")
def info(settings: Settings = Depends(get_settings)):
    return {"debug": settings.debug}
```

`lru_cache` ensure karta hai Settings ek baar hi create ho — har request pe `.env` file dobara nahi padhi jaati.

---

## Security

**Q53. Token bucket vs sliding window rate limiting — kya farak hai?**

**Token bucket:**
- Bucket mein tokens hote hain (e.g., 10 tokens)
- Har request ek token consume karta hai
- Tokens time ke saath refill hote hain
- Burst allowed hai jab bucket full ho

**Sliding window:**
- Last N seconds mein kitni requests aayi — count karo
- Zyada precise, burst control better
- Thoda zyada memory/computation

**FastAPI mein:** `slowapi` library token bucket use karti hai.

---

**Q54. SQL injection FastAPI mein kaise hoti hai aur kaise bachein?**

**Dangerous — raw query with f-string:**
```python
# NEVER do this
query = f"SELECT * FROM users WHERE name = '{user_input}'"
db.execute(query)
```

**Safe — parameterized query:**
```python
# SQLAlchemy ORM — automatically safe
user = db.query(User).filter(User.name == user_input).first()

# Raw query — use parameters
db.execute(text("SELECT * FROM users WHERE name = :name"), {"name": user_input})
```

ORM always safe hota hai. Raw queries mein `:param` syntax use karo, kabhi f-strings nahi.

---

## Deployment

**Q55. Docker multi-stage build FastAPI ke liye kyun use karte hain?**

```dockerfile
# Stage 1 — Builder
FROM python:3.11 AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Stage 2 — Final (smaller image)
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

**Faayda:** Final image mein build tools nahi hote — image size kam, attack surface kam.

---

# Level 3 Additions

## AsyncIO Internals

**Q56. Coroutine vs Task vs Future — kya farak hai?**

| | Coroutine | Task | Future |
|--|-----------|------|--------|
| Kya hai | `async def` function | Scheduled coroutine | Low-level result placeholder |
| Execute kab | `await` pe | Event loop schedule karta hai | Manually set karte hain |
| Cancel ho sakta | No directly | Yes | Yes |

```python
# Coroutine — sirf define, execute nahi
async def my_coro():
    return 42

# Task — event loop mein schedule, concurrent
task = asyncio.create_task(my_coro())

# Future — low level, callbacks
future = asyncio.get_event_loop().create_future()
```

**Rule:** `asyncio.gather()` use karo parallel ke liye, `create_task()` use karo fire-and-forget ke liye.

---

**Q57. `asyncio.gather()` vs `asyncio.wait()` — kab kya?**

```python
# gather — sabka result ek saath, ek bhi fail toh exception
results = await asyncio.gather(task1(), task2(), task3())

# wait — finer control, partial results bhi le sakte ho
done, pending = await asyncio.wait(
    [task1(), task2()],
    return_when=asyncio.FIRST_COMPLETED
)
```

**`gather`** — simple parallel execution, sab complete hone ka wait.
**`wait`** — jab first completed pe react karna ho, ya timeout chahiye ho.

---

## Multi-tenancy

**Q58. Schema-based vs Row-based multi-tenancy — kab kya?**

**Row-based:** Sab tenants ek table mein, `tenant_id` column se filter
```sql
SELECT * FROM orders WHERE tenant_id = 'acme_corp'
```
- Simple, easy migration
- Risk: ek query galat likh do toh doosre tenant ka data leak

**Schema-based:** Har tenant ka alag PostgreSQL schema
```sql
SET search_path = 'acme_corp';
SELECT * FROM orders;
```
- Strong isolation
- Complex migration (har tenant pe Alembic run karo)
- Better for compliance (GDPR, HIPAA)

**Rule:** Small SaaS → row-based. Enterprise/compliance → schema-based.

---

## Resilience Patterns

**Q59. Exponential backoff with retry kaise implement karte hain?**

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10)
)
async def call_external_api():
    response = await httpx.get("https://api.example.com/data")
    response.raise_for_status()
    return response.json()
```

**Wait times:** 1s → 2s → 4s (exponential)

**Kyun exponential?** Agar service overloaded hai toh rapid retries aur bura karte hain. Backoff se service recover kar sakti hai.

---

## Deployment Strategies

**Q60. Blue-green deployment kya hota hai?**

Do identical production environments hote hain — Blue (current live) aur Green (new version).

```
Users → Load Balancer → Blue (v1) ← currently live
                      → Green (v2) ← new version deploy karo, test karo
```

Jab Green ready ho — load balancer switch karo. Instant zero-downtime switch. Kuch galat hua toh ek click se wapas Blue pe.

**Canary releases:** Poora traffic switch nahi karte — pehle 5% users ko new version dikhate hain, monitor karte hain, phir gradually badhate hain.

---

## Advanced Security (OWASP)

**Q61. BOLA (Broken Object Level Authorization) kya hota hai?**

OWASP API Security Top 1 risk. User kisi bhi object ka ID guess karke doosre user ka data access kar sakta hai.

**Vulnerable:**
```python
@app.get("/orders/{order_id}")
def get_order(order_id: int, current_user = Depends(get_current_user)):
    return db.query(Order).filter(Order.id == order_id).first()
    # current_user ka order hai ya nahi — check nahi kiya!
```

**Secure:**
```python
@app.get("/orders/{order_id}")
def get_order(order_id: int, current_user = Depends(get_current_user)):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id  # ownership check!
    ).first()
    if not order:
        raise HTTPException(status_code=404)
    return order
```

---

**Q62. Mass assignment vulnerability kya hoti hai FastAPI mein?**

Jab user apni marzi ke fields set kar sake jo unhe nahi karne chahiye — jaise `is_admin=True`.

**Vulnerable:**
```python
class UserUpdate(BaseModel):
    name: str
    email: str
    is_admin: bool  # user yeh set kar sakta hai!
```

**Secure — alag schemas for different operations:**
```python
class UserUpdateRequest(BaseModel):
    name: str
    email: str
    # is_admin nahi — sirf internal schema mein hoga

class UserInternal(BaseModel):
    name: str
    email: str
    is_admin: bool
```

---

## Testing Strategies (Advanced)

**Q63. Load testing kaise karte hain FastAPI app ka?**

**Locust — Python mein load test likhte hain:**
```python
from locust import HttpUser, task

class APIUser(HttpUser):
    @task
    def get_users(self):
        self.client.get("/users")

    @task(3)  # 3x zyada frequently run hoga
    def create_order(self):
        self.client.post("/orders", json={"product_id": 1})
```

```bash
locust -f locustfile.py --host=http://localhost:8000
```

Metrics dekho: RPS (requests/second), response time (p50, p95, p99), error rate.

---

**Q64. Contract testing kya hota hai?**

Microservices mein ek service doosri service ke API pe depend karti hai. Contract testing ensure karta hai ki provider ka API consumer ki expectations match kare.

**Pact framework:**
- Consumer apni expectations define karta hai (contract)
- Provider apna API us contract ke against test karta hai
- Agar provider API change kare toh contract test fail — breaking change caught!

**Fayda:** Integration ke bina hi compatibility verify ho jaati hai — CI/CD mein fast.

---

## Memory Management

**Q65. FastAPI mein common memory leaks kaise hoti hain?**

1. **DB sessions close nahi ki:**
```python
# Leak — session kabhi close nahi hogi exception pe
def get_data(db = Depends(get_db)):
    db.query(User).all()
    # agar exception aayi toh finally nahi chala
```

2. **Global mutable state — list/dict grow karta rahe:**
```python
request_log = []  # har request add hoti hai, kabhi clean nahi
```

3. **Unclosed httpx clients:**
```python
# Wrong — naya client har baar
response = httpx.get(url)  # connection pool leak

# Right — shared client use karo lifespan mein
```

4. **Circular references** — Pydantic models jo ek doosre ko reference karein.

**Detect kaise karein:** `tracemalloc` ya `memory_profiler` library.

---

*Total: 65 Questions across 3 levels — Junior (15), Mid (25), Senior (25)*

