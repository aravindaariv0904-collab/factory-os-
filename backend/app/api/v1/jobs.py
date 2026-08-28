"""Processing job lifecycle API."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.deps import TenantScope, get_tenant_user
from backend.app.core.rbac import CurrentUser
from backend.app.db.session import get_db_session
from backend.app.schemas.platform import JobCreateRequest, JobOut
from backend.app.services.audit_service import audit_service
from backend.app.services.job_service import job_service

router = APIRouter()


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def create_job(
    body: JobCreateRequest,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    allowed = {"ingest", "profile", "process", "train", "report"}
    if body.job_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid job_type. Allowed: {sorted(allowed)}",
        )

    job = await job_service.create(
        db,
        job_type=body.job_type,
        organization_id=org_id,
        factory_id=user.factory_id,
        created_by=user.email,
        resource_type=body.resource_type,
        resource_id=body.resource_id,
    )
    await audit_service.log(
        db,
        organization_id=org_id,
        factory_id=user.factory_id,
        user_email=user.email,
        action="JOB_CREATED",
        resource_type="processing_job",
        resource_id=str(job.id),
        metadata={"job_type": body.job_type},
    )
    await db.commit()
    await db.refresh(job)
    return _job_out(job)


@router.get("/{job_id}", response_model=JobOut)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    job = await job_service.get(db, job_id, org_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    TenantScope.enforce_resource_access(user, job)
    return _job_out(job)


def _job_out(job) -> JobOut:
    return JobOut(
        id=str(job.id),
        job_type=job.job_type,
        status=job.status,
        progress=job.progress or 0.0,
        resource_type=job.resource_type,
        resource_id=str(job.resource_id) if job.resource_id else None,
        celery_task_id=job.celery_task_id,
        error_message=job.error_message,
        result=job.result,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )
