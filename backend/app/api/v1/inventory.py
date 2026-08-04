from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime, timezone
from backend.app.db.session import get_db_session
from backend.app.models import InventoryItem
from backend.app.schemas.inventory import InventoryItemOut, InventoryItemCreate, InventoryItemUpdate
from backend.app.core.rbac import get_current_user, CurrentUser

router = APIRouter()


@router.get("/", response_model=List[InventoryItemOut])
async def list_inventory(
    skip: int = 0,
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(select(InventoryItem).offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=InventoryItemOut, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(
    payload: InventoryItemCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    item = InventoryItem(
        **payload.model_dump(exclude={"factory_id"}),
        organization_id="11111111-1111-1111-1111-111111111111",
        factory_id=str(payload.factory_id),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/{sku}/reorder", status_code=status.HTTP_200_OK)
async def reorder_item(
    sku: str,
    quantity: int = Query(50),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(select(InventoryItem).where(InventoryItem.sku == sku))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Inventory item with SKU '{sku}' not found")

    item.quantity = min(item.quantity + quantity, item.max_capacity)
    item.status = "Optimal" if item.quantity >= item.min_threshold else item.status
    await db.commit()

    return {
        "status": "success",
        "message": f"Purchase order initiated for {sku} (+{quantity} units)",
        "sku": sku,
        "new_quantity": item.quantity,
    }


@router.patch("/{sku}", response_model=InventoryItemOut)
async def update_inventory_item(
    sku: str,
    payload: InventoryItemUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(select(InventoryItem).where(InventoryItem.sku == sku))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Inventory item with SKU '{sku}' not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item
