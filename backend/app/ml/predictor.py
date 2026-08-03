from typing import Dict, Any
import numpy as np
from backend.app.ml.models import ml_registry

class MLPredictor:
    @staticmethod
    def predict_machine_telemetry(telemetry: Dict[str, Any]) -> Dict[str, Any]:
        temp = float(telemetry.get("temperature_deg_c", telemetry.get("temperature", 50.0)))
        vib = float(telemetry.get("vibration_mm_s", telemetry.get("vibration", 1.5)))
        press = float(telemetry.get("hydraulic_pressure_bar", 200.0))
        grad = float(telemetry.get("thermal_gradient", 0.5))

        features = np.array([[temp, vib, press, grad]])
        scaled_features = ml_registry.scaler.transform(features)

        # 1. Failure Probability
        fail_prob = float(ml_registry.classifier.predict_proba(scaled_features)[0][1])

        # 2. RUL Prediction (Hours)
        predicted_rul = float(ml_registry.rul_regressor.predict(scaled_features)[0])

        # 3. Anomaly Flag (-1 is anomaly in IsolationForest)
        is_anomaly = bool(ml_registry.anomaly_detector.predict(scaled_features)[0] == -1)

        # 4. Computed Health Score (0 - 100)
        health_score = round(max(0.0, min(100.0, 100.0 - (fail_prob * 70.0 + (1000.0 - min(1000.0, predicted_rul)) * 0.03))), 1)

        return {
            "failure_probability": round(fail_prob, 3),
            "failure_risk_level": "High" if fail_prob > 0.6 else "Medium" if fail_prob > 0.3 else "Low",
            "predicted_rul_hours": round(max(0.0, predicted_rul), 1),
            "is_anomaly_detected": is_anomaly,
            "predicted_health_score": health_score,
        }
