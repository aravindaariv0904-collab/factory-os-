import pytest
from backend.app.core.cache import cache_manager
from backend.app.core.audit import audit_logger
from backend.app.db.session import engine, Base

@pytest.mark.anyio
async def test_cache_manager():
    await cache_manager.set("test_key", "factory_os_val", ttl_seconds=10)
    val = await cache_manager.get("test_key")
    assert val == "factory_os_val"
    await cache_manager.invalidate("test_key")
    assert await cache_manager.get("test_key") is None

def test_audit_logger():
    event = audit_logger.log_event("admin@factoryos.ai", "CREATE_MACHINE", "mch_105")
    assert event["user"] == "admin@factoryos.ai"
    assert event["action"] == "CREATE_MACHINE"

@pytest.mark.anyio
async def test_sqlalchemy_engine():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    assert engine is not None
