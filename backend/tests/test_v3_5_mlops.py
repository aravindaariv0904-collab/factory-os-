import numpy as np
from backend.app.ml.advanced_models import ml_suite
from backend.app.ml.ops import mlops_registry

def test_ml_suite_evaluation_metrics():
    np.random.seed(42)
    X_test = np.random.normal(50, 10, (30, 4))
    y_test = (X_test[:, 0] > 55).astype(int)

    metrics = ml_suite.evaluate_classifier_metrics(X_test, y_test)
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1_score" in metrics
    assert "confusion_matrix" in metrics
    assert len(metrics["feature_importances"]) == 4

def test_mlops_drift_detection():
    # Normal telemetry -> No drift
    norm_telemetry = list(np.random.normal(50, 10, 50))
    drift_res1 = mlops_registry.detect_data_drift(norm_telemetry)
    assert drift_res1["is_drift_detected"] is False

    # Shifted telemetry -> Drift detected
    shifted_telemetry = list(np.random.normal(90, 5, 50))
    drift_res2 = mlops_registry.detect_data_drift(shifted_telemetry)
    assert drift_res2["is_drift_detected"] is True
    assert drift_res2["recommend_retraining"] is True
