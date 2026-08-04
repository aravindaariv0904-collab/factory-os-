from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.pipeline.ingestion import IndustrialDataIngestionPipeline
from backend.app.db.session import get_db_session
from backend.app.models import DataUpload
from backend.app.core.rbac import get_current_user, CurrentUser

router = APIRouter()


@router.post("/file", status_code=status.HTTP_200_OK)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        contents = await file.read()
        result = IndustrialDataIngestionPipeline.process_file_upload(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Data ingestion failed: {str(e)}")

    record = DataUpload(
        filename=file.filename,
        file_type=file.content_type or "unknown",
        record_count=result.get("record_count", 0),
        status="completed",
        columns=result.get("columns", []),
        uploaded_by=current_user.email,
        organization_id="11111111-1111-1111-1111-111111111111",
    )
    db.add(record)
    await db.commit()

    return {
        **result,
        "upload_id": record.id,
        "uploaded_by": current_user.email,
    }


@router.get("/history")
async def list_uploads(
    db: AsyncSession = Depends(get_db_session),
):
    from sqlalchemy import select

    result = await db.execute(select(DataUpload).order_by(DataUpload.created_at.desc()).limit(20))
    uploads = result.scalars().all()
    return [
        {
            "id": u.id,
            "filename": u.filename,
            "file_type": u.file_type,
            "record_count": u.record_count,
            "status": u.status,
            "uploaded_by": u.uploaded_by,
            "created_at": u.created_at,
        }
        for u in uploads
    ]
