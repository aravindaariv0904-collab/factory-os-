"""Standalone model registry for the FactoryOS AI microservice.

Loads the joblib artifacts produced by the backend's MasterAITrainingPipeline
from MODELS_DIR and exposes them for low-latency inference. Falls back to
heuristic predictors if the artifacts are unavailable so the service always boots.
"""
import asyncio
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import joblib
from sklearn.preprocessing import RobustScaler

from ai_service.app.config import settings

FEATURE_COLUMNS = ["temperature", "vibration", "hydraulic_pressure", "thermal_gradient"]

MODEL_FILES = {
    "failure_classifier": "factoryos_failure_classifier.joblib",
    "rul_regressor": "factoryos_rul_regressor.joblib",
    "anomaly_detector": "factoryos_anomaly_detector.joblib",
}


class _ScalerMixin:
    """Fits a RobustScaler on the same synthetic telemetry distribution used in training."""

    def _fit_scaler(self) -> RobustScaler:
        rng = np.random.RandomState(42)
        temps = rng.normal(58.0, 12.0, 500)
        vibs = rng.normal(2.2, 1.4, 500)
        pressures = rng.normal(198.0, 15.0, 500)
        gradients = rng.normal(0.6, 0.4, 500)
        X = np.column_stack([temps, vibs, pressures, gradients])
        scaler = RobustScaler()
        scaler.fit(X)
        return scaler


class ModelRegistry(_ScalerMixin):
    def __init__(self) -> None:
        self.models: Dict[str, Any] = {}
        self.scaler: RobustScaler | None = None
        self.ready: bool = False
        self.last_loaded_at: str | None = None
        self._lock = threading.Lock()
        self.loaded_from: Dict[str, str] = {}

    @property
    def models_dir(self) -> Path:
        return Path(settings.models_dir)

    def load(self) -> None:
        with self._lock:
            self.scaler = self._fit_scaler()
            self.models = {}
            self.loaded_from = {}
            self.models_dir.mkdir(parents=True, exist_ok=True)

            for name, filename in MODEL_FILES.items():
                path = self.models_dir / filename
                if path.exists():
                    self.models[name] = joblib.load(path)
                    self.loaded_from[name] = str(path)

            self.ready = bool(self.models)
            self.last_loaded_at = datetime.now(timezone.utc).isoformat()

    def ensure_loaded(self) -> None:
        if not self.ready:
            self.load()

    def list_models(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": name,
                "loaded": name in self.models,
                "source": self.loaded_from.get(name),
            }
            for name in MODEL_FILES
        ]

    def transform(self, telemetry: Dict[str, Any]) -> np.ndarray:
        if self.scaler is None:
            self.load()
        row = np.array(
            [
                float(telemetry.get("temperature_deg_c", telemetry.get("temperature", 45.0))),
                float(telemetry.get("vibration_mm_s", telemetry.get("vibration", 1.2))),
                float(telemetry.get("hydraulic_pressure_bar", telemetry.get("hydraulic_pressure", 198.0))),
                float(telemetry.get("thermal_gradient", 0.5)),
            ]
        ).reshape(1, -1)
        return self.scaler.transform(row)

    def predict_machine(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        X = self.transform(telemetry)

        if "failure_classifier" in self.models and "rul_regressor" in self.models:
            fail_prob = float(self.models["failure_classifier"].predict_proba(X)[0][1])
            rul = float(self.models["rul_regressor"].predict(X)[0])
            is_anomaly = bool(self.models["anomaly_detector"].predict(X)[0] == -1)
        else:
            temp = float(telemetry.get("temperature_deg_c", telemetry.get("temperature", 45.0)))
            vib = float(telemetry.get("vibration_mm_s", telemetry.get("vibration", 1.2)))
            fail_prob = float(min(0.99, max(0.01, vib * 0.12 + max(0.0, temp - 60.0) * 0.02)))
            rul = float(max(0.0, 1000.0 - (temp * 4.0 + vib * 40.0)))
            is_anomaly = bool(fail_prob > 0.6)

        health_score = round(
            max(0.0, min(100.0, 100.0 - (fail_prob * 70.0 + (1000.0 - min(1000.0, rul)) * 0.03))), 1
        )
        risk = "High" if fail_prob > 0.6 else "Medium" if fail_prob > 0.3 else "Low"

        return {
            "failure_probability": round(fail_prob, 3),
            "failure_risk_level": risk,
            "predicted_rul_hours": round(max(0.0, rul), 1),
            "is_anomaly_detected": is_anomaly,
            "predicted_health_score": health_score,
        }


model_registry = ModelRegistry()


def start_background_reload() -> None:
    if not settings.model_hot_reload:
        return

    async def _reload_loop():
        interval = settings.model_reload_interval_seconds
        while True:
            await asyncio.sleep(interval)
            try:
                model_registry.load()
            except Exception:  # noqa: BLE001 - background reload must never crash the loop
                continue

    loop = asyncio.new_event_loop()

    def _run():
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_reload_loop())

    thread = threading.Thread(target=_run, daemon=True, name="model-hot-reload")
    thread.start()
