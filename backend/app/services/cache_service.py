import json
from typing import Any, Optional

from redis.asyncio import Redis

from app.core.config import get_settings

settings = get_settings()

# Inicializar cliente Redis
redis_client = Redis(
    host=settings.redis_host if hasattr(settings, 'redis_host') else 'localhost',
    port=settings.redis_port if hasattr(settings, 'redis_port') else 6379,
    db=settings.redis_db if hasattr(settings, 'redis_db') else 0,
    decode_responses=True
)

async def get_cached_data(key: str, ttl: int = 300) -> Optional[Any]:
    """
    Obter dados do cache Redis
    """
    try:
        cached_data = await redis_client.get(key)
        if cached_data:
            return json.loads(cached_data)
        return None
    except Exception:
        return None

async def set_cached_data(key: str, data: Any, ttl: int = 300) -> bool:
    """
    Armazenar dados no cache Redis
    """
    try:
        serialized_data = json.dumps(data)
        await redis_client.setex(key, ttl, serialized_data)
        return True
    except Exception:
        return False

async def invalidate_cache(key: str) -> bool:
    """
    Invalidar dado do cache Redis
    """
    try:
        await redis_client.delete(key)
        return True
    except Exception:
        return False

async def clear_cache_pattern(pattern: str) -> bool:
    """
    Limpar todos os dados correspondendo a um padrão
    """
    try:
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)
        return True
    except Exception:
        return False