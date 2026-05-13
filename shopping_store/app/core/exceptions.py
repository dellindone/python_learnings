from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError

class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400, error_code:str = "APP_ERROR"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(message)

class BadRequestException(AppException):
    def __init__(self, message: str = "Bad Request"):
        super().__init__(message=message, status_code=400, error_code="BAD_REQUEST")

class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message=message, status_code=401, error_code="UNAUTHORIZED")

class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message=message, status_code=403, error_code="FORBIDDEN")

class NotFoundException(AppException):
    def __init__(self, message: str = "Not Found"):
        super().__init__(message=message, status_code=404, error_code="NOT_FOUND")

class ConflictException(AppException):
    def __init__(self, message: str = "Conflict"):
        super().__init__(message=message, status_code=409, error_code="CONFLICT")

class RateLimitException(AppException):
    def __init__(self, message: str = "Too Many Requests"):
        super().__init__(message=message, status_code=429, error_code="RATE_LIMIT")

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

async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code = 500,
        content = {
            "data": None,
            "status": False,
            "message": "Something went wrong. Please try again later.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )

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
