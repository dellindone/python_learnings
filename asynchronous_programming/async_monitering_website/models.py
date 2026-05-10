from pydantic import BaseModel
from typing import Optional, Literal

class WebsiteResult(BaseModel):
    url: str
    status: Literal[
        "UP",
        "SLOW",
        "DOWN",
        "BLOCKED",
        "RATE_LIMITED",
        "TIMEOUT",
        "ERROR",
    ]
    status_code: Optional[int] = None
    response_time: Optional[float] = None
    checked_at: str
    error: Optional[str] = None
