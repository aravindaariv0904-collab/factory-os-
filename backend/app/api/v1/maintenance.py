from fastapi import APIRouter
from backend.app.schemas.maintenance import WorkOrderCreate

router = APIRouter()

@router.post("/work-orders")
async def create_work_order(req: WorkOrderCreate):
    return {
        "status": "success",
        "message": f"Work order created for machine {req.machine_id}",
        "work_order_id": "WO-8910",
        "priority": req.priority,
        "assigned_crew": req.assigned_crew,
    }
