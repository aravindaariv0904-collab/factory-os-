from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime, timezone
from backend.app.db.session import get_db_session
from backend.app.models import Alert
from backend.app.schemas.ai import CriticalAlertOut
from backend.app.core.rbac import get_current_user, CurrentUser

router = APIRouter()


@router.get("/", response_model=List[CriticalAlertOut])
async def list_alerts(
    skip: int = 0,
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(select(Alert).order_by(Alert.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/{alert_id}/read", status_code=status.HTTP_200_OK)
async def mark_alert_read(
    alert_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(select(Alert).where(Alert.id == str(alert_id)))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    await db.commit()
    return {"status": "success", "message": "Alert marked as read", "alert_id": alert_id}


@router.post("/{alert_id}/resolve", status_code=status.HTTP_200_OK)
async def resolve_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(select(Alert).where(Alert.id == str(alert_id)))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_resolved = True
    alert.is_read = True
    alert.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "success", "message": "Alert resolved", "alert_id": alert_id}
