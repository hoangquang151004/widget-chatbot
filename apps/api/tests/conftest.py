import pytest


@pytest.fixture(autouse=True)
async def dispose_tenant_db_engines():
    yield
    from db.tenant_db import DynamicEngineManager

    for tid in list(DynamicEngineManager._engines.keys()):
        await DynamicEngineManager.refresh_engine(tid)
