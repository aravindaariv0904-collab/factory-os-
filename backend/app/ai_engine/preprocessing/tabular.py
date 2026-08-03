import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any
from sklearn.preprocessing import RobustScaler, StandardScaler
from sklearn.impute import SimpleImputer

class TabularDataPreprocessor:
    """Preprocesses industrial tabular sensor telemetry data."""
    def __init__(self):
        self.imputer = SimpleImputer(strategy="median")
        self.scaler = RobustScaler()
        self.is_fitted = False

    def fit_transform(self, df: pd.DataFrame, feature_cols: List[str]) -> np.ndarray:
        X = df[feature_cols].values
        # 1. Missing Value Imputation
        X_imputed = self.imputer.fit_transform(X)
        
        # 2. Extreme Outlier Clamping (Z-score 4.0 threshold)
        for col_idx in range(X_imputed.shape[1]):
            col = X_imputed[:, col_idx]
            mean = np.mean(col)
            std = np.std(col)
            if std > 0:
                X_imputed[:, col_idx] = np.clip(col, mean - 4.0 * std, mean + 4.0 * std)

        # 3. Robust Scaling
        X_scaled = self.scaler.fit_transform(X_imputed)
        self.is_fitted = True
        return X_scaled

    def transform(self, df: pd.DataFrame, feature_cols: List[str]) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("TabularDataPreprocessor must be fitted before calling transform.")
        X = df[feature_cols].values
        X_imputed = self.imputer.transform(X)
        return self.scaler.transform(X_imputed)

tabular_preprocessor = TabularDataPreprocessor()
