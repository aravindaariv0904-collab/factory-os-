import os
import joblib
import pickle
from pathlib import Path
from typing import Any, Dict
from backend.app.ai_engine.config import MODEL_EXPORTS_DIR

class ModelExporter:
    """Exports trained AI models into joblib and pickle binary formats for production deployment."""
    @staticmethod
    def export_joblib(model: Any, model_name: str) -> str:
        filepath = MODEL_EXPORTS_DIR / f"{model_name}.joblib"
        joblib.dump(model, filepath)
        return str(filepath)

    @staticmethod
    def export_pickle(model: Any, model_name: str) -> str:
        filepath = MODEL_EXPORTS_DIR / f"{model_name}.pkl"
        with open(filepath, "wb") as f:
            pickle.dump(model, f)
        return str(filepath)

exporter = ModelExporter()
