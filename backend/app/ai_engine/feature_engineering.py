import numpy as np
import pandas as pd
from typing import List, Dict, Any

class IndustrialFeatureExtractor:
    """Extracts composite industrial features: rolling averages, thermal gradient, and health score."""
    @staticmethod
    def compute_features(df: pd.DataFrame) -> pd.DataFrame:
        data = df.copy()
        
        # 1. Rolling Moving Averages (5-period window)
        if "temperature" in data.columns:
            data["rolling_temp_avg_5"] = data["temperature"].rolling(window=5, min_periods=1).mean()
        if "vibration" in data.columns:
            data["rolling_vib_avg_5"] = data["vibration"].rolling(window=5, min_periods=1).mean()

        # 2. Thermal Gradient (Delta T)
        if "temperature" in data.columns:
            data["thermal_gradient"] = data["temperature"].diff().fillna(0.0)

        # 3. Vibration Harmonic Variance
        if "vibration" in data.columns:
            data["vib_variance_5"] = data["vibration"].rolling(window=5, min_periods=1).var().fillna(0.0)

        # 4. Health Score Indicator (0 to 100)
        temp_val = data.get("temperature", 50.0)
        vib_val = data.get("vibration", 1.5)
        data["health_score"] = np.clip(100.0 - (vib_val * 6.0 + np.maximum(0.0, temp_val - 50.0) * 0.8), 0.0, 100.0)

        return data

feature_extractor = IndustrialFeatureExtractor()
