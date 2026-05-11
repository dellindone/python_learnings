from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    VERSION: str = "0.0.1"
    APP_NAME: str = "Shopping Store"
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    model_config = {"env_file": ".env", "case_sensitive": True, "extra": "ignore"}

settings = Settings()
