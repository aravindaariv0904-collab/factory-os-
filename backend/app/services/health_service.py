"""Platform health checks with dependency verification."""
import os
from typing import Any

import httpx
from sqlalchemy import text

from backend.app.core.config import get_settings
from backend.app.db.session import engine


async def check_database() -> dict[str, Any]:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"name": "database", "status": "healthy"}
    except Exception as exc:
        return {"name": "database", "status": "unhealthy", "details": {"error": str(exc)}}


async def check_redis() -> dict[str, Any]:
    settings = get_settings()
    try:
        import redis

        client = redis.from_url(settings.redis_url, socket_connect_timeout=2)
        client.ping()
        return {"name": "redis", "status": "healthy"}
    except Exception as exc:
        return {"name": "redis", "status": "unhealthy", "details": {"error": str(exc)}}


async def check_ai_service() -> dict[str, Any]:
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ai_service_url}/health")
            if resp.status_code == 200:
                return {"name": "ai_service", "status": "healthy", "details": resp.json()}
            return {
                "name": "ai_service",
                "status": "degraded",
                "details": {"status_code": resp.status_code},
            }
    except Exception as exc:
        return {"name": "ai_service", "status": "unhealthy", "details": {"error": str(exc)}}


async def check_storage() -> dict[str, Any]:
    settings = get_settings()
    root = settings.storage_root
    try:
        os.makedirs(root, exist_ok=True)
        test_path = os.path.join(root, ".healthcheck")
        with open(test_path, "w", encoding="utf-8") as fh:
            fh.write("ok")
        os.remove(test_path)
        return {"name": "storage", "status": "healthy", "details": {"root": root}}
    except Exception as exc:
        return {"name": "storage", "status": "unhealthy", "details": {"error": str(exc)}}


async def gather_detailed_health() -> dict[str, Any]:
    components = [
        await check_database(),
        await check_redis(),
        await check_ai_service(),
        await check_storage(),
    ]
    unhealthy = [c for c in components if c["status"] == "unhealthy"]
    degraded = [c for c in components if c["status"] == "degraded"]
    if unhealthy:
        overall = "unhealthy"
    elif degraded:
        overall = "degraded"
    else:
        overall = "healthy"
    return {
        "status": overall,
        "service": "Factory OS Enterprise Platform",
        "version": "6.0.0",
        "components": components,
    }
