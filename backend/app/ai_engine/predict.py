import numpy as np
import pandas as pd
from typing import Dict, Any
from backend.app.ai_engine.preprocessing.tabular import tabular_preprocessor
from backend.app.ai_engine.feature_engineering import feature_extractor

class ProductionPredictor:
    """Batch and single-instance prediction wrapper for industrial telemetry."""
    def __init__(self, classifier_model, regressor_model, feature_cols: list):
        self.classifier = classifier_model
        self.regressor = regressor_model
        self.feature_cols = feature_cols

    def predict_telemetry(self, raw_input: Dict[str, Any]) -> Dict[str, Any]:
        df = pd.DataFrame([raw_input])
        df_feat = feature_extractor.compute_features(df)
        
        # Ensure all columns present
        for col in self.feature_cols:
            if col not in df_feat.columns:
                df_feat[col] = 0.0

        X = df_feat[self.feature_cols].values
        
        # Inferences
        prob = float(self.classifier.predict_proba(X)[0][1]) if hasattr(self.classifier, "predict_proba") else 0.1
        rul = float(self.regressor.predict(X)[0]) if self.regressor else 450.0

        return {
            "failure_probability": round(prob, 3),
            "failure_risk_level": "Critical" if prob > 0.7 else "Warning" if prob > 0.3 else "Normal",
            "predicted_rul_hours": round(max(0.0, rul), 1),
            "health_score": round(max(0.0, min(100.0, 100.0 - prob * 70.0)), 1),
        }
