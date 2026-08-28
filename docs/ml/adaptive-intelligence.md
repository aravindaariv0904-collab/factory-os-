# Adaptive intelligence contract

`backend.app.ai_engine.adaptive_intelligence` is the authoritative tabular data-to-model implementation. It accepts real data only; it does not fabricate values, models, features, or predictions.

## Dataset lineage and quality

The append-only artifact registry records `dataset_id`, version, SHA-256 file hash, source, owner, organization ID, upload time, row/column counts, schema fingerprint/version, parent dataset ID, processing and quality states. Raw bytes are retained unchanged. Profiling and mappings are derived metadata; raw values are never cleaned in place.

Mappings whose confidence is below `0.80` are returned but not accepted. Each mapping records its method and reason (`exact_alias`, `alias_containment`, `token_overlap`, or `unmapped`). Quality states are `READY`, `REVIEW_REQUIRED`, `DEGRADED`, and `BLOCKED`. `BLOCKED` never trains; `REVIEW_REQUIRED` requires an explicit `allow_review=True` caller approval. `DataQualityEngine.score` exposes explainable completeness, uniqueness, numeric-range, mapping-confidence, and schema-integrity dimensions; it is informational and cannot override the quality gate. Outcome-like fields (`DefectRate`, `QualityScore`, defect category, outcomes/results) are excluded as potential leakage. This is a heuristic warning, not a causal claim.

## Training and inference contract

Training produces one joblib artifact containing a fitted `ColumnTransformer` and selected classifier. It evaluates logistic regression, random forest, and gradient boosting with deterministic stratified CV, selecting by F1 then PR-AUC. Metrics include precision, recall, F1, ROC-AUC, PR-AUC, false-negative rate, and confusion matrix. The sidecar metadata records dataset/schema/feature/preprocessor versions, parameters, metrics, quality review state, approval/deployment state, and runtime versions.

Inference loads that exact artifact, rejects any missing trained feature, applies the serialized preprocessing pipeline, and returns model/dataset/schema versions, input feature values, and model-native attribution proxies. It has no default values or heuristic fallback.

`DriftMonitor` establishes reference histograms for supplied numeric features and reports feature drift with an explicit recommendation to review performance before retraining. Target and prediction drift must be populated from the platform's persisted outcome and prediction feedback records; the monitor never starts retraining.

## Platform handoff required

The present platform has no Alembic migration setup and uses `Base.metadata.create_all`. Before production use, Cursor must implement tenant-scoped database migrations and authenticated API endpoints for dataset records, model records, prediction/feedback, approvals, and raw object storage. The artifact registry is a durable-volume adapter for integration testing, not a substitute for that platform migration.
