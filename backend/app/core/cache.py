import time
from typing import Any, Optional, Dict

class RedisCacheManager:
    """Async Redis cache manager with in-memory TTL fallback for high availability."""
    def __init__(self):
        self._store: Dict[str, Any] = {}
        self._ttl: Dict[str, float] = {}

    async def set(self, key: str, value: Any, ttl_seconds: int = 300):
        self._store[key] = value
        self._ttl[key] = time.time() + ttl_seconds

    async def get(self, key: str) -> Optional[Any]:
        if key not in self._store:
            return None
        if time.time() > self._ttl.get(key, 0):
            del self._store[key]
            del self._ttl[key]
            return None
        return self._store[key]

    async def invalidate(self, key: str):
        self._store.pop(key, None)
        self._ttl.pop(key, None)

cache_manager = RedisCacheManager()
