from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.redis import close_redis, rate_limit_check
from app.db.database import init_db
from app.routers import ai, auth, generate, health, projects

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    await init_db()
    yield
    await close_redis()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-API-Key"],
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
    if not settings.is_test and request.url.path == "/generate" and request.method == "POST":
        ip = request.client.host if request.client else "unknown"
        limited, _ = await rate_limit_check(
            f"generate:{ip}", settings.max_jobs_per_hour, 3600
        )
        if limited:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded. Max 10 requests per hour."},
                headers={"Retry-After": "3600"},
            )
    return await call_next(request)


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(generate.router)
app.include_router(projects.router)
app.include_router(ai.router)
