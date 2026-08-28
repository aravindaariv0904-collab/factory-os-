"""Health endpoints with dependency checks."""
from fastapi import APIRouter

from backend.app.schemas.platform import DetailedHealthOut, HealthComponent
from backend.app.services.health_service import gather_detailed_health

router = APIRouter()


@router.get("/detailed", response_model=DetailedHealthOut)
async def detailed_health():
    result = await gather_detailed_health()
    return DetailedHealthOut(
        status=result["status"],
        service=result["service"],
        version=result["version"],
        components=[HealthComponent(**c) for c in result["components"]],
    )
