from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from backend.app.db.session import get_db_session
from backend.app.models import QualityReport
from backend.app.schemas.quality import QualityReportOut, QualityReportCreate
from backend.app.core.rbac import get_current_user, CurrentUser

router = APIRouter()


@router.get("/reports", response_model=List[QualityReportOut])
async def list_quality_reports(
    skip: int = 0,
    limit: int = Query(10, le=100),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(select(QualityReport).offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/reports", response_model=QualityReportOut, status_code=status.HTTP_201_CREATED)
async def create_quality_report(
    payload: QualityReportCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    report = QualityReport(
        **payload.model_dump(exclude={"machine_id"}),
        organization_id="11111111-1111-1111-1111-111111111111",
        machine_id=str(payload.machine_id),
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report
