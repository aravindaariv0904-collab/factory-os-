from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from backend.app.db.session import get_db_session
from backend.app.models import ProductionOrder, DowntimeEvent
from backend.app.schemas.production import (
    ProductionOrderOut,
    ProductionOrderCreate,
    DowntimeEventOut,
    DowntimeEventCreate,
)
from backend.app.core.rbac import get_current_user, CurrentUser

router = APIRouter()


@router.get("/orders", response_model=List[ProductionOrderOut])
async def list_orders(
    skip: int = 0,
    limit: int = Query(10, le=100),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(select(ProductionOrder).offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/orders", response_model=ProductionOrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: ProductionOrderCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    order = ProductionOrder(
        **payload.model_dump(exclude={"factory_id"}),
        organization_id="11111111-1111-1111-1111-111111111111",
        factory_id=str(payload.factory_id),
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/downtime", response_model=List[DowntimeEventOut])
async def list_downtime(
    skip: int = 0,
    limit: int = Query(10, le=100),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(select(DowntimeEvent).offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/downtime", response_model=DowntimeEventOut, status_code=status.HTTP_201_CREATED)
async def create_downtime_event(
    payload: DowntimeEventCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    event = DowntimeEvent(
        **payload.model_dump(exclude={"machine_id"}),
        organization_id="11111111-1111-1111-1111-111111111111",
        machine_id=str(payload.machine_id),
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event
