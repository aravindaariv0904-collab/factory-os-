from fastapi import APIRouter
from backend.app.api.v1 import (
    auth,
    factories,
    machines,
    production,
    maintenance,
    quality,
    inventory,
    copilot,
    recommendations,
    alerts,
    reports,
    upload,
    analytics,
    stream,
    predict,
    knowledge,
)

v1_router = APIRouter()

v1_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
v1_router.include_router(factories.router, prefix="/factories", tags=["Factories"])
v1_router.include_router(machines.router, prefix="/machines", tags=["Machines"])
v1_router.include_router(production.router, prefix="/production", tags=["Production"])
v1_router.include_router(maintenance.router, prefix="/maintenance", tags=["Maintenance"])
v1_router.include_router(quality.router, prefix="/quality", tags=["Quality"])
v1_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
v1_router.include_router(copilot.router, prefix="/copilot", tags=["AI Copilot"])
v1_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
v1_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
v1_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
v1_router.include_router(upload.router, prefix="/upload", tags=["Data Upload"])
v1_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
v1_router.include_router(stream.router, prefix="/stream", tags=["Real-Time Streaming"])
v1_router.include_router(predict.router, prefix="/predict", tags=["ML Predictions"])
v1_router.include_router(knowledge.router, prefix="/knowledge", tags=["RAG Knowledge Base"])
