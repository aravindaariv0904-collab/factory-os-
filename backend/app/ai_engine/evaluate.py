import numpy as np
from typing import Dict, Any
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    mean_absolute_error,
    root_mean_squared_error,
)

class ModelEvaluator:
    """Computes comprehensive classification and regression performance metrics."""
    @staticmethod
    def evaluate_classifier(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray = None) -> Dict[str, Any]:
        acc = float(accuracy_score(y_true, y_pred))
        prec = float(precision_score(y_true, y_pred, zero_division=0))
        rec = float(recall_score(y_true, y_pred, zero_division=0))
        f1 = float(f1_score(y_true, y_pred, zero_division=0))
        
        auc = 1.0
        if y_prob is not None and len(np.unique(y_true)) > 1:
            auc = float(roc_auc_score(y_true, y_prob))

        cm = confusion_matrix(y_true, y_pred).tolist()

        return {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "confusion_matrix": cm,
        }

    @staticmethod
    def evaluate_regressor(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(root_mean_squared_error(y_true, y_pred))
        return {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
        }

evaluator = ModelEvaluator()
