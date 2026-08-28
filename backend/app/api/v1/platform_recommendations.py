"""Platform recommendation approval workflow API."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.deps import TenantScope, get_tenant_user
from backend.app.core.rbac import CurrentUser
from backend.app.db.session import get_db_session
from backend.app.models.platform import PlatformRecommendation
from backend.app.schemas.platform import RecommendationActionRequest
from backend.app.services.audit_service import audit_service

router = APIRouter()


@router.get("", response_model=list[dict])
async def list_platform_recommendations(
    skip: int = 0,
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    stmt = (
        select(PlatformRecommendation)
        .where(PlatformRecommendation.organization_id == org_id)
        .order_by(desc(PlatformRecommendation.created_at))
        .offset(skip)
        .limit(limit)
    )
    if user.factory_id:
        stmt = stmt.where(
            (PlatformRecommendation.factory_id == user.factory_id)
            | (PlatformRecommendation.factory_id.is_(None))
        )
    recs = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": str(r.id),
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "confidence_score": r.confidence_score,
            "estimated_savings": r.estimated_savings,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in recs
    ]


async def _get_recommendation_or_404(
    db: AsyncSession, rec_id: str, org_id: str
) -> PlatformRecommendation:
    rec = (
        await db.execute(
            select(PlatformRecommendation).where(
                PlatformRecommendation.id == rec_id,
                PlatformRecommendation.organization_id == org_id,
            )
        )
    ).scalars().first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return rec


@router.post("/{recommendation_id}/approve")
async def approve_recommendation(
    recommendation_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    rec = await _get_recommendation_or_404(db, recommendation_id, org_id)
    TenantScope.enforce_resource_access(user, rec)
    rec.status = "approved"
    rec.approved_by = user.email
    await audit_service.log(
        db,
        organization_id=org_id,
        factory_id=user.factory_id,
        user_email=user.email,
        action="RECOMMENDATION_APPROVED",
        resource_type="platform_recommendation",
        resource_id=str(rec.id),
    )
    await db.commit()
    return {"id": str(rec.id), "status": rec.status}


@router.post("/{recommendation_id}/reject")
async def reject_recommendation(
    recommendation_id: str,
    body: RecommendationActionRequest,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    rec = await _get_recommendation_or_404(db, recommendation_id, org_id)
    TenantScope.enforce_resource_access(user, rec)
    rec.status = "rejected"
    rec.rejection_reason = body.reason
    await audit_service.log(
        db,
        organization_id=org_id,
        factory_id=user.factory_id,
        user_email=user.email,
        action="RECOMMENDATION_REJECTED",
        resource_type="platform_recommendation",
        resource_id=str(rec.id),
        metadata={"reason": body.reason},
    )
    await db.commit()
    return {"id": str(rec.id), "status": rec.status}


@router.post("/{recommendation_id}/verify")
async def verify_recommendation(
    recommendation_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: CurrentUser = Depends(get_tenant_user),
):
    org_id = TenantScope.require_organization(user)
    rec = await _get_recommendation_or_404(db, recommendation_id, org_id)
    TenantScope.enforce_resource_access(user, rec)
    if rec.status != "approved":
        raise HTTPException(
            status_code=409,
            detail="Recommendation must be approved before verification",
        )
    rec.status = "verified"
    rec.verified_by = user.email
    await audit_service.log(
        db,
        organization_id=org_id,
        factory_id=user.factory_id,
        user_email=user.email,
        action="RECOMMENDATION_VERIFIED",
        resource_type="platform_recommendation",
        resource_id=str(rec.id),
    )
    await db.commit()
    return {"id": str(rec.id), "status": rec.status}
