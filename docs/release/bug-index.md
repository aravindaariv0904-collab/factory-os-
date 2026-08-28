# Factory OS — Bug Report Index (Release-Blocking)

**Owner:** OpenCode
**Gate:** NO-GO

## BLOCK-01 — Frontend production build fails (TypeScript)
- Severity: CRITICAL
- Repro: `cd frontend && npx next build`
- Expected: build succeeds.
- Actual: `Type error: Property 'refetch' does not exist ... overview/page.tsx:58`
- Component: `frontend/src/app/(dashboard)/overview/page.tsx`, `frontend/src/hooks/useApiData.ts`
- Evidence: build output (see production-readiness-report.md §2.3)
- Recommended fix: add `refetch` to `useApiData` return type or remove the destructure.
- Regression test: CI build step.

## BLOCK-02 — Unauthenticated tenant-wide data exposure
- Severity: CRITICAL
- Repro: `GET /api/v1/factories/` without auth → 200.
- Component: backend route handlers.
- Fix: auth + tenant scope on every route.

## BLOCK-03 — Golden workflow not reachable live
- Severity: CRITICAL
- Repro: Upload `manufacturing_defect_dataset.csv` via UI/API; observe no real profiling/training/explanation/report.
- Component: `frontend upload/page.tsx` (simulated), backend lacks API wiring for `adaptive_intelligence`.
- Fix: expose the real pipeline.

## BLOCK-04 — Fabricated / placeholder reports
- Severity: CRITICAL
- Repro: `GET /api/v1/reports/download/{id}` → `{"detail":"... download URL placeholder"}`; frontend download is a fabricated text blob.
- Component: `backend/app/api/v1/reports.py`, `frontend .../reports/page.tsx`, `upload/page.tsx`.
- Fix: generate real reports with lineage + verified download.

## BLOCK-05 — Synthetic production ML / scaler mismatch
- Severity: HIGH
- Repro: `/api/v1/predict/machine` uses models fitted on `np.random` data at import; ai_service scaler fit on synthetic distribution.
- Component: `backend/app/ml/models.py`, `ai_service/app/models.py`.
- Fix: use real trained preprocessor; version artifacts.

## BLOCK-06 — Database migrations are non-functional
- Severity: HIGH
- Repro: alembic dir contains only compiled `.pyc`; no `alembic.ini`, no migration source; schema via `create_all`.
- Component: backend DB layer.

## BLOCK-07 — Committed SQLite DB with credentials
- Severity: HIGH
- Repro: `git ls-files factoryos.db` → tracked.
- Fix: remove & repurpose; rotate.

Each BLOCK needs a corresponding regression test added to the test matrix (docs/testing/test-strategy.md).
