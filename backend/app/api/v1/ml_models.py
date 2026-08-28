"""ML model registry platform API."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.deps import TenantScope, get_tenant_user
from backend.app.core.rbac import CurrentUser
from backend.app.db.session import get_db_session
from backend.app.models.platform import MLModelRecord, ModelVersion
from backend.app.schemas.platform import ModelDetail, ModelSummary

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
