from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime, timezone
from backend.app.db.session import get_db_session
from backend.app.models import MaintenanceLog, Machine
from backend.app.schemas.maintenance import WorkOrderCreate, MaintenanceLogOut
from backend.app.core.rbac import get_current_user, CurrentUser
from backend.app.core.deps import TenantScope, get_tenant_user

router = APIRouter()


@router.post("/work-orders", status_code=status.HTTP_201_CREATED)
async def create_work_order(
    req: WorkOrderCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    machine = (
        await db.execute(select(Machine).where(Machine.id == str(req.machine_id)))
    ).scalars().first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    work_order_id = f"WO-{int(datetime.now(timezone.utc).timestamp()) % 1000000}"
    log = MaintenanceLog(
        machine_id=str(req.machine_id),
        organization_id="11111111-1111-1111-1111-111111111111",
        factory_id=machine.plant_id,
        type="unplanned" if req.priority.lower() in {"critical", "high"} else "planned",
        description=req.description,
        cost=0.0,
        duration_minutes=0,
        performed_by=req.assigned_crew,
        work_order_id=work_order_id,
    )
    db.add(log)
    await db.commit()

    return {
        "status": "success",
        "message": f"Work order created for machine {req.machine_id}",
        "work_order_id": work_order_id,
        "priority": req.priority,
        "assigned_crew": req.assigned_crew,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/logs", response_model=List[MaintenanceLogOut])
async def list_maintenance_logs(
    skip: int = 0,
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_tenant_user),
):
    stmt = TenantScope.apply_org_filter(select(MaintenanceLog), MaintenanceLog, current_user)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
