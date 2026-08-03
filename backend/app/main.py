from fastapi import FastAPI
from backend.app.api import v1_router
from backend.app.core.database import engine, Base

app = FastAPI(title="Factory OS API", version="1.0.0")

@app.on_event("startup")
async def startup():
    # In production, use Alembic migrations. 
    # For development/hackathon, we can create tables here.
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Dangerous
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "Factory OS API is running"}

# app.include_router(v1_router, prefix="/api/v1")
