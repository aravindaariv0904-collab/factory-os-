# Factory OS — Target Logical Architecture

**Author:** Principal Engineering Lead  
**Specification:** Operational Manufacturing Intelligence & Industrial IoT Platform

---

## 1. Target End-to-End Pipeline

```
INDUSTRIAL DATA SOURCES (OPC-UA / MQTT / SCADA / CSV / MES)
                      │
                      ▼
            EDGE TELEMETRY GATEWAY
            (Buffering, Quality Flags, Sequence Verification)
                      │
                      ▼
            DATA INGESTION & REGISTRATION
            (Security Validation, Hash Digest, Raw Storage)
                      │
                      ▼
         ADAPTIVE SCHEMA & QUALITY ENGINE
   (Profiling, Semantic Mapping, Quality Gates, Leakage Check)
                      │
                      ▼
          HUMAN-IN-THE-LOOP APPROVAL
         (Schema & Target Confirmation)
                      │
                      ▼
          REPRODUCIBLE ML TRAINING PIPELINE
  (Feature Engineering, Pipeline Serialization, Versioned Artifact)
                      │
                      ▼
           MODEL REGISTRY & PROMOTION
     (Technical Gate, F1/FNR Thresholds, Approval Workflow)
                      │
                      ▼
           PRODUCTION INFERENCE SERVICE
   (Artifact Loading, Lineage Trace, Per-Prediction Explanation)
                      │
                      ▼
            POLICY & DECISION ENGINE
     (Predictions → Business Rules → Recommendation Lifecycle)
                      │
                      ▼
         OPERATOR APPROVAL & OUTCOME CAPTURE
      (Action Tracking, Confirmed Result, Impact Metrics)
                      │
                      ▼
         DRIFT MONITORING & RETRAINING LOOP
  (PSI Feature Drift, Prediction Shift, Retraining Decision Trigger)
```

---

## 2. Domain Responsibilities & Bounded Contexts

### 2.1 Domain 1: Frontend Application (Next.js 14)
- **Responsibility:** User experience, operator dashboards, recommendation approval workflows, schema mapping UI, dataset management.
- **Strict Boundary:** No mock data fallback in production (`NODE_ENV === "production"`). All API network errors trigger explicit error/offline state indicators.

### 2.2 Domain 2: Backend Platform Services (FastAPI)
- **Responsibility:** REST API routing, JWT authentication, RBAC authorization, tenant scoping (`organization_id`), job orchestration (`ProcessingJob`), object storage abstraction, and audit logging.
- **Strict Boundary:** Enforces tenant isolation on every single entity query. Never accepts or returns un-scoped queries across tenant boundaries.

### 2.3 Domain 3: Adaptive Data Intelligence Engine
- **Responsibility:** Automated data profiling, fuzzy/semantic mapping to canonical schema concepts, deterministic data quality scoring, outcome leakage detection, and raw file preservation (BRONZE layer).

### 2.4 Domain 4: MLOps & Model Lifecycle Engine
- **Responsibility:** Multi-algorithm training (`Random Forest`, `Gradient Boosting`, `Logistic Regression`), hyperparameter search, cross-validation, serialized pipeline artifacts (`joblib`), model registry versioning, promotion gates (`F1 ≥ 0.70`, `FNR ≤ 0.30`), and drift monitoring (`PSI`).

### 2.5 Domain 5: Operational Decision Engine
- **Responsibility:** Converting ML prediction probabilities into actionable, policy-governed recommendations with mandatory human-in-the-loop approval workflows and outcome tracking.

### 2.6 Domain 6: Industrial IoT & OT Connectivity Layer
- **Responsibility:** Edge connectivity adapters (OPC-UA, MQTT, Modbus), telemetry quality flag parsing, clock synchronization, connection loss buffering, and real-time streaming to backend.
