from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from backend.app.db.session import get_db_session
from backend.app.models import Factory
from backend.app.schemas.factory import FactoryOut, FactoryCreate, FactoryUpdate
from backend.app.core.rbac import get_current_user, CurrentUser

router = APIRouter()


@router.get("/", response_model=List[FactoryOut])
async def list_factories(
    skip: int = 0,
    limit: int = Query(10, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    query = select(Factory).where(
        Factory.organization_id == current_user.organization_id
    )
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=FactoryOut, status_code=status.HTTP_201_CREATED)
async def create_factory(
    payload: FactoryCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    factory = Factory(
        name=payload.name,
        location=payload.location,
        type=payload.type,
        organization_id=str(payload.organization_id),
        metadata_json=payload.metadata_json,
    )
    db.add(factory)
    await db.commit()
    await db.refresh(factory)
    return factory


@router.get("/{factory_id}", response_model=FactoryOut)
async def get_factory(
    factory_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        select(Factory).where(
            Factory.id == str(factory_id),
            Factory.organization_id == current_user.organization_id,
        )
    )
    factory = result.scalars().first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")
    return factory


@router.patch("/{factory_id}", response_model=FactoryOut)
async def update_factory(
    factory_id: UUID,
    payload: FactoryUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(select(Factory).where(Factory.id == str(factory_id)))
    factory = result.scalars().first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(factory, field, value)
    await db.commit()
    await db.refresh(factory)
    return factory
