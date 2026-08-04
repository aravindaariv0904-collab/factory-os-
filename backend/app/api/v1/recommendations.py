from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from backend.app.db.session import get_db_session
from backend.app.models import Recommendation
from backend.app.schemas.ai import AIRecommendationOut

router = APIRouter()


@router.get("/", response_model=List[AIRecommendationOut])
async def list_recommendations(
    skip: int = 0,
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(select(Recommendation).order_by(Recommendation.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()
