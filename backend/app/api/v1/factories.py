from fastapi import APIRouter, Query
from typing import List
from uuid import uuid4
from datetime import datetime
from backend.app.schemas.factory import FactoryOut

router = APIRouter()

MOCK_FACTORIES_RESP = [
    {
        "id": uuid4(),
        "organization_id": uuid4(),
        "name": "Detroit Giga-Assembly Plant Alpha",
        "location": "Detroit, MI, USA",
        "type": "Automotive EV Manufacturing",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    },
    {
        "id": uuid4(),
        "organization_id": uuid4(),
        "name": "Stuttgart Precision Fab #4",
        "location": "Stuttgart, Germany",
        "type": "Robotic Powertrain Assembly",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    },
]

@router.get("/", response_model=List[FactoryOut])
async def list_factories(skip: int = 0, limit: int = Query(10, le=100)):
    return MOCK_FACTORIES_RESP[skip : skip + limit]
