"""Machine health prediction endpoint.

Routes to the latest DEPLOYED adaptive model artifact for the authenticated tenant.
If no deployed adaptive model exists, uses the baseline ML predictor marked clearly
as mode="SYNTHETIC_BASELINE" so callers are explicitly aware.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.deps import TenantScope, get_tenant_user
from backend.app.core.rbac import CurrentUser
from backend.app.db.session import get_db_session
from backend.app.ml.predictor import MLPredictor
from backend.app.models.platform import MLModelRecord, ModelVersion
from backend.app.ai_engine.adaptive_intelligence import ArtifactInferenceService, AdaptiveSchemaIntelligence

router = APIRouter()


class MachinePredictRequest(BaseModel):
    machine_id: str
    temperature_deg_c: Optional[float] = 64.2
    vibration_mm_s: Optional[float] = 2.1
    hydraulic_pressure_bar: Optional[float] = 195.0
    thermal_gradient: Optional[float] = 1.2


@router.post("/machine")
async def predict_machine_health(
    req: MachinePredictRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_tenant_user),
):
    """Predict machine health using the latest DEPLOYED adaptive model for this tenant.

    If a custom model has been trained and promoted to DEPLOYED, its artifact is used.
    Otherwise, falls back to the baseline synthetic model marked explicitly with
    mode="SYNTHETIC_BASELINE" to prevent silent assumptions.
    """
    org_id = TenantScope.require_organization(current_user)

    # Check for a DEPLOYED model version for this organization
    stmt = (
        select(ModelVersion)
        .join(MLModelRecord, ModelVersion.model_id == MLModelRecord.id)
        .where(
            MLModelRecord.organization_id == org_id,
            ModelVersion.status == "deployed",
        )
        .order_by(desc(ModelVersion.created_at))
        .limit(1)
    )
    version = (await db.execute(stmt)).scalars().first()

    telemetry = req.model_dump()

    # If adaptive production model is deployed and artifact exists, use it
    if version and version.artifact_path:
        from pathlib import Path

        try:
            inference = ArtifactInferenceService(Path(version.artifact_path))
            model_features = inference.metadata["feature_columns"]

            # Single source of truth: map request telemetry keys -> canonical
            # fields -> the model's actual feature columns (schema adaptation).
            telemetry_canon = {
                m.source: m.canonical
                for m in AdaptiveSchemaIntelligence.map_columns(telemetry.keys())
                if m.canonical
            }
            canonical_to_feature: dict[str, str] = {}
            for m in AdaptiveSchemaIntelligence.map_columns(model_features):
                if m.canonical:
                    canonical_to_feature.setdefault(m.canonical, m.source)

            input_data: dict[str, object] = {}
            for key, value in telemetry.items():
                if key == "machine_id" or value is None:
                    continue
                canonical = telemetry_canon.get(key)
                feature = canonical_to_feature.get(canonical) if canonical else None
                input_data[feature or key] = value

            output = inference.predict(input_data)
            return {
                "machine_id": req.machine_id,
                "model_type": "ADAPTIVE_PRODUCTION",
                "model_version_id": str(version.id),
                "mode": "PRODUCTION",
                "input_telemetry": telemetry,
                "predictions": {
                    "failure_probability": output.get("confidence", 0.0),
                    "prediction": output.get("prediction"),
                    "feature_attributions": output.get("feature_attributions", {}),
                },
            }
        except Exception as exc:
            # Fail visible: a deployed model exists but inference failed. Never
            # silently substitute synthetic output for a production model error.
            raise HTTPException(
                status_code=422,
                detail=f"Adaptive model inference failed: {exc}",
            ) from exc

    # Baseline synthetic predictor fallback (explicitly labeled). Only reached
    # when NO deployed adaptive model exists for this tenant.
    predictions = MLPredictor.predict_machine_telemetry(telemetry)
    return {
        "machine_id": req.machine_id,
        "model_type": "SYNTHETIC_BASELINE",
        "mode": "SYNTHETIC_BASELINE",
        "notice": "Using synthetic baseline model. Upload a dataset, train a model, and promote to DEPLOYED for production predictions.",
        "input_telemetry": telemetry,
        "predictions": predictions,
    }
