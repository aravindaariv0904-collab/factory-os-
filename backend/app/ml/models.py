import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler

class MLModelRegistry:
    def __init__(self):
        # 1. Failure Risk Classifier
        self.classifier = RandomForestClassifier(n_estimators=50, random_state=42)
        # 2. Remaining Useful Life (RUL) Regressor
        self.rul_regressor = RandomForestRegressor(n_estimators=50, random_state=42)
        # 3. Anomaly Detector
        self.anomaly_detector = IsolationForest(contamination=0.05, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self._fit_baseline_synthetic_models()

    def _fit_baseline_synthetic_models(self):
        """Fits initial baseline models on representative industrial telemetry distribution."""
        np.random.seed(42)
        # Features: [temperature, vibration, hydraulic_pressure, thermal_gradient]
        n_samples = 200
        temps = np.random.normal(55, 12, n_samples)
        vibs = np.random.normal(2.0, 1.5, n_samples)
        pressures = np.random.normal(200, 15, n_samples)
        gradients = np.random.normal(0.5, 0.3, n_samples)

        X = np.column_stack([temps, vibs, pressures, gradients])
        X_scaled = self.scaler.fit_transform(X)

        # Labels: Failure probability > 0.5 if high temp/vib
        y_fail = (temps > 75) | (vibs > 6.0)
        y_rul = np.maximum(0, 1000 - (temps * 4 + vibs * 50))

        self.classifier.fit(X_scaled, y_fail)
        self.rul_regressor.fit(X_scaled, y_rul)
        self.anomaly_detector.fit(X_scaled)
        self.is_trained = True

ml_registry = MLModelRegistry()
