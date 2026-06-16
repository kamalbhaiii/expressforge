"""Redis client — used for rate limiting, session cache, and dedup."""

from functools import lru_cache

import redis.asyncio as aioredis

from app.core.config import get_settings

settings = get_settings()


@lru_cache(maxsize=1)
def get_redis() -> aioredis.Redis:
    return aioredis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)


async def rate_limit_check(key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    """
    Sliding window rate limiter using Redis INCR + EXPIRE.
    Returns (is_limited, current_count).
    """
    r = get_redis()
    current = await r.incr(key)
    if current == 1:
        await r.expire(key, window_seconds)
    remaining = max(0, limit - current)
    return current > limit, remaining


async def cache_set(key: str, value: str, ttl_seconds: int) -> None:
    r = get_redis()
    await r.setex(key, ttl_seconds, value)


async def cache_get(key: str) -> str | None:
    r = get_redis()
    return await r.get(key)


async def cache_delete(key: str) -> None:
    r = get_redis()
    await r.delete(key)


async def close_redis() -> None:
    r = get_redis()
    await r.aclose()
