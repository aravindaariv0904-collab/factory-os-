"""ML model registry platform API."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel
from backend.app.core.deps import TenantScope, get_tenant_user
from backend.app.core.rbac import CurrentUser
from backend.app.db.session import get_db_session
from backend.app.models.platform import MLModelRecord, ModelVersion
from backend.app.schemas.platform import ModelDetail, ModelSummary
from backend.app.services.audit_service import audit_service

router = APIRouter()


@router.get("", response_model=list[ModelSummary])
async def list_models(
    skip: int = 0,
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    stmt = (
        select(MLModelRecord)
        .where(MLModelRecord.organization_id == org_id)
        .order_by(desc(MLModelRecord.created_at))
        .offset(skip)
        .limit(limit)
    )
    if user.factory_id:
        stmt = stmt.where(
            (MLModelRecord.factory_id == user.factory_id)
            | (MLModelRecord.factory_id.is_(None))
        )
    models = (await db.execute(stmt)).scalars().all()
    summaries = []
    for model in models:
        ver = (
            await db.execute(
                select(ModelVersion)
                .where(ModelVersion.model_id == model.id)
                .order_by(desc(ModelVersion.created_at))
                .limit(1)
            )
        ).scalars().first()
        summaries.append(
            ModelSummary(
                id=str(model.id),
                name=model.name,
                task_type=model.task_type,
                status=model.status,
                latest_version=ver.version_tag if ver else None,
            )
        )
    return summaries


@router.get("/{model_id}", response_model=ModelDetail)
async def get_model(
    model_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    model = (
        await db.execute(
            select(MLModelRecord).where(
                MLModelRecord.id == model_id,
                MLModelRecord.organization_id == org_id,
            )
        )
    ).scalars().first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    TenantScope.enforce_resource_access(user, model)

    versions = (
        await db.execute(
            select(ModelVersion)
            .where(ModelVersion.model_id == model_id)
            .order_by(desc(ModelVersion.created_at))
        )
    ).scalars().all()
    return ModelDetail(
        id=str(model.id),
        name=model.name,
        task_type=model.task_type,
        description=model.description,
        status=model.status,
        versions=[
            {
                "id": str(v.id),
                "version_tag": v.version_tag,
                "status": v.status,
                "metrics": v.metrics,
                "artifact_path": v.artifact_path,
            }
            for v in versions
        ],
    )


@router.get("/{model_id}/versions", response_model=list[dict])
async def list_model_versions(
    model_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    model = (
        await db.execute(
            select(MLModelRecord).where(
                MLModelRecord.id == model_id,
                MLModelRecord.organization_id == org_id,
            )
        )
    ).scalars().first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    TenantScope.enforce_resource_access(user, model)

    versions = (
        await db.execute(
            select(ModelVersion)
            .where(ModelVersion.model_id == model_id)
            .order_by(desc(ModelVersion.created_at))
        )
    ).scalars().all()
    return [
        {
            "id": str(v.id),
            "version_tag": v.version_tag,
            "status": v.status,
            "metrics": v.metrics,
            "preprocessing_hash": v.preprocessing_hash,
            "created_at": v.created_at.isoformat(),
        }
        for v in versions
    ]


class ModelPromoteRequest(BaseModel):
    min_f1: Optional[float] = None
    max_fnr: Optional[float] = None


@router.post("/{model_id}/versions/{version_id}/promote")
async def promote_model_version(
    model_id: str,
    version_id: str,
    body: Optional[ModelPromoteRequest] = None,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    if user.role not in ["Engineer", "Plant Manager", "Admin"]:
        raise HTTPException(status_code=403, detail=f"User role '{user.role}' is not authorized to promote models")

    version = (
        await db.execute(
            select(ModelVersion).where(
                ModelVersion.id == version_id,
                ModelVersion.model_id == model_id,
                ModelVersion.organization_id == org_id,
            )
        )
    ).scalars().first()
    if not version:
        raise HTTPException(status_code=404, detail="Model version not found")

    metrics = version.metrics or {}
    f1 = metrics.get("f1", 1.0)
    fnr = metrics.get("fnr", 0.0)
    min_f1 = body.min_f1 if (body and body.min_f1 is not None) else 0.70
    max_fnr = body.max_fnr if (body and body.max_fnr is not None) else 0.30

    if f1 < min_f1:
        raise HTTPException(
            status_code=422,
            detail=f"Model promotion rejected: F1 score ({f1:.3f}) below required threshold ({min_f1:.3f})",
        )
    if fnr > max_fnr:
        raise HTTPException(
            status_code=422,
            detail=f"Model promotion rejected: False Negative Rate ({fnr:.3f}) exceeds maximum threshold ({max_fnr:.3f})",
        )

    currently_deployed = (
        await db.execute(
            select(ModelVersion).where(
                ModelVersion.model_id == model_id,
                ModelVersion.organization_id == org_id,
                ModelVersion.status == "deployed",
            )
        )
    ).scalars().all()
    for prev in currently_deployed:
        prev.status = "retired"

    version.status = "deployed"
    model = (
        await db.execute(
            select(MLModelRecord).where(
                MLModelRecord.id == model_id,
                MLModelRecord.organization_id == org_id,
            )
        )
    ).scalars().first()
    if model:
        model.status = "deployed"

    await audit_service.log(
        db,
        organization_id=org_id,
        factory_id=user.factory_id,
        user_email=user.email,
        action="MODEL_PROMOTED",
        resource_type="model_version",
        resource_id=str(version.id),
        metadata={"f1": f1, "fnr": fnr, "status": "deployed"},
    )
    await db.commit()
    await db.refresh(version)
    return {"id": str(version.id), "status": version.status, "version_tag": version.version_tag}


@router.post("/{model_id}/versions/{version_id}/retire")
async def retire_model_version(
    model_id: str,
    version_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    if user.role not in ["Engineer", "Plant Manager", "Admin"]:
        raise HTTPException(status_code=403, detail=f"User role '{user.role}' is not authorized to retire models")

    version = (
        await db.execute(
            select(ModelVersion).where(
                ModelVersion.id == version_id,
                ModelVersion.model_id == model_id,
                ModelVersion.organization_id == org_id,
            )
        )
    ).scalars().first()
    if not version:
        raise HTTPException(status_code=404, detail="Model version not found")

    version.status = "retired"
    await audit_service.log(
        db,
        organization_id=org_id,
        factory_id=user.factory_id,
        user_email=user.email,
        action="MODEL_RETIRED",
        resource_type="model_version",
        resource_id=str(version.id),
        metadata={"status": "retired"},
    )
    await db.commit()
    return {"id": str(version.id), "status": version.status}

