"""Dataset platform API — upload → profile → mapping → quality."""
from typing import Optional
from pydantic import BaseModel

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.deps import TenantScope, get_tenant_user
from backend.app.core.rbac import CurrentUser
from backend.app.db.session import get_db_session
from backend.app.models.platform import Dataset, DatasetVersion
from backend.app.schemas.platform import (
    DatasetCreateResponse,
    DatasetDetail,
    DatasetMappingOut,
    DatasetProfileOut,
    DatasetQualityOut,
    DatasetSummary,
    MappingApproveRequest,
)
from backend.app.services.audit_service import audit_service
from backend.app.services.dataset_service import dataset_service
from backend.app.services.job_service import job_service

router = APIRouter()


@router.post("", response_model=DatasetCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_dataset(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file upload")

    try:
        dataset, version = await dataset_service.create_from_upload(
            db,
            filename=file.filename or "upload.csv",
            content=content,
            organization_id=org_id,
            factory_id=user.factory_id,
            created_by=user.email,
            name=name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    job = await job_service.create(
        db,
        job_type="profile",
        organization_id=org_id,
        factory_id=user.factory_id,
        created_by=user.email,
        resource_type="dataset_version",
        resource_id=str(version.id),
    )

    await audit_service.log(
        db,
        organization_id=org_id,
        factory_id=user.factory_id,
        user_email=user.email,
        action="DATASET_UPLOADED",
        resource_type="dataset",
        resource_id=str(dataset.id),
        metadata={"filename": file.filename, "job_id": str(job.id)},
    )

    # Profile synchronously for now; Celery task wired for large files
    try:
        await dataset_service.profile_version(
            db, version, organization_id=org_id, user_email=user.email
        )
        await job_service.mark_completed(db, job, result={"version_id": str(version.id)})
    except Exception as exc:
        await job_service.mark_failed(db, job, str(exc))
        await db.commit()
        raise HTTPException(status_code=422, detail=f"Profiling failed: {exc}") from exc

    await db.commit()

    return DatasetCreateResponse(
        id=str(dataset.id),
        name=dataset.name,
        status=dataset.status,
        version_id=str(version.id),
        version_number=version.version_number,
        job_id=str(job.id),
    )


@router.get("", response_model=list[DatasetSummary])
async def list_datasets(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    rows = await dataset_service.list_datasets(
        db, org_id, factory_id=user.factory_id, limit=limit, offset=skip
    )
    return [DatasetSummary(**row) for row in rows]


@router.get("/{dataset_id}", response_model=DatasetDetail)
async def get_dataset(
    dataset_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    dataset = await dataset_service.get_dataset(db, dataset_id, org_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    TenantScope.enforce_resource_access(user, dataset)

    versions_result = await db.execute(
        select(DatasetVersion)
        .where(
            DatasetVersion.dataset_id == dataset_id,
            DatasetVersion.organization_id == org_id,
        )
        .order_by(desc(DatasetVersion.version_number))
    )
    versions = [
        {
            "id": str(v.id),
            "version_number": v.version_number,
            "status": v.status,
            "record_count": v.record_count,
            "mapping_approved": v.mapping_approved,
        }
        for v in versions_result.scalars().all()
    ]
    return DatasetDetail(
        id=str(dataset.id),
        name=dataset.name,
        description=dataset.description,
        source_type=dataset.source_type,
        status=dataset.status,
        created_at=dataset.created_at,
        updated_at=dataset.updated_at,
        versions=versions,
    )


async def _get_latest_version_or_404(
    db: AsyncSession, dataset_id: str, org_id: str, user: CurrentUser
) -> DatasetVersion:
    dataset = await dataset_service.get_dataset(db, dataset_id, org_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    TenantScope.enforce_resource_access(user, dataset)
    version = await dataset_service.get_latest_version(db, dataset_id, org_id)
    if not version:
        raise HTTPException(status_code=404, detail="No dataset version found")
    return version


@router.get("/{dataset_id}/profile", response_model=DatasetProfileOut)
async def get_dataset_profile(
    dataset_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    version = await _get_latest_version_or_404(db, dataset_id, org_id, user)
    if not version.profile:
        raise HTTPException(status_code=409, detail="Dataset has not been profiled yet")
    return DatasetProfileOut(
        dataset_id=dataset_id,
        version_id=str(version.id),
        version_number=version.version_number,
        record_count=version.record_count or 0,
        columns=version.columns or [],
        profile=version.profile,
        status=version.status,
    )


@router.get("/{dataset_id}/mapping", response_model=DatasetMappingOut)
async def get_dataset_mapping(
    dataset_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    version = await _get_latest_version_or_404(db, dataset_id, org_id, user)
    if not version.mapping:
        raise HTTPException(status_code=409, detail="Dataset mapping not available")
    mapping_data = version.mapping
    return DatasetMappingOut(
        dataset_id=dataset_id,
        version_id=str(version.id),
        mappings=mapping_data.get("mappings", []),
        mapping_approved=version.mapping_approved,
        target_column=mapping_data.get("target_column"),
    )


@router.post("/{dataset_id}/mapping/approve", response_model=DatasetMappingOut)
async def approve_dataset_mapping(
    dataset_id: str,
    body: MappingApproveRequest,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    version = await _get_latest_version_or_404(db, dataset_id, org_id, user)
    try:
        version = await dataset_service.approve_mapping(
            db,
            version,
            organization_id=org_id,
            user_email=user.email,
            approved=body.approved,
            target_column=body.target_column,
            mapping_overrides=body.mapping_overrides,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    await db.commit()
    mapping_data = version.mapping or {}
    return DatasetMappingOut(
        dataset_id=dataset_id,
        version_id=str(version.id),
        mappings=mapping_data.get("mappings", []),
        mapping_approved=version.mapping_approved,
        target_column=mapping_data.get("target_column"),
    )


@router.get("/{dataset_id}/quality", response_model=DatasetQualityOut)
async def get_dataset_quality(
    dataset_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    version = await _get_latest_version_or_404(db, dataset_id, org_id, user)
    if not version.quality:
        raise HTTPException(status_code=409, detail="Quality assessment not available")
    quality = version.quality
    return DatasetQualityOut(
        dataset_id=dataset_id,
        version_id=str(version.id),
        quality_status=quality.get("status", "UNKNOWN"),
        issues=quality.get("issues", []),
        warnings=quality.get("warnings", []),
    )


class DatasetTrainRequest(BaseModel):
    target_column: Optional[str] = None
    allow_review: bool = True


@router.post("/{dataset_id}/train", status_code=status.HTTP_201_CREATED)
async def train_dataset(
    dataset_id: str,
    body: Optional[DatasetTrainRequest] = None,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    version = await _get_latest_version_or_404(db, dataset_id, org_id, user)

    req_body = body or DatasetTrainRequest()

    job = await job_service.create(
        db,
        job_type="train",
        organization_id=org_id,
        factory_id=user.factory_id,
        created_by=user.email,
        resource_type="dataset_version",
        resource_id=str(version.id),
    )

    try:
        model_record, model_ver = await dataset_service.train_from_version(
            db,
            version,
            organization_id=org_id,
            user_email=user.email,
            target_column=req_body.target_column,
            allow_review=req_body.allow_review,
        )
        await job_service.mark_completed(
            db, job, result={"model_id": str(model_record.id), "version_id": str(model_ver.id)}
        )
        await db.commit()
    except ValueError as exc:
        await job_service.mark_failed(db, job, str(exc))
        await db.commit()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        await job_service.mark_failed(db, job, str(exc))
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Training failed: {exc}") from exc

    return {
        "job_id": str(job.id),
        "model_id": str(model_record.id),
        "model_name": model_record.name,
        "version_id": str(model_ver.id),
        "version_tag": model_ver.version_tag,
        "status": model_ver.status,
        "artifact_path": model_ver.artifact_path,
        "metrics": model_ver.metrics,
    }

