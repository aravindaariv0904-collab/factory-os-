# Factory OS — ML Model Contracts & Lifecycle

## 1. Model Registry Specification
All production models must be versioned, reproducible, and exportable in Joblib and ONNX formats.

| Model ID | Target Task | Algorithm | Input Feature Set | Evaluation Metric Target |
| :--- | :--- | :--- | :--- | :--- |
| `factoryos_failure_classifier` | Multi-class Defect Prediction | Random Forest / XGBoost | Temp, Vibration, RPM, Torque, Wear | F1-Macro >= 0.88, ROC-AUC >= 0.92 |
| `factoryos_rul_regressor` | Remaining Useful Life (RUL) | Gradient Boosting Regressor | Telemetry rolling averages (5m, 1h) | RMSE <= 12.5 hrs, R2 >= 0.85 |
| `factoryos_anomaly_detector` | Real-time Sensor Anomaly | Isolation Forest | Multi-variate normalized sensors | Precision@K >= 0.90 |

## 2. Explainability & Trust Requirements
- Every inference response must supply local SHAP feature attribution weights.
- Models must not predict out-of-distribution values silently without flagging low confidence (< 0.70).
