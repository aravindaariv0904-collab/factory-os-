import numpy as np
from typing import Dict, Any, List
from sklearn.ensemble import GradientBoostingClassifier, RandomForestRegressor
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

class IndustrialMLModelSuite:
    def __init__(self):
        self.gb_classifier = GradientBoostingClassifier(n_estimators=30, random_state=42)
        self.rf_regressor = RandomForestRegressor(n_estimators=30, random_state=42)
        self.is_fitted = False
        self._train_models()

    def _train_models(self):
        np.random.seed(42)
        X = np.random.normal(50, 10, (100, 4))
        y_class = (X[:, 0] > 55).astype(int)
        y_reg = 1000 - X[:, 0] * 5.0

        self.gb_classifier.fit(X, y_class)
        self.rf_regressor.fit(X, y_reg)
        self.is_fitted = True

    def evaluate_classifier_metrics(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        y_pred = self.gb_classifier.predict(X_test)
        y_prob = self.gb_classifier.predict_proba(X_test)[:, 1]

        cm = confusion_matrix(y_test, y_pred).tolist()
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        auc = float(roc_auc_score(y_test, y_prob)) if len(np.unique(y_test)) > 1 else 1.0

        return {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "confusion_matrix": cm,
            "feature_importances": [round(float(fi), 4) for fi in self.gb_classifier.feature_importances_],
        }

ml_suite = IndustrialMLModelSuite()
