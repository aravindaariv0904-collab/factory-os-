"""Initialize the shared ML model directory for the AI service.

Copies the pre-trained joblib artifacts produced by the MasterAITrainingPipeline
into MODELS_DIR (default: <repo>/models), which both docker-compose services mount.

Usage (from repo root):
    python scripts/init_models.py
"""
import os
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

DEFAULT_MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODELS_DIR = Path(os.getenv("MODELS_DIR", str(DEFAULT_MODELS_DIR)))

SOURCE_MODELS_DIR = Path(__file__).resolve().parent.parent / "backend" / "app" / "ai_engine" / "saved_models"

REQUIRED_MODELS = [
    "factoryos_anomaly_detector.joblib",
    "factoryos_failure_classifier.joblib",
    "factoryos_rul_regressor.joblib",
]


def init_models() -> Path:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    if all((MODELS_DIR / name).exists() for name in REQUIRED_MODELS):
        print(f"Models already present in {MODELS_DIR} - skipping.")
        return MODELS_DIR

    if SOURCE_MODELS_DIR.exists():
        for name in REQUIRED_MODELS:
            src = SOURCE_MODELS_DIR / name
            if src.exists():
                shutil.copy2(src, MODELS_DIR / name)
                print(f"Copied {name} -> {MODELS_DIR}")
        missing = [n for n in REQUIRED_MODELS if not (MODELS_DIR / n).exists()]
        if not missing:
            return MODELS_DIR

    # Fallback: train fresh artifacts from scratch via the master pipeline.
    print("Training fresh models via MasterAITrainingPipeline...")
    from backend.app.ai_engine.train import MasterAITrainingPipeline

    pipeline = MasterAITrainingPipeline()
    result = pipeline.run_training_pipeline()

    trained_dir = Path(__file__).resolve().parent.parent / "backend" / "app" / "ai_engine" / "saved_models"
    for name in REQUIRED_MODELS:
        src = trained_dir / name
        if src.exists():
            shutil.copy2(src, MODELS_DIR / name)
            print(f"Copied {name} -> {MODELS_DIR}")

    print("init_models complete:", result.get("status"))
    return MODELS_DIR


if __name__ == "__main__":
    models_dir = init_models()
    sys.exit(0 if all((models_dir / n).exists() for n in REQUIRED_MODELS) else 1)
