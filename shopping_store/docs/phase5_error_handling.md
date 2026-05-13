# Phase 5 — Global Error Handling

## Problems Fixed

- SQLAlchemy `IntegrityError` raw leak ho rahi thi client ko — table/column names expose hote the
- Koi bhi unexpected exception = uncontrolled 500, no format
- FastAPI ka default 422 format tera standard response format se alag tha

---

## Standard Response Format

Poore app mein yahi structure — success aur error dono pe:

```json
{
  "data": null,
  "status": false,
  "message": "...",
  "error_code": "..."
}
```

- `status` — boolean, success=true / error=false
- `error_code` — string constant, client programmatically isse handle kare
- `data` — error pe always null
- `message` — human readable, kabhi internal details nahi

---

## Exception Flow

```
Request
  → Router → Controller → Service → Repository → DB
                                                   ↓
                                          Exception raise hoti hai
                                                   ↓
                                    FastAPI — registered handler dhundta hai
                                    (specific se broad order mein match karta hai)
                                                   ↓
                                          Standard JSON response
```

- Service layer mein hamesha custom `AppException` raise karo
- DB errors (IntegrityError, etc.) repository se bubble up hoti hain — handler pakad leta hai
- Koi bhi uncaught exception catch-all tak pahunchti hai

---

## `app/core/exceptions.py`

### AppException — Base Class

```python
class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400, error_code: str = "APP_ERROR"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(message)
```

- FastAPI ka `HTTPException` use nahi kiya — usmein `error_code` nahi hota
- Sab subclasses isi se inherit karti hain: `BadRequestException`, `NotFoundException`, `ConflictException`, etc.
- HTTP status code exception class decide karti hai, service nahi — separation of concerns

---

### Handler 1 — AppException (Phase 1 se)

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

- Triggers when: service `raise NotFoundException(...)` ya koi bhi `AppException` subclass raise kare
- `exc` mein `status_code`, `error_code`, `message` teeno hote hain — isliye dynamic values use ki

---

### Handler 2 — IntegrityError (Phase 5)

```python
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

- Triggers when: DB UNIQUE/FK/NOT NULL constraint fail ho — duplicate email insert, invalid FK reference, etc.
- `exc.status_code` nahi likha — `IntegrityError` SQLAlchemy ka class hai, usmein ye attribute hota hi nahi
- Message generic rakha — actual error mein `UNIQUE constraint failed: users.email` hota hai, internal info leak hoti
- Ye safety net hai — agar service ne pehle check nahi kiya aur DB directly fail kare

---

### Handler 3 — Catch-All (Phase 5)

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

- Triggers when: koi bhi exception jo baaki handlers ne nahi pakdi — programming bugs, DB connection drop, etc.
- `print` abhi ke liye — Phase 11 (structured logging) mein proper `logger.error(exc)` se replace hoga
- Stack trace kabhi client ko mat do — internal paths, library versions, DB schema expose hote hain

---

### Handler 4 — RequestValidationError (Phase 5)

```python
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

- Triggers when: request body mein required field missing ho, ya wrong type ho — Pydantic automatically raise karta hai
- `exc.errors()` → list of all validation errors, `[0]["msg"]` → pehli error ka readable message
- FastAPI ka default 422 format override kiya — uska format `{"detail": [...]}` hota hai, tera standard se alag

---

## `main.py` — Registration Order

```python
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)  # always last
```

- Order: specific → broad — FastAPI first match pe rok deta hai
- `Exception` sabse last — agar pehle hota toh baaki handlers kabhi nahi chalte
- `AppException` subclasses bhi `app_exception_handler` se pakdi jaati hain — FastAPI MRO follow karta hai

---

## Interview Checkpoints

**Q: `HTTPException` vs custom `AppException`?**
`HTTPException` mein sirf `status_code` aur `detail` hota hai. Custom `AppException` mein `error_code` extra hai — client-side programmatic handling ke liye. Structured, consistent responses ke liye custom banana better hai.

**Q: Status codes service mein decide karo ya exception class mein?**
Exception class mein. Service ka kaam business logic hai — "user nahi mila" batana. 404 ka decision `NotFoundException` ka kaam hai. Ek responsibility, ek jagah.

**Q: Client ko stack trace do ya generic message?**
Generic message. Stack trace mein internal paths, library versions, DB schema hoti hai — attacker ke liye useful info. Server pe log karo, client ko generic 500 do.

**Q: 400 vs 422?**
- `400` → request semantically galat (business logic — jaise insufficient balance)
- `422` → request structure galat (Pydantic validation — jaise missing required field)
FastAPI automatically 422 raise karta hai jab request body schema match nahi karta.

**Q: DB connection drop ho toh?**
`sqlalchemy.exc.OperationalError` raise hoti hai. Catch-all pakad lega, client ko generic 500 milega. Production mein connection pooling aur retry logic hoti hai.

**Q: `NotFoundException` raise kiya, handler register nahi kiya — kya hoga?**
`AppException` ka handler pakad lega — `NotFoundException` uska subclass hai. FastAPI inheritance chain follow karta hai.

---

## Test Results (Verified)

| Scenario | Handler | Response |
|----------|---------|----------|
| Required field missing | `validation_exception_handler` | `422 VALIDATION_ERROR` |
| Duplicate email | `app_exception_handler` (via ConflictException) | `409 CONFLICT` |
| `raise Exception("test")` | `unhandled_exception_handler` | `500 INTERNAL_SERVER_ERROR` |
