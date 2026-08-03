from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.app.pipeline.ingestion import IndustrialDataIngestionPipeline

router = APIRouter()

@router.post("/file")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = IndustrialDataIngestionPipeline.process_file_upload(contents, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Data ingestion failed: {str(e)}")
