from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime, timezone
from backend.app.db.session import get_db_session
from backend.app.models import SystemReport
from backend.app.core.deps import TenantScope
from backend.app.core.rbac import get_current_user, CurrentUser

router = APIRouter()


@router.get("/", response_model=List[dict])
async def list_reports(
    skip: int = 0,
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = TenantScope.require_organization(current_user)
    result = await db.execute(
        select(SystemReport)
        .where(SystemReport.organization_id == org_id)
        .order_by(SystemReport.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    reports = result.scalars().all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "category": r.category,
            "format": r.format,
            "status": r.status,
            "download_url": r.download_url,
            "created_at": r.created_at,
        }
        for r in reports
    ]


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_report(
    category: str = Query(...),
    format: str = Query("PDF"),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    report_id = f"rep_{int(datetime.now(timezone.utc).timestamp())}"
    title = f"Factory OS {category.title()} Report"
    org_id = TenantScope.require_organization(current_user)
    report = SystemReport(
        title=title,
        category=category,
        format=format.upper(),
        status="Ready",
        download_url=f"/api/v1/reports/download/{report_id}",
        created_by=current_user.email,
        organization_id=org_id,
        factory_id=current_user.factory_id,
    )
    db.add(report)
    await db.commit()

    return {
        "status": "Ready",
        "report_id": report.id,
        "category": category,
        "format": format.upper(),
        "download_url": report.download_url,
    }


@router.get("/download/{report_id}")
async def download_report(
    report_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"Legacy report {report_id} download not implemented. Use /api/v1/reports/platform/{{id}}/download.",
    )
