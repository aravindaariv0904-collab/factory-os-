from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ReportGenRequest(BaseModel):
    category: str
    format: str

@router.post("/generate")
async def generate_report(req: ReportGenRequest):
    return {
        "status": "Ready",
        "report_id": "rep_9012",
        "category": req.category,
        "format": req.format,
        "download_url": "/api/v1/reports/download/rep_9012",
    }
