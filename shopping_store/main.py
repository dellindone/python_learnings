from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.core.exceptions import AppException, app_exception_handler
from app.core.database import engine, Base
from app.core.config import Settings
from app import models # Ensure models are imported to create tables

from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.categories.router import router as categories_router
from app.modules.products.router import router as product_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    lifespan=lifespan,
    title="Shopping Store API",
    version=Settings().VERSION
)
app.add_exception_handler(AppException, app_exception_handler)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(categories_router)
app.include_router(product_router)
