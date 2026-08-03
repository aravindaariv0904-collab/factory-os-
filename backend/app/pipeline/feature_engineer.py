from typing import List, Dict, Any
import numpy as np

class FeatureEngineer:
    @staticmethod
    def extract_telemetry_features(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Computes rolling averages, thermal gradient, and harmonic vibration variance."""
        if not data:
            return data

        processed = [row.copy() for row in data]
        temps = [r.get("temperature", 45.0) for r in processed]
        vibs = [r.get("vibration", 1.2) for r in processed]

        for i, row in enumerate(processed):
            # Compute 5-period rolling average for temperature and vibration
            window_start = max(0, i - 4)
            temp_window = temps[window_start : i + 1]
            vib_window = vibs[window_start : i + 1]

            row["rolling_temp_avg_5m"] = round(float(np.mean(temp_window)), 2)
            row["rolling_vib_avg_5m"] = round(float(np.mean(vib_window)), 2)

            # Thermal gradient (delta T)
            if i > 0:
                row["thermal_gradient"] = round(float(temps[i] - temps[i - 1]), 2)
            else:
                row["thermal_gradient"] = 0.0

            # Harmonic vibration variance
            row["vib_harmonic_variance"] = round(float(np.var(vib_window)), 4)

            # Composite Health Index Indicator
            v_val = row.get("vibration", 1.2)
            t_val = row.get("temperature", 45.0)
            health = max(0.0, min(100.0, 100.0 - (v_val * 5.0 + max(0.0, t_val - 50.0) * 0.8)))
            row["computed_health_index"] = round(health, 1)

        return processed
