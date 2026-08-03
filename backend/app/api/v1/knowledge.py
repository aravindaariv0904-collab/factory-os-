from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from backend.app.ai.rag.vector_store import rag_store

router = APIRouter()

class RAGSearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 2

@router.post("/search")
async def search_knowledge_base(req: RAGSearchRequest):
    results = rag_store.search(req.query, top_k=req.top_k or 2)
    return {
        "query": req.query,
        "results_count": len(results),
        "documents": results,
    }
