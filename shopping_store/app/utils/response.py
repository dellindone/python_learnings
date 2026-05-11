from typing import Any

def success(data: Any, message: str) -> dict:
    return {
        "status": "True",
        "message": message,
        "data": data,
        "error_code": None,
    }

def error(message: str, error_code: str = "ERROR") -> dict:
    return {
        "status": "False",
        "message": message,
        "data": None,
        "error_code": error_code,
    }
