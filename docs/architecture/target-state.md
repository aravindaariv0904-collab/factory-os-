# Factory OS — Target-State Architecture

**Date:** 2026-08-28
**Author:** Principal Engineering Lead
**Status:** Design baseline for integration work.

## Principles applied
- Single source of truth per concern (auth, tenant, canonical schema, preprocessing, model versioning, audit, reports).
- Raw data immutable (BRONZE/SILVER/GOLD).
- Human-in-the-loop for high-impact actions.
- Fail visible; no mock in production paths.
- Reproducible lineage: dataset/version → schema/feature/preprocessor/model version → prediction → recommendation → report.

## Logical flow

```
USER
  ↓
WEB APPLICATION  (Next.js)
  ↓
API / APPLICATION SERVICES  (FastAPI backend :8000)
  ↓
DOMAIN SERVICES
  ↓
DATA + JOB ORCHESTRATION  (Celery + Redis)
  ↓
POSTGRESQL / OBJECT STORAGE / TIME-SERIES / VECTOR STORE
  ↓
DATA INTELLIGENCE  (adaptive_intelligence.py engine)
  ↓
ML / MLOPS  (ExperimentEngine, ArtifactInferenceService, ModelVersion)
  ↓
DECISION ENGINE  (policy → decision → recommendation)
  ↓
RECOMMENDATION WORKFLOW  (approval)
  ↓
AUDIT / REPORTING / OUTCOME
  ↓
MONITORING / DRIFT / FEEDBACK
```

Industrial connectivity path (target, not yet wired):
```
PLC/Sensor/SCADA/MES/ERP → Edge Connector → OPC-UA/MQTT Adapter → Telemetry Gateway
  → Event/Streaming Layer → Time-Series Storage → Feature Processing → Inference → Alerts/Decisions
```

## Canonical manufacturing schema (versioned)
`manufacturing-canonical/v1` already defined in `adaptive_intelligence.py` (CANONICAL_FIELDS): asset.identifier, operations.timestamp, process.temperature, process.vibration, process.rotational_speed, process.torque, maintenance.hours, maintenance.tool_wear, quality.defect, quality.score, production.count, inventory.quantity, workforce.identifier, safety.incident, energy.consumption.

## Domain ownership
- **Antigravity:** frontend, UX, operator workflows, states.
- **Cursor:** backend APIs, domain services, DB, auth/authz, jobs, storage, audit, integrations.
- **Codex:** data intelligence, ML/MLOps, adaptive pipelines, model lifecycle.
- **OpenCode:** QA, security, reliability, release validation.

## Key integration decisions (this cycle)
1. Expose the real `adaptive_intelligence` engine via authenticated, tenant-scoped API endpoints and persist to the existing `platform.py` model layer (Dataset, DatasetVersion, Experiment, ModelVersion, PlatformPrediction, PlatformRecommendation, PlatformReport).
2. Persist BRONZE raw data immutably via `StorageService` (tenant-scoped path) and record file hash + lineage.
3. Reports become real generated artifacts stored in object storage with a working download endpoint (no placeholders).
4. All write paths derive `organization_id` from the authenticated `CurrentUser` (remove hardcoded `11111111-...`).
5. Enforce auth on all non-whitelisted routes.
6. Add the golden-workflow E2E + data-quality + schema-adaptation + security test matrix.

## Future (not claimed this cycle)
- OPC-UA/MQTT live ingestion, edge buffering/reconnect, real telemetry identity.
- PostgreSQL RLS enforcement.
- Autonomous decisions (still human-gated).
