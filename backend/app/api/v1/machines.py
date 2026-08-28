from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from backend.app.db.session import get_db_session
from backend.app.models import Machine
from backend.app.schemas.machine import MachineOut, MachineCreate, MachineUpdate
from backend.app.core.rbac import get_current_user, CurrentUser

router = APIRouter()


@router.get("/", response_model=List[MachineOut])
async def list_machines(
    skip: int = 0,
    limit: int = Query(10, le=100),
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    from backend.app.models import Factory

    org_id = current_user.organization_id
    if not org_id:
        raise HTTPException(status_code=403, detail="User is not scoped to an organization")
    factory_ids = (
        await db.execute(select(Factory.id).where(Factory.organization_id == org_id))
    ).scalars().all()
    query = select(Machine).where(Machine.plant_id.in_(factory_ids))
    if status_filter:
        query = query.where(Machine.status == status_filter)
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=MachineOut, status_code=status.HTTP_201_CREATED)
async def create_machine(
    payload: MachineCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    machine = Machine(**payload.model_dump())
    db.add(machine)
    await db.commit()
    await db.refresh(machine)
    return machine


@router.get("/{machine_id}", response_model=MachineOut)
async def get_machine(
    machine_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    from backend.app.models import Factory

    org_id = current_user.organization_id
    factory_ids = (
        await db.execute(select(Factory.id).where(Factory.organization_id == org_id))
    ).scalars().all()
    result = await db.execute(
        select(Machine).where(
            Machine.id == str(machine_id),
            Machine.plant_id.in_(factory_ids),
        )
    )
    machine = result.scalars().first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return machine


@router.patch("/{machine_id}", response_model=MachineOut)
async def update_machine(
    machine_id: UUID,
    payload: MachineUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(select(Machine).where(Machine.id == str(machine_id)))
    machine = result.scalars().first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(machine, field, value)
    await db.commit()
    await db.refresh(machine)
    return machine
