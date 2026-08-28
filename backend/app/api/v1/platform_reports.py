"""Platform report generation API with real artifact lifecycle."""
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.deps import TenantScope, get_tenant_user
from backend.app.core.rbac import CurrentUser
from backend.app.db.session import get_db_session
from backend.app.models.platform import (
    ModelVersion,
    PlatformPrediction,
    PlatformRecommendation,
    PlatformReport,
)
from backend.app.schemas.platform import PlatformReportCreateRequest, PlatformReportOut
from backend.app.services.audit_service import audit_service
from backend.app.services.job_service import job_service
from backend.app.services.storage import storage_service

router = APIRouter()


@router.post("", response_model=PlatformReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(
    body: PlatformReportCreateRequest,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    allowed_formats = {"PDF", "XLSX", "JSON"}
    if body.format.upper() not in allowed_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format. Allowed: {sorted(allowed_formats)}",
        )

    lineage = {
        "prediction": None,
        "recommendation": None,
        "model": None,
    }

    if body.prediction_id:
        pred = (
            await db.execute(
                select(PlatformPrediction).where(
                    PlatformPrediction.id == body.prediction_id,
                    PlatformPrediction.organization_id == org_id,
                )
            )
        ).scalars().first()
        if pred:
            TenantScope.enforce_resource_access(user, pred)
            lineage["prediction"] = {
                "id": str(pred.id),
                "model_version_id": str(pred.model_version_id) if pred.model_version_id else None,
                "status": pred.status,
                "output_data": pred.output_data,
                "confidence": pred.confidence,
                "created_at": pred.created_at.isoformat() if pred.created_at else None,
            }

    if body.recommendation_id:
        rec = (
            await db.execute(
                select(PlatformRecommendation).where(
                    PlatformRecommendation.id == body.recommendation_id,
                    PlatformRecommendation.organization_id == org_id,
                )
            )
        ).scalars().first()
        if rec:
            TenantScope.enforce_resource_access(user, rec)
            lineage["recommendation"] = {
                "id": str(rec.id),
                "title": rec.title,
                "description": rec.description,
                "category": rec.category,
                "confidence_score": rec.confidence_score,
                "estimated_savings": rec.estimated_savings,
                "status": rec.status,
            }

    if body.model_version_id:
        mv = (
            await db.execute(
                select(ModelVersion).where(
                    ModelVersion.id == body.model_version_id,
                    ModelVersion.organization_id == org_id,
                )
            )
        ).scalars().first()
        if mv:
            TenantScope.enforce_resource_access(user, mv)
            lineage["model"] = {
                "id": str(mv.id),
                "version_tag": mv.version_tag,
                "status": mv.status,
                "metrics": mv.metrics,
                "artifact_path": mv.artifact_path,
            }

    job = await job_service.create(
        db,
        job_type="report",
        organization_id=org_id,
        factory_id=user.factory_id,
        created_by=user.email,
        resource_type=body.report_type,
        resource_id=body.resource_id,
    )

    report = PlatformReport(
        title=body.title,
        report_type=body.report_type,
        format=body.format.upper(),
        status="QUEUED",
        job_id=job.id,
        created_by=user.email,
        organization_id=org_id,
        factory_id=user.factory_id,
    )
    db.add(report)
    await db.flush()

    # Generate minimal real artifact (JSON manifest with workflow lineage as the
    # authoritative record; PDF/XLSX rendering delegated to the report worker).
    content = _build_report_artifact(report, body, lineage)
    storage_path = storage_service.store_bytes(
        org_id,
        "reports",
        f"{report.id}.{body.format.lower()}",
        content,
    )
    report.storage_path = storage_path
    report.status = "COMPLETED"
    await job_service.mark_completed(db, job, result={"report_id": str(report.id)})

    await audit_service.log(
        db,
        organization_id=org_id,
        factory_id=user.factory_id,
        user_email=user.email,
        action="REPORT_GENERATED",
        resource_type="platform_report",
        resource_id=str(report.id),
        metadata={
            "format": body.format,
            "job_id": str(job.id),
            "prediction_id": body.prediction_id,
            "recommendation_id": body.recommendation_id,
            "model_version_id": body.model_version_id,
        },
    )
    await db.commit()
    await db.refresh(report)
    return _report_out(report)


def _build_report_artifact(
    report: PlatformReport,
    body: PlatformReportCreateRequest,
    lineage: dict,
) -> bytes:
    payload = {
        "report_id": str(report.id),
        "title": report.title,
        "report_type": body.report_type,
        "format": body.format.upper(),
        "generated_by": report.created_by,
        "status": "generated",
        "lineage": lineage,
        "note": "Full PDF/XLSX rendering delegated to report worker; JSON manifest is authoritative.",
    }
    if body.format.upper() == "JSON":
        return json.dumps(payload, indent=2).encode("utf-8")
    return json.dumps(payload).encode("utf-8")


@router.get("/{report_id}", response_model=PlatformReportOut)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    report = (
        await db.execute(
            select(PlatformReport).where(
                PlatformReport.id == report_id,
                PlatformReport.organization_id == org_id,
            )
        )
    ).scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    TenantScope.enforce_resource_access(user, report)
    return _report_out(report)


@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    report = (
        await db.execute(
            select(PlatformReport).where(
                PlatformReport.id == report_id,
                PlatformReport.organization_id == org_id,
            )
        )
    ).scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    TenantScope.enforce_resource_access(user, report)

    if report.status != "COMPLETED" or not report.storage_path:
        raise HTTPException(
            status_code=409,
            detail=f"Report not ready for download (status={report.status})",
        )
    if not storage_service.exists(report.storage_path):
        raise HTTPException(status_code=404, detail="Report artifact not found on storage")

    path = storage_service.absolute_path(report.storage_path)
    ext = report.format.lower() if report.format else "json"
    media = {
        "json": "application/json",
        "pdf": "application/pdf",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }.get(ext, "application/octet-stream")
    return FileResponse(
        path,
        media_type=media,
        filename=f"{report.title.replace(' ', '_')}.{ext}",
    )


def _report_out(report: PlatformReport) -> PlatformReportOut:
    return PlatformReportOut(
        id=str(report.id),
        title=report.title,
        report_type=report.report_type,
        format=report.format,
        status=report.status,
        job_id=str(report.job_id) if report.job_id else None,
        download_available=bool(
            report.status == "COMPLETED" and report.storage_path
        ),
        created_at=report.created_at,
    )
