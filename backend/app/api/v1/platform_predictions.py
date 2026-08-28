"""Platform prediction API with explainability."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.deps import TenantScope, get_tenant_user
from backend.app.core.rbac import CurrentUser
from backend.app.db.session import get_db_session
from backend.app.models.platform import ModelVersion, PlatformPrediction
from backend.app.schemas.platform import (
    PredictionCreateRequest,
    PredictionExplanationOut,
    PredictionOut,
)
from backend.app.services.audit_service import audit_service

router = APIRouter()


@router.post("", response_model=PredictionOut, status_code=status.HTTP_201_CREATED)
async def create_prediction(
    body: PredictionCreateRequest,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    version = (
        await db.execute(
            select(ModelVersion).where(
                ModelVersion.id == body.model_version_id,
                ModelVersion.organization_id == org_id,
            )
        )
    ).scalars().first()
    if not version:
        raise HTTPException(status_code=404, detail="Model version not found")
    TenantScope.enforce_resource_access(user, version)

    if not version.artifact_path:
        raise HTTPException(
            status_code=409,
            detail="Model version has no deployed artifact",
        )

    from pathlib import Path

    from backend.app.ai_engine.adaptive_intelligence import ArtifactInferenceService

    try:
        inference = ArtifactInferenceService(Path(version.artifact_path))
        output = inference.predict(body.input_data)
    except FileNotFoundError:
        raise HTTPException(
            status_code=409,
            detail="Model artifact file not found on storage",
        ) from None
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    prediction = PlatformPrediction(
        model_version_id=version.id,
        input_data=body.input_data,
        output_data=output,
        explanation={"feature_attributions": output.get("feature_attributions", {})},
        confidence=output.get("confidence"),
        status="completed",
        organization_id=org_id,
        factory_id=user.factory_id,
    )
    db.add(prediction)
    await audit_service.log(
        db,
        organization_id=org_id,
        factory_id=user.factory_id,
        user_email=user.email,
        action="PREDICTION_CREATED",
        resource_type="platform_prediction",
        resource_id=str(prediction.id),
        metadata={"model_version_id": str(version.id)},
    )
    await db.commit()
    await db.refresh(prediction)
    return PredictionOut(
        id=str(prediction.id),
        model_version_id=str(prediction.model_version_id),
        status=prediction.status,
        output_data=prediction.output_data,
        confidence=prediction.confidence,
        created_at=prediction.created_at,
    )


@router.get("/{prediction_id}", response_model=PredictionOut)
async def get_prediction(
    prediction_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    prediction = (
        await db.execute(
            select(PlatformPrediction).where(
                PlatformPrediction.id == prediction_id,
                PlatformPrediction.organization_id == org_id,
            )
        )
    ).scalars().first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    TenantScope.enforce_resource_access(user, prediction)
    return PredictionOut(
        id=str(prediction.id),
        model_version_id=str(prediction.model_version_id),
        status=prediction.status,
        output_data=prediction.output_data,
        confidence=prediction.confidence,
        created_at=prediction.created_at,
    )


@router.get("/{prediction_id}/explanation", response_model=PredictionExplanationOut)
async def get_prediction_explanation(
    prediction_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    prediction = (
        await db.execute(
            select(PlatformPrediction).where(
                PlatformPrediction.id == prediction_id,
                PlatformPrediction.organization_id == org_id,
            )
        )
    ).scalars().first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    TenantScope.enforce_resource_access(user, prediction)
    if not prediction.explanation:
        raise HTTPException(status_code=409, detail="Explanation not available")
    return PredictionExplanationOut(
        prediction_id=str(prediction.id),
        explanation=prediction.explanation,
        model_version_id=str(prediction.model_version_id),
    )
