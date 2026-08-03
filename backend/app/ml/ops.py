import numpy as np
from typing import Dict, Any, List
from scipy.stats import ks_2samp

class MLOpsRegistry:
    """MLOps platform tracking experiments, model versions, and drift detection."""
    def __init__(self):
        self.experiments: List[Dict[str, Any]] = []
        self.reference_distribution = np.random.normal(50, 10, 100)

    def log_experiment(self, model_name: str, metrics: Dict[str, Any], version: str = "v3.5.0"):
        exp = {
            "model_name": model_name,
            "version": version,
            "metrics": metrics,
            "status": "Deployed",
        }
        self.experiments.append(exp)
        return exp

    def detect_data_drift(self, current_telemetry: List[float], alpha: float = 0.05) -> Dict[str, Any]:
        """Detects distribution drift using 2-sample Kolmogorov-Smirnov test."""
        if len(current_telemetry) < 10:
            return {"is_drift_detected": False, "p_value": 1.0}

        stat, p_val = ks_2samp(self.reference_distribution, current_telemetry)
        is_drift = bool(p_val < alpha)
        return {
            "is_drift_detected": is_drift,
            "ks_statistic": round(float(stat), 4),
            "p_value": round(float(p_val), 4),
            "recommend_retraining": is_drift,
        }

mlops_registry = MLOpsRegistry()
