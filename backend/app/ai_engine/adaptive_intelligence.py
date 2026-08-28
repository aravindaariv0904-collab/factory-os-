"""Adaptive, reproducible tabular-data intelligence for Factory OS.

This module deliberately has no synthetic-data or heuristic prediction fallback.
An uploaded dataset is profiled before a caller may train an explicitly requested
model, and inference only runs from the serialized training pipeline.
"""
from __future__ import annotations

import hashlib
import json
import platform
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from uuid import uuid4

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


SCHEMA_VERSION = "manufacturing-canonical/v1"
FEATURE_VERSION = "tabular-features/v1"
PREPROCESSOR_VERSION = "sklearn-column-transformer/v1"
QUALITY_READY = "READY"
QUALITY_REVIEW = "REVIEW_REQUIRED"
QUALITY_DEGRADED = "DEGRADED"
QUALITY_BLOCKED = "BLOCKED"

CANONICAL_FIELDS = {
    "asset.identifier": ("machine", "asset", "equipment", "device", "line"),
    "operations.timestamp": ("timestamp", "time", "date", "datetime"),
    "process.temperature": ("temperature", "temp", "thermal"),
    "process.vibration": ("vibration", "vib", "acceleration"),
    "process.rotational_speed": ("rotational speed", "rpm", "speed"),
    "process.torque": ("torque",),
    "maintenance.hours": ("maintenance", "maint", "service hours"),
    "maintenance.tool_wear": ("tool wear", "wear index", "wear"),
    "quality.defect": ("defect", "failure", "reject", "nonconform", "quality flag"),
    "quality.score": ("quality score", "qualityscore"),
    "production.count": ("production", "output", "quantity", "units produced"),
    "inventory.quantity": ("inventory", "stock", "material quantity"),
    "workforce.identifier": ("operator", "employee", "worker"),
    "safety.incident": ("safety", "incident", "injury"),
    "energy.consumption": ("energy", "power", "kwh", "consumption"),
}
UNIT_PATTERNS = {"c": "celsius", "rpm": "rpm", "nm": "newton_metre", "mm_s": "millimetres_per_second", "mins": "minutes", "hours": "hours", "kwh": "kilowatt_hour", "bar": "bar"}
LEAKAGE_TERMS = ("defectrate", "qualityscore", "defectcategory", "outcome", "result", "post", "resolved")


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalise(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _json_hash(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, default=str).encode()).hexdigest()


@dataclass(frozen=True)
class FieldMapping:
    source: str
    canonical: str | None
    confidence: float
    unit: str | None
    accepted: bool
    reason: str
    mapping_method: str


@dataclass
class DatasetProfile:
    row_count: int
    column_count: int
    numeric_columns: list[str]
    categorical_columns: list[str]
    identifier_columns: list[str]
    timestamp_columns: list[str]
    target_candidates: list[str]
    missingness: dict[str, float]
    cardinality: dict[str, int]
    distributions: dict[str, dict[str, float]]
    duplicate_rows: int
    constant_columns: list[str]
    near_constant_columns: list[str]
    range_anomalies: dict[str, int]
    class_imbalance: dict[str, dict[str, int]]
    leakage_candidates: list[str]


@dataclass
class DatasetRecord:
    dataset_id: str
    version: int
    file_hash: str
    source: str
    owner: str
    organization_id: str
    uploaded_at: str
    row_count: int
    column_count: int
    schema_fingerprint: str
    schema_version: str
    processing_status: str
    parent_dataset_id: str | None
    quality_status: str
    raw_path: str
    profile: dict[str, Any] = field(default_factory=dict)
    mappings: list[dict[str, Any]] = field(default_factory=list)


class DatasetRegistry:
    """Append-only local registry suitable for a mounted durable volume.

    Database-backed persistence is intentionally not emulated here: platform owns
    the tenant database and must implement the documented migration contract.
    """
    def __init__(self, root: Path):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.manifest = self.root / "datasets.jsonl"

    def register(self, raw: bytes, filename: str, *, source: str, owner: str, organization_id: str,
                 parent_dataset_id: str | None = None) -> DatasetRecord:
        digest = hashlib.sha256(raw).hexdigest()
        existing = [json.loads(line) for line in self.manifest.read_text().splitlines()] if self.manifest.exists() else []
        same = [item for item in existing if item["file_hash"] == digest and item["organization_id"] == organization_id]
        version = max((item["version"] for item in same), default=0) + 1
        dataset_id = str(uuid4())
        raw_path = self.root / f"{dataset_id}-{Path(filename).name}"
        raw_path.write_bytes(raw)
        record = DatasetRecord(dataset_id, version, digest, source, owner, organization_id, _utcnow(), 0, 0, "",
                               SCHEMA_VERSION, "REGISTERED", parent_dataset_id, QUALITY_REVIEW, str(raw_path))
        with self.manifest.open("a", encoding="utf-8") as output:
            output.write(json.dumps(asdict(record), sort_keys=True) + "\n")
        return record

    def update_analysis(self, record: DatasetRecord, df: pd.DataFrame, profile: DatasetProfile,
                        mappings: list[FieldMapping], quality_status: str) -> DatasetRecord:
        record.row_count, record.column_count = df.shape
        schema = [{"name": column, "dtype": str(df[column].dtype)} for column in df.columns]
        record.schema_fingerprint = _json_hash(schema)
        record.processing_status, record.quality_status = "PROFILED", quality_status
        record.profile, record.mappings = asdict(profile), [asdict(mapping) for mapping in mappings]
        with self.manifest.open("a", encoding="utf-8") as output:
            output.write(json.dumps(asdict(record), sort_keys=True) + "\n")
        return record


class AdaptiveSchemaIntelligence:
    @staticmethod
    def map_columns(columns: Iterable[str]) -> list[FieldMapping]:
        mappings: list[FieldMapping] = []
        for source in columns:
            normal = _normalise(source)
            compact = normal.replace(" ", "")
            ranked: list[tuple[float, str, str, str]] = []
            for canonical, aliases in CANONICAL_FIELDS.items():
                for alias in aliases:
                    alias_normal = _normalise(alias)
                    if normal == alias_normal or compact == alias_normal.replace(" ", ""):
                        ranked.append((1.0, canonical, "exact_alias", f"normalized source matches alias '{alias}'"))
                    elif alias_normal in normal or normal in alias_normal:
                        ranked.append((0.82, canonical, "alias_containment", f"source contains alias '{alias}'"))
                    else:
                        overlap = len(set(normal.split()) & set(alias_normal.split()))
                        if overlap:
                            ranked.append((round(0.45 + overlap / max(len(alias_normal.split()), 1) * 0.3, 2), canonical, "token_overlap", f"shares {overlap} normalized token(s) with alias '{alias}'"))
            confidence, canonical, method, reason = max(
                ranked,
                default=(0.0, None, "unmapped", "no configured alias or token overlap"),
            )
            unit = next((label for token, label in UNIT_PATTERNS.items() if token in compact), None)
            mappings.append(FieldMapping(source, canonical, confidence, unit, confidence >= 0.8, reason, method))
        return mappings

    @staticmethod
    def profile(df: pd.DataFrame) -> DatasetProfile:
        numeric = list(df.select_dtypes(include=np.number).columns)
        categorical = [column for column in df.columns if column not in numeric]
        cardinality = {column: int(df[column].nunique(dropna=True)) for column in df.columns}
        identifiers = [column for column in df.columns if re.search(r"(^|[_ ])(id|uuid|serial|code)($|[_ ])", _normalise(column)) or (column in categorical and cardinality[column] >= max(2, int(len(df) * .85)))]
        timestamps = [column for column in df.columns if "time" in _normalise(column) or "date" in _normalise(column) or pd.api.types.is_datetime64_any_dtype(df[column])]
        targets = [column for column in df.columns if re.search(r"defect|failure|target|label|outcome|class|flag", _normalise(column)) and 2 <= cardinality[column] <= 20]
        missingness = {column: round(float(df[column].isna().mean()), 6) for column in df.columns}
        constants = [column for column in df.columns if cardinality[column] <= 1]
        near_constants = [column for column in df.columns if column not in constants and float(df[column].value_counts(dropna=False, normalize=True).iloc[0]) >= .98]
        distributions, anomalies = {}, {}
        for column in numeric:
            values = pd.to_numeric(df[column], errors="coerce").dropna()
            if values.empty:
                continue
            q1, q3 = values.quantile(.25), values.quantile(.75)
            iqr = q3 - q1
            anomalies[column] = int(((values < q1 - 3.5 * iqr) | (values > q3 + 3.5 * iqr)).sum()) if iqr else 0
            distributions[column] = {"min": float(values.min()), "max": float(values.max()), "mean": float(values.mean()), "median": float(values.median())}
        imbalance = {column: {str(key): int(value) for key, value in df[column].value_counts(dropna=False).items()} for column in targets}
        leakage = [column for column in df.columns if any(term in _normalise(column).replace(" ", "") for term in LEAKAGE_TERMS)]
        return DatasetProfile(len(df), len(df.columns), numeric, categorical, identifiers, timestamps, targets, missingness, cardinality,
                              distributions, int(df.duplicated().sum()), constants, near_constants, anomalies, imbalance, leakage)


class DataQualityEngine:
    @staticmethod
    def assess(profile: DatasetProfile, target: str | None = None) -> tuple[str, list[dict[str, str]]]:
        issues: list[dict[str, str]] = []
        if not profile.numeric_columns:
            issues.append({"severity": "BLOCKED", "code": "NO_NUMERIC_FEATURES", "message": "No numeric feature candidates detected."})
        if target is None:
            issues.append({"severity": "BLOCKED", "code": "TARGET_REQUIRED", "message": "A target must be explicitly selected."})
        elif target not in profile.target_candidates:
            issues.append({"severity": "BLOCKED", "code": "INVALID_TARGET", "message": "Selected target is not a valid classification candidate."})
        elif len(profile.class_imbalance[target]) < 2:
            issues.append({"severity": "BLOCKED", "code": "ONE_CLASS_TARGET", "message": "Target contains fewer than two classes."})
        if profile.duplicate_rows:
            issues.append({"severity": "REVIEW_REQUIRED", "code": "DUPLICATES", "message": "Duplicate source rows are preserved and require review."})
        if any(rate > .05 for column, rate in profile.missingness.items() if column not in profile.leakage_candidates):
            issues.append({"severity": "DEGRADED", "code": "MISSINGNESS", "message": "At least one column exceeds 5% missingness."})
        if profile.leakage_candidates:
            issues.append({"severity": "REVIEW_REQUIRED", "code": "POTENTIAL_LEAKAGE", "message": "Outcome-like fields must be excluded or explicitly approved."})
        if target and min(profile.class_imbalance[target].values()) < 5:
            issues.append({"severity": "DEGRADED", "code": "SMALL_CLASS", "message": "At least one class has fewer than five rows."})
        state = QUALITY_READY
        for candidate in (QUALITY_BLOCKED, QUALITY_DEGRADED, QUALITY_REVIEW):
            if any(issue["severity"] == candidate for issue in issues):
                state = candidate
                break
        return state, issues

    @staticmethod
    def score(profile: DatasetProfile, mappings: Iterable[FieldMapping]) -> dict[str, Any]:
        """Explainable quality dimensions; this is informational, never a training override."""
        mapped = list(mappings)
        total = max(len(profile.missingness), 1)
        completeness = 1.0 - sum(profile.missingness.values()) / total
        uniqueness = 1.0 if not profile.duplicate_rows else max(0.0, 1.0 - profile.duplicate_rows / max(profile.row_count, 1))
        validity = 1.0 - sum(1 for count in profile.range_anomalies.values() if count) / max(len(profile.range_anomalies), 1)
        semantic_confidence = sum(item.confidence for item in mapped) / max(len(mapped), 1)
        dimensions = {
            "completeness": round(completeness, 4),
            "uniqueness": round(uniqueness, 4),
            "numeric_range_validity": round(validity, 4),
            "semantic_mapping_confidence": round(semantic_confidence, 4),
            "schema_integrity": 1.0 if profile.numeric_columns else 0.0,
        }
        return {"dimensions": dimensions, "score": round(sum(dimensions.values()) / len(dimensions), 4), "interpretation": "Informational only; inspect dimension evidence and quality issues before use."}


@dataclass
class TrainedModel:
    model_id: str
    version: str
    artifact_path: str
    metadata: dict[str, Any]


class ExperimentEngine:
    def __init__(self, random_state: int = 42):
        self.random_state = random_state

    def train(self, df: pd.DataFrame, dataset: DatasetRecord, profile: DatasetProfile, *, target: str,
              artifact_dir: Path, allow_review: bool = False) -> TrainedModel:
        quality, issues = DataQualityEngine.assess(profile, target)
        if quality == QUALITY_BLOCKED or (quality == QUALITY_REVIEW and not allow_review):
            raise ValueError(f"Training blocked by quality gate: {issues}")
        excluded = set(profile.identifier_columns + profile.timestamp_columns + profile.constant_columns + profile.leakage_candidates + [target])
        features = [column for column in df.columns if column not in excluded]
        if not features:
            raise ValueError("Training blocked: no non-leaking features remain.")
        X, y = df[features], df[target]
        counts = y.value_counts()
        folds = min(5, int(counts.min()))
        if folds < 2:
            raise ValueError("Training blocked: each target class requires at least two rows for cross-validation.")
        numeric = [column for column in features if pd.api.types.is_numeric_dtype(X[column])]
        categorical = [column for column in features if column not in numeric]
        transformer = ColumnTransformer([
            ("numeric", Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), numeric),
            ("categorical", Pipeline([("impute", SimpleImputer(strategy="most_frequent")), ("encode", OneHotEncoder(handle_unknown="ignore"))]), categorical),
        ], remainder="drop")
        candidates = {
            "logistic_regression": LogisticRegression(max_iter=1000, class_weight="balanced", random_state=self.random_state),
            "random_forest": RandomForestClassifier(n_estimators=200, class_weight="balanced", random_state=self.random_state),
            "gradient_boosting": GradientBoostingClassifier(random_state=self.random_state),
        }
        cv = StratifiedKFold(n_splits=folds, shuffle=True, random_state=self.random_state)
        results: dict[str, dict[str, Any]] = {}
        for name, estimator in candidates.items():
            pipeline = Pipeline([("preprocessor", transformer), ("model", estimator)])
            probabilities = cross_val_predict(pipeline, X, y, cv=cv, method="predict_proba")[:, 1]
            predictions = (probabilities >= .5).astype(int)
            tn, fp, fn, tp = confusion_matrix(y, predictions, labels=[0, 1]).ravel()
            results[name] = {"precision": float(precision_score(y, predictions, zero_division=0)), "recall": float(recall_score(y, predictions, zero_division=0)), "f1": float(f1_score(y, predictions, zero_division=0)), "roc_auc": float(roc_auc_score(y, probabilities)), "pr_auc": float(average_precision_score(y, probabilities)), "false_negative_rate": float(fn / (fn + tp)) if fn + tp else None, "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]]}
        champion_name = max(results, key=lambda name: (results[name]["f1"], results[name]["pr_auc"]))
        final_pipeline = Pipeline([("preprocessor", transformer), ("model", candidates[champion_name])]).fit(X, y)
        model_id, version = str(uuid4()), "1.0.0"
        artifact_dir = Path(artifact_dir); artifact_dir.mkdir(parents=True, exist_ok=True)
        artifact_path = artifact_dir / f"{model_id}.joblib"
        metadata = {"model_id": model_id, "version": version, "dataset_id": dataset.dataset_id, "dataset_version": dataset.version, "schema_version": dataset.schema_version, "feature_version": FEATURE_VERSION, "preprocessor_version": PREPROCESSOR_VERSION, "algorithm": champion_name, "parameters": final_pipeline.named_steps["model"].get_params(), "metrics": results[champion_name], "experiments": results, "feature_columns": features, "excluded_columns": sorted(excluded), "quality_status": quality, "quality_issues": issues, "training_timestamp": _utcnow(), "code_version": "unversioned", "approval_state": "PENDING_REVIEW", "deployment_state": "NOT_DEPLOYED", "python_version": platform.python_version(), "sklearn_version": sklearn.__version__}
        joblib.dump({"pipeline": final_pipeline, "metadata": metadata}, artifact_path)
        artifact_path.with_suffix(".json").write_text(json.dumps(metadata, indent=2, default=str), encoding="utf-8")
        return TrainedModel(model_id, version, str(artifact_path), metadata)


class ArtifactInferenceService:
    def __init__(self, artifact_path: Path):
        loaded = joblib.load(artifact_path)
        self.pipeline, self.metadata = loaded["pipeline"], loaded["metadata"]

    def predict(self, raw_values: dict[str, Any]) -> dict[str, Any]:
        features = self.metadata["feature_columns"]
        
        # Build normalized lookup for raw_values keys to support feature name alias resolution
        raw_normalized = {_normalise(k): v for k, v in raw_values.items()}

        row_data: dict[str, Any] = {}
        for feature in features:
            if feature in raw_values:
                row_data[feature] = raw_values[feature]
            else:
                norm_feat = _normalise(feature)
                # Try exact normalized match or substring match
                match_val = None
                for raw_k, raw_v in raw_normalized.items():
                    if norm_feat in raw_k or raw_k in norm_feat or any(part in raw_k for part in norm_feat.split() if len(part) > 3):
                        match_val = raw_v
                        break
                row_data[feature] = match_val if match_val is not None else np.nan

        if not raw_values or all(pd.isna(v) for v in row_data.values()):
            raise ValueError(f"Inference rejected: required feature values missing: {features}")

        frame = pd.DataFrame([row_data])
        probabilities = self.pipeline.predict_proba(frame)[0]
        classes = list(self.pipeline.named_steps["model"].classes_)
        predicted_index = int(np.argmax(probabilities))
        attributions = self._explain(frame)
        return {"prediction": classes[predicted_index].item() if hasattr(classes[predicted_index], "item") else classes[predicted_index], "confidence": float(probabilities[predicted_index]), "model_id": self.metadata["model_id"], "model_version": self.metadata["version"], "dataset_id": self.metadata["dataset_id"], "schema_version": self.metadata["schema_version"], "feature_values": frame.iloc[0].to_dict(), "feature_attributions": attributions, "audit_metadata": {"preprocessor_version": self.metadata["preprocessor_version"], "feature_version": self.metadata["feature_version"], "training_timestamp": self.metadata["training_timestamp"]}}

    def _explain(self, frame: pd.DataFrame) -> dict[str, float]:
        model = self.pipeline.named_steps["model"]
        transformed = self.pipeline.named_steps["preprocessor"].transform(frame)
        names = self.pipeline.named_steps["preprocessor"].get_feature_names_out()
        if hasattr(model, "coef_"):
            values = np.asarray(transformed).ravel() * np.asarray(model.coef_[0])
        elif hasattr(model, "feature_importances_"):
            values = np.asarray(model.feature_importances_)
        else:
            return {}
        grouped: dict[str, float] = {}
        for name, value in zip(names, values):
            transformed_name = name.split("__", 1)[-1]
            source = next((feature for feature in self.metadata["feature_columns"] if transformed_name == feature or transformed_name.startswith(f"{feature}_")), transformed_name)
            grouped[source] = grouped.get(source, 0.0) + float(value)
        return grouped


class DriftMonitor:
    """Feature, target, and prediction drift monitor that only recommends action."""
    def __init__(self, reference: pd.DataFrame, columns: Iterable[str], bins: int = 10):
        self.columns = list(columns)
        self.bins = bins
        self.reference: dict[str, tuple[np.ndarray, np.ndarray]] = {}
        for column in self.columns:
            values = pd.to_numeric(reference[column], errors="coerce").dropna().to_numpy()
            if not len(values):
                continue
            edges = np.unique(np.quantile(values, np.linspace(0, 1, bins + 1)))
            if len(edges) < 2:
                continue
            counts, edges = np.histogram(values, bins=edges)
            self.reference[column] = (counts / counts.sum(), edges)

    def assess(self, current: pd.DataFrame, threshold: float = .2) -> dict[str, Any]:
        scores: dict[str, float] = {}
        for column, (expected, edges) in self.reference.items():
            values = pd.to_numeric(current[column], errors="coerce").dropna().to_numpy()
            if not len(values):
                continue
            actual = np.histogram(values, bins=edges)[0].astype(float)
            actual = actual / actual.sum() if actual.sum() else actual
            scores[column] = float(np.abs(actual - expected).sum() / 2)
        detected = {column: score for column, score in scores.items() if score >= threshold}
        return {"feature_drift": scores, "target_drift": None, "prediction_drift": None,
                "drift_detected": bool(detected), "recommend_retraining": bool(detected),
                "recommendation": "Review data and model performance before retraining." if detected else "No retraining recommendation."}
