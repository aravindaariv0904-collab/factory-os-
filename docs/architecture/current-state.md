# Factory OS — Current State Architecture Audit

**Audit Date:** 2026-08-28  
**Author:** Principal Engineering Lead  
**Scope:** Frontend, Backend, AI Engine, ML Systems, Services, Data Storage, Security, MLOps

---

## 1. System Overview

Factory OS is an industrial AI decision intelligence platform designed to ingest heterogeneous manufacturing datasets, profile and map them semantically to canonical schemas, train adaptive ML models, generate predictions, explain risk drivers, present governed operational recommendations, and track outcomes.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             FRONTEND (Next.js 14)                         │
│                    Port 3214 • REST + WebSocket Client                   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTP / WS
┌────────────────────────────────────▼─────────────────────────────────────┐
│                            BACKEND PLATFORM (FastAPI)                     │
│                   Port 8000 • Async SQLAlchemy • JWT Auth                │
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────┐  │
│  │ Adaptive AI Engine   │  │ Datasets Service     │  │ Model Registry │  │
│  │ (Profile/Map/Train)  │  │ (Upload/Profile/Map) │  │ (Promote/List) │  │
│  └──────────────────────┘  └──────────────────────┘  └────────────────┘  │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────┐  │
│  │ Platform Predictions │  │ Recommendations      │  │ Reports API    │  │
│  │ (Inference/Explain)  │  │ (Approve/Reject)     │  │ (File Downloads│  │
│  └──────────────────────┘  └──────────────────────┘  └────────────────┘  │
└──────────────────┬───────────────────────────────────────┬───────────────┘
                   │                                       │
┌──────────────────▼─────────────────┐   ┌─────────────────▼───────────────┐
│        STORAGE / DATABASE          │   ┌                           ┐
│ SQLite (dev) / PostgreSQL (prod)   │   │     REDIS / CELERY WORKER     │
│ Local File Storage (artifacts/raw) │   │ Async tasks & job state   │
└────────────────────────────────────┘   └───────────────────────────┘
```

---

## 2. Component Inventory & Status

### 2.1 Backend API Layer (`backend/app/api/v1/`)
- **`datasets.py`**: Full upload → profile → map → approve → train workflow. Uses `TenantScope` for org isolation.
- **`ml_models.py`**: Model registry with versioning, metrics, and lifecycle promotion (`CANDIDATE` → `DEPLOYED` → `RETIRED`) with quality threshold gates.
- **`platform_predictions.py`**: Production inference using `ArtifactInferenceService` on versioned model artifacts with feature attributions.
- **`platform_recommendations.py`**: Decision engine workflow with state machine (`GENERATED` → `APPROVED` / `REJECTED` → `VERIFIED`).
- **`platform_reports.py`**: Artifact generation service producing JSON/PDF report files served via `FileResponse`.
- **`predict.py`**: Machine health prediction route. Checks for tenant's DEPLOYED adaptive model first; falls back to labeled synthetic baseline (`SYNTHETIC_BASELINE`) if no custom model is deployed.
- **`stream.py`**: High-frequency telemetry WebSocket & SSE alerts stream. All payloads explicitly labeled `mode: SIMULATION`.

### 2.2 Adaptive Intelligence Engine (`backend/app/ai_engine/adaptive_intelligence.py`)
- **`AdaptiveSchemaIntelligence`**: Automated column profiling, semantic mapping (fuzzy/alias matching to canonical concepts), target candidate discovery.
- **`DataQualityEngine`**: Assessment of missingness, class imbalance, range anomalies, duplicate rows, and leakage candidates.
- **`ExperimentEngine`**: Multi-model cross-validation training pipeline (Random Forest, Gradient Boosting, Logistic Regression), metric evaluation, champion selection, and artifact serialization.
- **`ArtifactInferenceService`**: Reproducible inference loader using exact serialized preprocessor + model pipelines.
- **`DriftMonitor`**: Histogram-based Population Stability Index (PSI) drift detector.

### 2.3 Security & Multi-Tenancy
- **JWT Authentication**: HS256 JWT tokens with role, user_id, factory_id, and organization_id claims.
- **Tenant Scope Guard**: `TenantScope.require_organization(user)` prevents cross-tenant data access.
- **Dev Auth Bypass**: Restricted strictly to `ENVIRONMENT=development` when user count is zero. Uses a non-production zero-UUID sentinel.
- **Request ID Middleware**: Injects `X-Request-ID` into every HTTP request/response for distributed log correlation.

---

## 3. Debt & Resolved Issues Summary

| Issue | Original Severity | Status | Resolution |
|---|---|---|---|
| Committed API key | P0 | **RESOLVED** | Removed from `.env`, added key template & security notes |
| Hard-coded org UUID in routes | P0 | **RESOLVED** | Injected `current_user.organization_id` across all routes |
| Silent frontend mock fallback | P0 | **RESOLVED** | Gated mock fallback behind `NODE_ENV === "development"` |
| Unlabeled simulation stream | P0 | **RESOLVED** | Explicitly labeled all WebSocket/SSE payloads with `mode: SIMULATION` |
| Broken Celery model refresh | P0 | **RESOLVED** | Fixed method call to `_fit_baseline_synthetic_models()` |
| Missing Training API | P1 | **RESOLVED** | Added `POST /api/v1/datasets/{id}/train` |
| Missing Model Promotion API | P1 | **RESOLVED** | Added `POST /api/v1/models/{id}/versions/{v}/promote` with metric gates |
| Uncorrelated logs | P2 | **RESOLVED** | Added `RequestIDMiddleware` with `X-Request-ID` header |
