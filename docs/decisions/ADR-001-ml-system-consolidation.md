# ADR-001: Machine Learning Systems Consolidation & Routing Strategy

**Status:** Accepted  
**Date:** 2026-08-28  
**Author:** Principal Engineering Lead  

---

## 1. Context

The Factory OS repository previously contained two separate machine learning systems:

1. **`backend/app/ai_engine/adaptive_intelligence.py`**: Adaptive tabular ML engine (`AdaptiveSchemaIntelligence`, `DataQualityEngine`, `ExperimentEngine`, `ArtifactInferenceService`). Learns dynamically from uploaded datasets, creates versioned model artifacts serialized via `joblib`, and tracks lineage.
2. **`backend/app/ml/`**: Legacy synthetic machine learning predictor (`MLPredictor`, `MLModelRegistry`). Fits in-memory Random Forest models on startup using synthetic Gaussian distribution data.

This duality created architectural confusion: `/predict/machine` routed predictions through synthetic in-memory models rather than custom models trained on real tenant data.

---

## 2. Decision

We consolidate inference routing through the **Adaptive ML Engine** while preserving the legacy predictor as an explicitly labeled fallback mode:

1. **Production Path (Adaptive Engine)**:
   - When a tenant uploads a dataset and promotes a trained model to `DEPLOYED` status, `/api/v1/predict/machine` and `/api/v1/predictions` route directly to `ArtifactInferenceService` loading the tenant's versioned model artifact.
   - Predictions return `"model_type": "ADAPTIVE_PRODUCTION"`, `"mode": "PRODUCTION"`, model version ID, confidence scores, and per-prediction feature attributions.

2. **Synthetic Baseline Fallback**:
   - If an organization has not yet promoted a custom model, `/api/v1/predict/machine` falls back to `MLPredictor` but explicitly includes `"model_type": "SYNTHETIC_BASELINE"`, `"mode": "SYNTHETIC_BASELINE"`, and a notice instructing the user to upload a dataset and train a custom model.
   - This ensures demo environment usability while eliminating un-labeled fake production success.

---

## 3. Consequences

- **Positives**: Complete transparency for operators; seamless transition from initial demo state to production-ready custom ML models; eliminates hidden assumptions.
- **Negatives**: Requires tenants to upload data and train models to get adaptive production predictions. (This is desired operational behavior).
