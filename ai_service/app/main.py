"""FactoryOS AI Microservice - FastAPI entrypoint."""
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ai_service.app.config import settings
from ai_service.app.logging_config import setup_logging, get_logger
from ai_service.app.models import model_registry, start_background_reload

setup_logging()
logger = get_logger(__name__)

ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    model_registry.load()
    logger.info(
        "AI service started", models_dir=str(settings.models_dir), hot_reload=settings.model_hot_reload
    )
    start_background_reload()
    yield


app = FastAPI(
    title=settings.app_name,
    description="Low-latency industrial ML inference for Factory OS.",
    version=settings.version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )


class MachinePredictRequest(BaseModel):
    machine_id: str
    temperature_deg_c: Optional[float] = 64.2
    vibration_mm_s: Optional[float] = 2.1
    hydraulic_pressure_bar: Optional[float] = 195.0
    thermal_gradient: Optional[float] = 1.2


@app.get("/health", tags=["Health"])
async def health_check():
    model_registry.ensure_loaded()
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.version,
        "models_ready": model_registry.ready,
        "models_loaded": len(model_registry.models),
    }


@app.get("/models", tags=["Models"])
async def list_models():
    model_registry.ensure_loaded()
    return {
        "models_dir": str(settings.models_dir),
        "ready": model_registry.ready,
        "last_loaded_at": model_registry.last_loaded_at,
        "models": model_registry.list_models(),
    }


@app.post("/models/reload", tags=["Models"])
async def reload_models():
    model_registry.load()
    return {"status": "reloaded", "models_loaded": len(model_registry.models)}


@app.post("/predict/machine", tags=["Prediction"])
async def predict_machine(req: MachinePredictRequest):
    model_registry.ensure_loaded()
    telemetry = req.model_dump(exclude={"machine_id"})
    predictions = model_registry.predict_machine(telemetry)
    return {
        "machine_id": req.machine_id,
        "input_telemetry": telemetry,
        "predictions": predictions,
        "model_registry_ready": model_registry.ready,
    }


@app.get("/predict/health", tags=["Prediction"])
async def predict_health_summary():
    return {
        "service": "healthy",
        "models_ready": model_registry.ready,
        "latency_hint_ms": 1.2,
    }
