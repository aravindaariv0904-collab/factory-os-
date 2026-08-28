from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from backend.app.db.session import get_db_session
from backend.app.models import Recommendation
from backend.app.schemas.ai import AIRecommendationOut
from backend.app.core.deps import TenantScope
from backend.app.core.rbac import get_current_user, CurrentUser

router = APIRouter()


@router.get("/", response_model=List[AIRecommendationOut])
async def list_recommendations(
    skip: int = 0,
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    org_id = TenantScope.require_organization(current_user)
    stmt = (
        select(Recommendation)
        .where(Recommendation.organization_id == org_id)
        .order_by(Recommendation.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
