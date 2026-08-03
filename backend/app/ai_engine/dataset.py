import numpy as np
import pandas as pd
from typing import Tuple, List
from sklearn.model_selection import train_test_split
from backend.app.ai_engine.config import RANDOM_SEED, TRAIN_TEST_SPLIT_RATIO

class IndustrialDatasetLoader:
    """Generates and splits synthetic industrial benchmark dataset tensors for model training."""
    @staticmethod
    def load_synthetic_industrial_dataset(n_samples: int = 500) -> Tuple[pd.DataFrame, List[str], str]:
        np.random.seed(RANDOM_SEED)
        
        temps = np.random.normal(58.0, 12.0, n_samples)
        vibs = np.random.normal(2.2, 1.4, n_samples)
        pressures = np.random.normal(198.0, 15.0, n_samples)
        gradients = np.random.normal(0.6, 0.4, n_samples)

        # Labels: Failure target (1 if high temp/vib) and RUL target
        y_fail = ((temps > 76.0) | (vibs > 6.2)).astype(int)
        y_rul = np.maximum(0.0, 1000.0 - (temps * 4.5 + vibs * 45.0))

        df = pd.DataFrame({
            "temperature": temps,
            "vibration": vibs,
            "hydraulic_pressure": pressures,
            "thermal_gradient": gradients,
            "target_failure": y_fail,
            "target_rul": y_rul,
        })

        feature_cols = ["temperature", "vibration", "hydraulic_pressure", "thermal_gradient"]
        return df, feature_cols, "target_failure"

    @staticmethod
    def get_train_test_splits(
        df: pd.DataFrame, feature_cols: List[str], target_col: str
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        X = df[feature_cols].values
        y = df[target_col].values
        return train_test_split(X, y, train_size=TRAIN_TEST_SPLIT_RATIO, random_state=RANDOM_SEED)

dataset_loader = IndustrialDatasetLoader()
