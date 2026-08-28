# Factory OS current state

**Audit date:** 2026-08-28  
**Evidence basis:** repository inspection, `docker-compose.yml`, service source, API routes, ORM models, tests, and the checked-in golden CSV.

## Implemented topology

```text
Next.js frontend
  -> FastAPI backend (/api/v1)
       -> SQLAlchemy (SQLite by default; PostgreSQL in compose)
       -> local filesystem storage service
       -> Celery/Redis configuration
       -> adaptive dataset/model services
  -> standalone FastAPI AI service
       -> joblib model directory
```

The backend now has a platform-oriented route family for datasets, jobs, models, platform predictions, recommendations, reports, and detailed health. Its `DatasetService` calls the Codex-owned profiler and mapping engine and persists profiles/mappings against tenant-scoped dataset versions. The existing legacy routes remain alongside it.

## Verified data/ML path

`backend.app.ai_engine.adaptive_intelligence` provides profiling, confidence-gated mappings, quality/leakage gating, deterministic classifier evaluation, a serialized preprocessing/model pipeline, artifact-only inference, attribution proxies, and drift recommendations. The test dataset is actually **14 records × 9 columns**, not the 3,240 × 17 described in the pasted mission. Its binary target is `Defect_Flag`; `Defect_Category` is flagged as a leakage candidate.

## Material gaps and contradictions

- The local append-only `DatasetRegistry` in the ML module duplicates the newly introduced database dataset/version registry. The database registry must become authoritative before release.
- The platform exposes model listing and artifact inference, but does not yet expose a governed train → validate → register → approve → deploy flow that persists `Experiment`, `MLModelRecord`, and `ModelVersion` from the adaptive engine.
- Legacy `backend.app.ml` and `ai_service.app.models` initialize synthetic models and accept default telemetry values. They are not safe production inference paths.
- The legacy ingestion pipeline mutates records through imputation and clamping. The dataset platform route preserves raw bytes, but the legacy upload route remains.
- The frontend service intentionally substitutes mock data, mock credentials, mock uploads, and fabricated success when calls fail. This is a P0 production-integrity issue, not an offline mode.
- The compose stack permits a default database password and default secret. Runtime configuration rejects known insecure JWT secrets only in staging/production, but compose still supplies one.
- Alembic exists but its initial migration calls SQLAlchemy `create_all`/`drop_all`, not explicit revision operations; it is not a safe, reviewable production migration history.
- Some legacy routes still hard-code an organization UUID, and the audit logger defaults a tenant value. Tenant isolation therefore cannot be accepted as release-ready.
- Reports, recommendation/outcome capture, protocol adapters, telemetry buffering, and real operational action enforcement are incomplete or legacy/demo behavior.

## Current release posture

**NO-GO.** Existing release reports document release blockers. The system is a development integration baseline, not a production-ready manufacturing platform.

