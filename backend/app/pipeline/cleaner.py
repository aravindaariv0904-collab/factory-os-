from typing import List, Dict, Any
import numpy as np

class DataCleaner:
    @staticmethod
    def handle_missing_values(data: List[Dict[str, Any]], fill_method: str = "forward") -> List[Dict[str, Any]]:
        """Handles missing numerical values in sensor telemetry payloads using forward fill or mean."""
        if not data:
            return data

        cleaned = [row.copy() for row in data]
        keys = [k for k in cleaned[0].keys() if isinstance(cleaned[0][k], (int, float))]

        for key in keys:
            last_valid = 0.0
            # Compute mean as fallback
            valid_vals = [row[key] for row in cleaned if row.get(key) is not None and not np.isnan(row[key])]
            mean_val = float(np.mean(valid_vals)) if valid_vals else 0.0

            for row in cleaned:
                val = row.get(key)
                if val is None or np.isnan(val):
                    if fill_method == "forward" and last_valid != 0.0:
                        row[key] = last_valid
                    else:
                        row[key] = mean_val
                else:
                    last_valid = float(val)

        return cleaned

    @staticmethod
    def clamp_outliers(data: List[Dict[str, Any]], keys: List[str], std_dev_threshold: float = 3.0) -> List[Dict[str, Any]]:
        """Clamps extreme sensor outliers beyond std_dev_threshold to bounds."""
        if not data:
            return data

        cleaned = [row.copy() for row in data]
        for key in keys:
            vals = [row[key] for row in cleaned if key in row and isinstance(row[key], (int, float))]
            if len(vals) < 2:
                continue
            mean = float(np.mean(vals))
            std = float(np.std(vals))
            if std == 0:
                continue

            lower_bound = mean - std_dev_threshold * std
            upper_bound = mean + std_dev_threshold * std

            for row in cleaned:
                if key in row and isinstance(row[key], (int, float)):
                    row[key] = float(np.clip(row[key], lower_bound, upper_bound))

        return cleaned
