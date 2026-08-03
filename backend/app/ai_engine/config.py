import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

DATASETS_RAW_DIR = BASE_DIR / "datasets" / "raw"
DATASETS_PROCESSED_DIR = BASE_DIR / "datasets" / "processed"
DATASETS_METADATA_DIR = BASE_DIR / "datasets" / "metadata"
MODEL_EXPORTS_DIR = BASE_DIR / "saved_models"

# Ensure target directories exist
os.makedirs(DATASETS_RAW_DIR, exist_ok=True)
os.makedirs(DATASETS_PROCESSED_DIR, exist_ok=True)
os.makedirs(DATASETS_METADATA_DIR, exist_ok=True)
os.makedirs(MODEL_EXPORTS_DIR, exist_ok=True)

# Training Hyperparameters
RANDOM_SEED = 42
CV_FOLDS = 5
TRAIN_TEST_SPLIT_RATIO = 0.8
SHAP_BACKGROUND_SAMPLES = 50

MODEL_CONFIGS = {
    "failure_classifier": {
        "n_estimators": 50,
        "max_depth": 6,
        "learning_rate": 0.1,
    },
    "rul_regressor": {
        "n_estimators": 50,
        "max_depth": 8,
    },
    "anomaly_detector": {
        "contamination": 0.05,
        "n_estimators": 50,
    },
}
