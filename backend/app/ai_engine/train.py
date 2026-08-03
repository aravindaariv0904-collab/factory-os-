import os
import numpy as np
import pandas as pd
from typing import Dict, Any
from sklearn.ensemble import GradientBoostingClassifier, RandomForestRegressor, IsolationForest
from backend.app.ai_engine.config import MODEL_CONFIGS, MODEL_EXPORTS_DIR
from backend.app.ai_engine.dataset import dataset_loader
from backend.app.ai_engine.preprocessing.tabular import tabular_preprocessor
from backend.app.ai_engine.evaluate import evaluator
from backend.app.ai_engine.explainability import SHAPExplainabilityPipeline
from backend.app.ai_engine.export import exporter

class MasterAITrainingPipeline:
    """Master AI Training Pipeline orchestrating cross-validation, evaluation, SHAP explainability, and model exports."""
    def run_training_pipeline(self) -> Dict[str, Any]:
        # 1. Load Industrial Dataset
        df, feature_cols, target_col = dataset_loader.load_synthetic_industrial_dataset(n_samples=600)

        # 2. Preprocess & Scale
        X_scaled = tabular_preprocessor.fit_transform(df, feature_cols)
        y_fail = df[target_col].values
        y_rul = df["target_rul"].values

        # Train/Test Split
        X_train, X_test, y_train, y_test = dataset_loader.get_train_test_splits(df, feature_cols, target_col)
        _, _, y_train_rul, y_test_rul = dataset_loader.get_train_test_splits(df, feature_cols, "target_rul")

        # 3. Train Failure Risk Classifier
        clf_cfg = MODEL_CONFIGS["failure_classifier"]
        classifier = GradientBoostingClassifier(
            n_estimators=clf_cfg["n_estimators"],
            max_depth=clf_cfg["max_depth"],
            random_state=42,
        )
        classifier.fit(X_train, y_train)

        # Evaluate Classifier
        y_pred = classifier.predict(X_test)
        y_prob = classifier.predict_proba(X_test)[:, 1]
        clf_metrics = evaluator.evaluate_classifier(y_test, y_pred, y_prob)

        # 4. Train RUL Regressor
        reg_cfg = MODEL_CONFIGS["rul_regressor"]
        regressor = RandomForestRegressor(
            n_estimators=reg_cfg["n_estimators"],
            max_depth=reg_cfg["max_depth"],
            random_state=42,
        )
        regressor.fit(X_train, y_train_rul)
        y_pred_rul = regressor.predict(X_test)
        reg_metrics = evaluator.evaluate_regressor(y_test_rul, y_pred_rul)

        # 5. Train Anomaly Detector
        iso_cfg = MODEL_CONFIGS["anomaly_detector"]
        anomaly_detector = IsolationForest(
            contamination=iso_cfg["contamination"],
            random_state=42,
        )
        anomaly_detector.fit(X_train)

        # 6. Generate SHAP Explanations
        shap_pipeline = SHAPExplainabilityPipeline(classifier, X_train, feature_cols)
        sample_explanation = shap_pipeline.explain_instance(X_test[0])

        # 7. Export Model Binaries
        clf_path = exporter.export_joblib(classifier, "factoryos_failure_classifier")
        reg_path = exporter.export_joblib(regressor, "factoryos_rul_regressor")
        iso_path = exporter.export_joblib(anomaly_detector, "factoryos_anomaly_detector")

        return {
            "status": "Training Completed Successfully",
            "classifier_metrics": clf_metrics,
            "regressor_metrics": reg_metrics,
            "sample_shap_explanation": sample_explanation,
            "exported_models": [clf_path, reg_path, iso_path],
        }

if __name__ == "__main__":
    pipeline = MasterAITrainingPipeline()
    res = pipeline.run_training_pipeline()
    print("AI Training Pipeline Result:", res)
