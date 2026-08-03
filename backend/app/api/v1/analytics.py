from fastapi import APIRouter

router = APIRouter()

@router.get("/oee")
async def get_oee_analytics(timeframe: str = "Last 7 Days"):
    return {
        "overall_oee": 87.4,
        "availability": 94.5,
        "performance": 96.1,
        "quality": 98.4,
        "timeframe": timeframe,
        "shift_breakdown": [
            {"shift": "Shift A", "oee": 89.4, "yield": 98.8},
            {"shift": "Shift B", "oee": 86.2, "yield": 97.9},
            {"shift": "Shift C", "oee": 82.0, "yield": 96.5},
        ],
    }
