"""Production RAG Engine using Sentence-Transformers embeddings and semantic cosine similarity search."""
import os
import numpy as np
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class SentenceTransformerRAGStore:
    """Production RAG Engine chunking documents and searching vector embeddings with sentence-transformers."""
    def __init__(self):
        self.embedding_model = None
        self.documents: List[Dict[str, Any]] = []
        self._init_embedding_model()
        self._seed_default_sop_documents()

    def _init_embedding_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            # Load lightweight, fast CPU embedding model
            self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("[RAG Store] sentence-transformers (all-MiniLM-L6-v2) initialized successfully.")
        except Exception as e:
            logger.warning(f"[RAG Store] sentence-transformers model loading fallback to normalized bag-of-words: {e}")

    def _encode_text(self, text: str) -> np.ndarray:
        if self.embedding_model:
            try:
                emb = self.embedding_model.encode(text, convert_to_numpy=True)
                return emb / (np.linalg.norm(emb) + 1e-9)
            except Exception as e:
                logger.error(f"[RAG Store] Encoding error: {e}")

        # High-dimensional fallback vector based on hashing
        words = text.lower().split()
        vec = np.zeros(384, dtype=np.float32)
        for w in words:
            idx = hash(w) % 384
            vec[idx] += 1.0
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 0 else vec

    def _seed_default_sop_documents(self):
        raw_docs = [
            {
                "id": "doc_01",
                "title": "SOP-MECH-409: DMG MORI CNC Spindle Maintenance & Calibration Protocol",
                "category": "SOP",
                "content": "Spindle harmonic vibration exceeding 3.8 mm/s indicates ceramic bearing raceway micro-pitting. Immediate replacement required within 48 hours to prevent shaft seizure. Use replacement bearing part SPR-SPINDLE-MORI-09 located in Tool Crib 03.",
            },
            {
                "id": "doc_02",
                "title": "MAN-WLD-88: Trumpf Fiber Laser Welding Operation & Safety Guide v4.2",
                "category": "Manual",
                "content": "Assist-gas pressure regulation must remain between 4.0 and 4.5 Bar. Pressure drops below 4.0 Bar cause weld porosity and joint seam structural degradation. Lowering assist-gas flow by 6.2% during thermal ramp-up maintains weld integrity while boosting First Pass Yield by +1.8%.",
            },
            {
                "id": "doc_03",
                "title": "SPEC-QUAL-001: Automotive Body Stamping Tolerance Specifications ISO-9001",
                "category": "Quality Spec",
                "content": "Hydraulic press force calibration variance tolerance must not exceed +/- 1.5%. Micro-scratches exceeding 0.2mm depth require immediate sheet metal quarantine. Inspect Cylinder B-2 during high-speed cycle for hydraulic fluid pressure decay.",
            },
        ]
        for doc in raw_docs:
            vec = self._encode_text(doc["content"])
            self.documents.append({**doc, "vector": vec})

    def add_document(self, title: str, category: str, content: str) -> str:
        doc_id = f"doc_{len(self.documents) + 1:02d}"
        vec = self._encode_text(content)
        self.documents.append({
            "id": doc_id,
            "title": title,
            "category": category,
            "content": content,
            "vector": vec,
        })
        return doc_id

    def search(self, query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not self.documents:
            return []

        q_vec = self._encode_text(query_text)
        results = []
        for doc in self.documents:
            sim = float(np.dot(q_vec, doc["vector"]))
            results.append({
                "id": doc["id"],
                "title": doc["title"],
                "category": doc["category"],
                "content": doc["content"],
                "similarity_score": round(max(0.0, min(1.0, (sim + 1.0) / 2.0)), 3),
            })

        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:top_k]

rag_store = SentenceTransformerRAGStore()
