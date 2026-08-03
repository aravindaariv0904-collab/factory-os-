import numpy as np
import shap
from typing import Dict, Any, List

class SHAPExplainabilityPipeline:
    """Computes SHAP (SHapley Additive exPlanations) feature attributions for trained models."""
    def __init__(self, model, background_data: np.ndarray, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names
        # Sample background for SHAP Explainer
        bg_sample = background_data[:min(50, len(background_data))]
        self.explainer = shap.Explainer(self.model, bg_sample)

    def explain_instance(self, instance: np.ndarray) -> Dict[str, Any]:
        if instance.ndim == 1:
            instance = instance.reshape(1, -1)

        shap_values = self.explainer(instance)
        values = shap_values.values[0] if hasattr(shap_values, "values") else shap_values[0]
        
        if values.ndim > 1:
            values = values[:, 1]  # Select binary class 1

        feature_importance_map = {}
        for idx, col in enumerate(self.feature_names):
            feature_importance_map[col] = round(float(values[idx]), 4)

        # Generate reason codes
        top_feature = max(feature_importance_map, key=lambda k: abs(feature_importance_map[k]))
        return {
            "shap_values": feature_importance_map,
            "top_contributing_feature": top_feature,
            "primary_reason_code": f"RC-{top_feature.upper()[:3]}-01: Anomaly Contribution Detected",
        }
