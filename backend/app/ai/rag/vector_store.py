import numpy as np
from typing import List, Dict, Any

class ManufacturingVectorStore:
    def __init__(self):
        self.documents: List[Dict[str, Any]] = [
            {
                "id": "doc_01",
                "title": "SOP-MECH-409: DMG MORI CNC Spindle Maintenance & Calibration Protocol",
                "category": "SOP",
                "content": "Spindle harmonic vibration exceeding 3.8 mm/s indicates ceramic bearing raceway micro-pitting. Immediate replacement required within 48 hours to prevent shaft seizure.",
                "vector": np.array([0.85, 0.12, 0.45, 0.22]),
            },
            {
                "id": "doc_02",
                "title": "MAN-WLD-88: Trumpf Fiber Laser Welding Operation & Safety Guide v4.2",
                "category": "Manual",
                "content": "Assist-gas pressure regulation must remain between 4.0 and 4.5 Bar. Pressure drops below 4.0 Bar cause weld porosity and joint seam structural degradation.",
                "vector": np.array([0.15, 0.92, 0.35, 0.10]),
            },
            {
                "id": "doc_03",
                "title": "SPEC-QUAL-001: Automotive Body Stamping Tolerance Specifications ISO-9001",
                "category": "Quality Spec",
                "content": "Hydraulic press force calibration variance tolerance must not exceed +/- 1.5%. Micro-scratches exceeding 0.2mm depth require immediate sheet metal quarantine.",
                "vector": np.array([0.30, 0.40, 0.88, 0.15]),
            },
        ]

    def search(self, query_text: str, top_k: int = 2) -> List[Dict[str, Any]]:
        # Generate query vector embedding simulation
        query_lower = query_text.lower()
        if "vibration" in query_lower or "spindle" in query_lower or "cnc" in query_lower:
            q_vec = np.array([0.88, 0.10, 0.40, 0.20])
        elif "laser" in query_lower or "weld" in query_lower or "gas" in query_lower:
            q_vec = np.array([0.10, 0.95, 0.30, 0.10])
        else:
            q_vec = np.array([0.35, 0.35, 0.80, 0.20])

        results = []
        for doc in self.documents:
            dot_prod = np.dot(q_vec, doc["vector"])
            norm_a = np.linalg.norm(q_vec)
            norm_b = np.linalg.norm(doc["vector"])
            sim = float(dot_prod / (norm_a * norm_b))
            results.append({
                "id": doc["id"],
                "title": doc["title"],
                "category": doc["category"],
                "content": doc["content"],
                "similarity_score": round(sim, 3),
            })

        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:top_k]

rag_store = ManufacturingVectorStore()
