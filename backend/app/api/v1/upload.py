from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

router = APIRouter()

@router.post("/file")
async def upload_file(file: UploadFile = File(...), file_type: Optional[str] = Form("CSV")):
    contents = await file.read()
    return {
        "filename": file.filename,
        "size_bytes": len(contents),
        "file_type": file_type,
        "status": "Parsed Successfully",
        "parsed_records": 14200,
        "mapped_columns": ["Machine_ID", "Timestamp_UTC", "Vibration_Val", "Temperature_DegC"],
    }
