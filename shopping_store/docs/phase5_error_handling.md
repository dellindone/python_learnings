# Phase 5 — Global Error Handling

## Problem Statement

Teen issues the jo fix karne the:

1. **SQLAlchemy `IntegrityError` leak** — Duplicate email insert karo toh raw DB error milti thi client ko
2. **No catch-all handler** — Koi bhi unexpected exception = ugly 500 with internal details
3. **Pydantic validation error format inconsistent** — FastAPI ka default 422 format alag tha, tera standard format alag

---

## Standard Response Format (poore app mein yahi use hota hai)

```json
{
  "data": null,
  "status": false,
  "message": "Error message here",
  "error_code": "ERROR_CODE_HERE"
}
```

- `status` → boolean (True = success, False = error)
- `error_code` → string constant, client isse programmatically handle kare
- `data` → error pe always null
- `message` → human readable

---

## Architecture — Exception Flow

```
Request aaya
    ↓
Router → Controller → Service → Repository
                                    ↓
                            DB se IntegrityError (ya koi bhi exception)
                                    ↓
                            FastAPI exception handler pakadta hai
                                    ↓
                            Standard JSON response client ko
```

**Rule:** Service layer mein custom `AppException` raise karo. DB errors repository se bubble up hoti hain — handler pakad leta hai.

---

## File: `app/core/exceptions.py`

### Custom Exception Classes (already the Phase 1 se)

```python
class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400, error_code: str = "APP_ERROR"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(message)
```

Sab subclasses isi se inherit karti hain — `BadRequestException`, `NotFoundException`, `ConflictException`, etc.

**Why custom exceptions?** `HTTPException` (FastAPI ka default) mein `error_code` nahi hota. Tera app consistent structured errors chahta tha.

---

### Handler 1 — AppException Handler (Phase 1 se already tha)

```python
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "data": None,
            "status": False,
            "error_code": exc.error_code,
            "message": exc.message
        }
    )
```

**Kab chalega:** Jab service layer mein `raise NotFoundException(...)` ya koi bhi `AppException` subclass raise karo.

---

### Handler 2 — IntegrityError Handler (Phase 5 — naya)

```python
from sqlalchemy.exc import IntegrityError

async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={
            "data": None,
            "status": False,
            "message": "A conflict occurred. Please check your input.",
            "error_code": "CONFLICT"
        }
    )
```

**Kab chalega:** Jab SQLAlchemy DB operation fail kare:
- Duplicate email/username insert
- Foreign key violation
- NOT NULL constraint fail

**Why hardcoded 409 and not `exc.status_code`?**
`IntegrityError` SQLAlchemy ka exception hai — usmein `status_code` attribute hota hi nahi. Sirf tera `AppException` mein hota hai.

**Why generic message?**
`IntegrityError` ka actual message kuch aisa hota hai:
`UNIQUE constraint failed: users.email` — internal table/column names leak hote hain. Client ko ye nahi dikhana.

---

### Handler 3 — Catch-All Handler (Phase 5 — naya)

```python
async def unhandled_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "data": None,
            "status": False,
            "message": "Something went wrong. Please try again later.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )
```

**Kab chalega:** Koi bhi aisi exception jo baaki handlers ne nahi pakdi — programming bugs, network errors, etc.

**Why `print`?** Abhi ke liye server-side log karo taaki debug kar sako. Production mein `logging` module use karenge (Phase 8+).

**Why generic message?** Stack trace kabhi client ko mat do — security risk hai.

---

### Handler 4 — Pydantic Validation Handler (Phase 5 — naya)

```python
from fastapi.exceptions import RequestValidationError

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "data": None,
            "status": False,
            "message": str(exc.errors()[0]["msg"]),
            "error_code": "VALIDATION_ERROR"
        }
    )
```

**Kab chalega:** Jab request body mein required field missing ho, ya wrong type ho.

**`exc.errors()`** → list of all validation errors. `[0]` → pehli error. `["msg"]` → human readable message.

**Why override FastAPI ka default?** FastAPI ka default 422 format alag hota hai — tera standard format `status`, `error_code`, `data` expect karta hai. Consistency ke liye override kiya.

---

## File: `main.py` — Registration

**Order important hai — specific se broad:**

```python
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
from app.core.exceptions import (
    AppException, app_exception_handler,
    integrity_error_handler,
    unhandled_exception_handler,
    validation_exception_handler
)

# Handlers register karo — specific pehle, broad baad mein
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)  # catch-all — always last
```

**Why order matters?**
FastAPI top-to-bottom match karta hai. Agar `Exception` pehle ho toh wo sab kuch pakad lega — specific handlers kabhi nahi chalenge.

---

## Interview Checkpoint — Phase 5 Questions & Answers

**Q1: `HTTPException` vs custom `AppException` — difference kya hai?**
`HTTPException` FastAPI ka built-in hai — sirf `status_code` aur `detail` hota hai. Custom `AppException` mein `error_code` extra hai jo client-side programmatic handling ke liye use hota hai. Custom exceptions zyada structured aur consistent responses dete hain.

**Q2: HTTP status codes kaun decide kare — service ya exception class?**
Exception class. Service ka kaam business logic hai — "user nahi mila" bolna. HTTP 404 ka decision `NotFoundException` class ka kaam hai. Separation of concerns.

**Q3: Unhandled exception pe client ko kya milna chahiye — stack trace ya generic message?**
Generic message. Stack trace mein internal file paths, library versions, DB schema details hoti hain — attacker ke liye goldmine. Server pe log karo, client ko generic 500 do.

**Q4: 400 vs 422 difference?**
- `400 Bad Request` → request semantically galat hai (business logic — jaise expired coupon)
- `422 Unprocessable Entity` → request ka structure/format galat hai (Pydantic validation fail — jaise missing required field)
FastAPI automatically 422 deta hai jab request body schema match nahi karta.

**Q5: DB connection drop ho toh?**
`sqlalchemy.exc.OperationalError` raise hoti hai. Catch-all handler pakad lega aur client ko generic 500 milega. Production mein retry logic aur connection pooling hoti hai.

**Q6: `NotFoundException` raise kiya but handler register nahi kiya — kya hoga?**
`AppException` ka handler pakad lega — kyunki `NotFoundException` `AppException` ka subclass hai. FastAPI MRO (Method Resolution Order) follow karta hai.

---

## Testing Kaise Karo

**IntegrityError test:** Duplicate email se register karo — `409 CONFLICT` milna chahiye
**Validation error test:** Request body mein required field miss karo — `422 VALIDATION_ERROR` milna chahiye
**Catch-all test:** Temporarily kisi service mein `raise Exception("test")` likho — `500 INTERNAL_SERVER_ERROR` milna chahiye
