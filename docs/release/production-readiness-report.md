# Factory OS — Production Readiness Report

**Author:** Chief QA / Security / Reliability / Production Readiness Engineer (OpenCode)
**Date:** 2026-08-28
**Repository HEAD:** `3d569e6`
**Scope:** backend (FastAPI), ai_service (FastAPI), frontend (Next.js), docker-compose, scripts, docs.

> This report is based on **executable evidence** only. Every claim below was reproduced with a command, test, build run, or direct code inspection. No implementation success is assumed on the word of another agent.

---

## 1. Executive Summary

The repository contains a substantial amount of well-intentioned architecture, including a genuinely well-architected `adaptive_intelligence.py` golden workflow module with reproducibility, leakage detection, drift monitoring, and human-in-the-loop gates. **The unit-test suite (45/45) passes.**

However, **the live product does not use that golden pipeline**. The API and frontend implement a separate, synthetic, hardcoded path. As delivered, the system is **NOT production-ready** on every dimension that matters for a safety- and business-critical manufacturing platform.

**Release gate: NO-GO.** Multiple release-blocking conditions are present (see Section 8): critical security findings including unauthenticated tenant-wide data exposure, a production frontend build that fails to compile, the golden workflow that cannot be completed through the live product, fabricated report output, and a committed database.

---

## 2. Repository & Test Collection

### 2.1 Test suite execution

Executed with `pytest` (Python 3.14.7, pytest 9.1.1):

| Suite | Collected | Passed | Failed | Time |
|------|-----------|--------|--------|------|
| `backend/tests/` (40 tests) | 40 | 40 | 0 | 13.42 s |
| `ai_service/tests/` (5 tests) | 5 | 5 | 0 | 2.81 s |
| **Total** | **45** | **45** | **0** | 16.23 s |

Evidence: `40 passed, 807 warnings` and `5 passed, 1515 warnings`.

### 2.2 Test quality observations

- Tests pass but are **predominantly smoke tests** and, critically, **assert the current insecure behavior** (e.g. `test_v2_1_auth.py` uses the hardcoded `password123` bootstrap credential; `test_v5_0_enterprise.py` asserts version `6.0.0`).
- **No API contract tests** exist (no status-code / malformed-request / timeout / idempotency / concurrency coverage).
- **No failure-injection tests** exist (DB down, Redis down, ML service down, worker crash).
- **No data-quality-attack tests** exist (empty CSV, malformed CSV, wrong datatypes, oversized payloads, encoding, extreme values — none covered).
- **No schema-adaptation tests** for the `Temp_C` / `temperature` / `temp` / `MachineTemp` / `bearing_temperature` variants at the live API layer (only internal unit coverage, not API-exposed).
- **No security tests** (IDOR, cross-tenant, privilege escalation, invalid JWT handling beyond a happy-path check, malicious upload, path traversal).
- **Frontend has ZERO tests** and **no test framework installed**. No E2E, no component tests, no `vitest`/`jest`.

### 2.3 Frontend production build — FAILS

```
Running TypeScript ...
Failed to type check.
./src/app/(dashboard)/overview/page.tsx:58:27
Type error: Property 'refetch' does not exist on type '{ data: Machine[]; setData: ...}'
```

The `useApiData` hook does not return `refetch`, but `overview/page.tsx` destructures it. **The production bundle cannot be built or shipped as-is.** This is a release-blocking defect and the README's "42 tests, 100%" claim does not cover the frontend build.

---

## 3. Dependencies, Build, Docker / Runtime Configuration

### 3.1 Backend / ai_service (`requirements.txt`)

- Dependencies are **unpinned** (`fastapi[all]`, `numpy`, `pandas`, etc.). No lockfile, no hashes → **non-reproducible builds and supply-chain exposure**.
- No `pyproject.toml`; dependency drift between local Python 3.14 env and Docker's Python 3.11 is unmanaged.

### 3.2 Docker (`docker-compose.yml`, Dockerfiles)

- Frontend Dockerfile runs **`npm run dev`** (development server) as the production command, and EXPOSEs port **3000** while the app scripts run on port **3214** — the containerized production image is not production-shaped.
- Backend startup runs `init_models` + `seed_database` (seeds demo credentials/data) before serving — not appropriate for real production, and it hardcodes demo users with `password123`.
- Redis/Celery configured but the Redis "cache" in `core/cache.py` is actually an **in-memory dict** (not Redis), so queue/cache behavior is not what the deployment claims.

### 3.3 Committed database

`factoryos.db` (SQLite, ~577 KB) is **tracked in git** despite `*.db` in `.gitignore` (nothing untracks already-tracked files). It contains seeded users with bcrypt-hashed `password123` and demo operations data. Shipping a real DB in the repo is a release and security hazard. (Good: `.env`, `backend/factoryos.db`, `models/`, `*.joblib`, `chroma_db/` are ignored.)

---

## 4. Security Audit (attempted adversarial)

### 4.1 CRITICAL — Unauthenticated tenant-wide data exposure

Directly reproduced: these endpoints return `200` with live data **with no Authorization header**:

| Endpoint | Method | Evidence |
|----------|--------|----------|
| `/api/v1/factories/` | GET | 200 (list of all factories, IDs, metadata) |
| `/api/v1/factories/{id}` | GET | 200 (no auth, no `Depends`) |
| `/api/v1/machines/` | GET | 200 |
| `/api/v1/machines/{id}` | GET | 200 |
| `/api/v1/reports/` | GET | 200 |
| `/api/v1/reports/download/{id}` | GET | 200 (placeholder) |
| `/api/v1/upload/history` | GET | 200 |
| `/api/v1/predict/machine` | POST | 200 (no auth) |
| `/api/v1/production/*` list | GET | 200 |
| `/api/v1/quality/*` list | GET | 200 |
| `/api/v1/inventory/*` list | GET | 200 |
| `/api/v1/alerts` list | GET | 200 |
| `/api/v1/knowledge/search` | GET | 200 |
| `/api/v1/copilot/query` | POST | 200 |
| `/api/v1/digital-twin/*`, `/api/v1/stream/*` | — | unauthenticated |

`core/tenant.py`, `TenantIsolationManager`, `core/deps.py`, `require_roles` exist but are **not used** by these handlers. This is a **critical** information-disclosure / broken-access-control finding.

### 4.2 CRITICAL — Dev auth bootstrap residual risk

`auth.py:login` — when `user_count == 0` (a fresh DB, i.e. exactly a genuine new on-boarding), any email + password `password123` **mints a Plant Manager JWT** with a fixed `organization_id`. Gated on `settings.is_development`, but the default `environment` is `development` and a fresh production DB has zero users — if this path is reachable in production it is a full account-takeover vector. Currently non-exploitable only because the seeded DB has users and `allow_dev_auth_bypass=False`. See `backend/app/api/v1/auth.py:56-72`.

### 4.3 HIGH — Forgeable JWT in default configuration

`SECRET_KEY` in development resolves to `dev-only-insecure-key-not-for-production` (see `core/config.py:62`). In development anyone who knows the default can forge any role/org JWT. The production validator correctly rejects insecure keys **only if** `SECRET_KEY` is one of the known insecure defaults AND `environment` is production/staging — but the `.env` ships `SECRET_KEY=SUPER_SECRET_KEY_FACTORY_OS_2026` and `ENVIRONMENT=development`, so nothing guards production unless the operator overrides both. This is a configuration/training gap.

### 4.4 HIGH — Hardcoded hardcoded tenant ID

Every ingestion / write path hardcodes `organization_id="11111111-1111-1111-1111-111111111111"` instead of using the authenticated user's tenant (`upload.py:30`, `inventory.py:32`, `production.py:37,64`, `quality.py:31`, `maintenance.py:29`, `reports.py:51`, `celery_tasks.py:35`, `auth.py:66`). Any future tenant writes into org `1111...` → **multi-tenancy is non-functional**.

### 4.5 HIGH — No object-level authorization (IDOR)

`factories.update_factory`, `machines.update_machine`, `alerts.read/resolve`, `machines.get` fetch by ID without verifying the caller's org/factory scope. Any authenticated (or unauthenticated) caller can read/mutate arbitrary objects by ID.

### 4.6 HIGH — Unbounded / unsafe file upload

`upload.py` has **no size limit, no file-type allowlist beyond the filename extension, and no content sniffing**. The frontend advertises "Supports up to 500 MB" — there is no enforcement. `pd.read_excel`/`read_csv`/`json.loads` on attacker-controlled bytes can be a resource-exhaustion (zip bomb) or parser-exploitation vector, and there is no tenant-scoped storage path isolation.

### 4.7 HIGH — Internal error leakage

Global exception handler returns `f"Internal Server Error: {str(exc)}"` to clients (`main.py:35`, `ai_service/main.py` similarly). Upload returns `f"Data ingestion failed: {str(e)}"`. This leaks stack details, file paths, and potentially secrets.

### 4.8 MEDIUM — Joblib/pickle code execution on model artifacts

`joblib.load`/`pickle.dump` on artifacts (`adaptive_intelligence.py`, `ai_service/models.py`, `export.py`) is an arbitrary-code-execution vector if artifacts are attacker-writable. Combined with the unauthenticated `/models/reload` endpoint on ai_service (`ai_service/main.py`), this is dangerous in shared environments.

### 4.9 MEDIUM — ai_service endpoints unauthenticated

`/models`, `/models/reload`, `/predict/machine`, `/predict/health` on ai_service have **no authentication** and no tenant scoping, and `/models/reload` lets anyone force a model reload.

### 4.10 Frontend security

- Tokens stored in **`localStorage`** (XSS-exposed), not httpOnly/secure cookies.
- `AuthService.login` falls back to a **fabricated `mock_jwt_...` + mock user** when the backend is unreachable or returns an error — i.e. login "succeeds" without valid credentials.
- `request()` **silently falls back to mock data** on any backend failure (including 401 on non-auth routes, and 500s) — the UI shows fake data as if real, with no production fail-visible behavior.
- Hardcoded `password123` prefilled in the login form; a client-side "API key" is generated/displayed in Settings (no server backing).
- Sign Out does not call `clearTokens()` / `logout()`; it is a plain `<a href="/login">`.

---

## 5. Authentication, Authorization, Tenant Isolation

| Control | Status |
|---------|--------|
| JWT access tokens (HS256) | Implemented, but secret weak in dev/default config |
| Refresh tokens | Implemented but opaque; **no rotation/revocation/session binding** (`test_v3_2_security::test_refresh_token_rotation` checks mints, not revoke) |
| BCrypt password hashing | Implemented |
| `require_roles` (RBAC) | Defined **but never used** in any route |
| Tenant manager | Defined **but not enforced** on any data route |
| Rate limiting | `core/rate_limit.py` exists **but is not wired** anywhere |

---

## 6. ML / Data Pipeline & Report Generation

### 6.1 The good: `adaptive_intelligence.py`

This module is the correct design: real-data-only, no synthetic fallback, append-only artifact registry with SHA-256 lineage, quality states (`READY`/`REVIEW_REQUIRED`/`DEGRADED`/`BLOCKED`), leakage exclusion, principled `low-confidence → human review` mapping (`accepted = confidence >= 0.8`), constrained selection by F1→PR-AUC, drift monitor that only recommends, and versioned artifacts. However:

### 6.2 The bad: it is not reachable via the live product

`ExperimentEngine`, `DatasetRegistry`, `ArtifactInferenceService` are **referenced only by unit tests**. There is **no API route** exposing upload→profile→mapping→validation→processing→experiment→model-registration→prediction→explanation→recommendation→report→audit. The live `/api/v1/upload/file` calls a different pipeline (`IndustrialDataIngestionPipeline`) that only cleans/summarizes and **does not train, register, or explain any model**.

### 6.3 The synthetic production path

- `/api/v1/predict/machine` uses `ml/models.py` `MLModelRegistry`, which **fits fresh models on `np.random`-generated synthetic telemetry at import time** (`_fit_baseline_synthetic_models`). This is exactly the "silent synthetic production behavior" the rules forbid.
- `ai_service/models.py` has an explicit heuristic fallback and even a comment: *"Falls back to heuristic predictors if the artifacts are unavailable so the service always boots"* and a `_ScalerMixin` that fits a RobustScaler on random synthetic data. The docstring of `MODEL_FILES` references artifacts but the scaler is always synthetic.
- Note: the scaffolded `models/*.joblib` artifacts on disk are real trained models, but the **scaler is always re-fit on synthetic data**, so train/inference preprocessing consistency is **not** guaranteed against the real training set.

### 6.4 Report generation — fabricated

- `reports.py:download_report` returns a literal placeholder: `{"detail": "Report {id} download URL placeholder"}`.
- `reports.py:generate_report` records a `SystemReport` named `"Ready"` with no actual file, no content, and a non-functional download URL.
- The frontend "Download Certified Report" produces a **client-side fabricated text blob** with hardcoded metrics (94.8% accuracy, F1 0.912, ROC-AUC 0.965, "Model v2.4.1"), SHAP values, and action steps. None of it derives from the user's upload. The report cannot be reconciled to any model artifact, dataset, or audit record.
- **"Certified Manufacturing Intelligence Report"** with a fabricated download, shown to an operator as authoritative, is a safety/trust violation.

### 6.5 Upload frontend workflow is simulated

`frontend/src/app/(dashboard)/upload/page.tsx` implements the 10-step golden workflow entirely with `setTimeout`, hardcoded row counts (`14200`), hardcoded schema profiles, hardcoded warnings, hardcoded mapping, and hardcoded model metrics — **no real profiler, no real training, no real prediction, no real report**.

---

## 7. Mock / Synthetic Data Audit

Searched the whole codebase for `mock`, `dummy`, `fake`, `synthetic`, `sample`, `hardcoded`, `placeholder` (excluding vendored `.python-deps/`, `node_modules/`).

### 7.1 Frontend — PRODUCTION BUGS (mock used as production fallback)

| Location | Classification |
|----------|----------------|
| `src/services/index.ts:56-79` `request()` — silent mock fallback on any failure | **PRODUCTION BUG** (fail-visible rule violated; stale/fake data shown) |
| `src/services/index.ts:223` `auth login` — `mock_jwt_${Date.now()}` on failure | **PRODUCTION BUG** (auth bypass) |
| `src/services/index.ts:472-480` upload mock fallback | **PRODUCTION BUG** |
| `src/hooks/useApiData.ts` — fallback on catch | **PRODUCTION BUG** |
| `src/store/useAppStore.ts` — default `MOCK_USER`/`MOCK_FACTORIES`/`MOCK_ALERTS` | **PRODUCTION BUG** |
| `src/app/(dashboard)/upload/page.tsx` — simulated 10-step pipeline | **PRODUCTION BUG** |
| `src/app/(dashboard)/reports/page.tsx` — client-side fabricated report | **PRODUCTION BUG** |
| `src/app/(dashboard)/settings/page.tsx` — client-generated "API key" | **PRODUCTION BUG / security** |
| `src/app/(dashboard)/register/page.tsx` — no backend call (redirect only) | **PRODUCTION BUG** (broken auth flow) |
| `src/app/(dashboard)/forgot-password/page.tsx` — cosmetic | **PRODUCTION BUG** |
| `src/app/(dashboard)/analytics/page.tsx` — hardcoded CSV export | **PRODUCTION BUG** |
| `src/app/(dashboard)/knowledge-base/page.tsx` — mutates in-memory mock array | **PRODUCTION BUG** |
| `src/mock/index.ts` | **DEVELOPMENT ONLY** (intended mock module) but note leak into prod paths above |

### 7.2 Backend / ai_service

| Location | Classification |
|----------|----------------|
| `ml/models.py:_fit_baseline_synthetic_models` — synthetic fit at import | **PRODUCTION BUG** |
| `pipeline/synthetic_generator.py` | VALID TEST USE / development-only simulator |
| `ai_engine/dataset.py` synthetic benchmark generator | VALID TEST USE |
| `stream.py` random telemetry + canned SSE alerts | **PRODUCTION BUG / placeholder telemetry** (unauthenticated, fake) |
| `reports.py:download` placeholder | **PRODUCTION BUG** |
| `ai_service/models.py` heuristic fallback + synthetic scaler | **PRODUCTION BUG** |

---

## 8. Release Gate

### 8.1 Gate conditions (from the mandate)

| Condition | Status | Evidence |
|-----------|--------|----------|
| Critical security issue | **YES** | Unauthenticated data exposure (4.1), bootstrap auth residual (4.2), weak secret (4.3) |
| Cross-tenant data leak | **YES** | No tenant enforcement; hardcoded org id (4.2, 4.4) |
| Fake production data | **YES** | Synthetic ML pipeline (6.3), fabricated reports (6.4), frontend mock fallback (7.1) |
| Broken database migration | **YES (risk)** | Alembic migrations are only compiled `.pyc`; no `alembic.ini`, no migration source. Schema is created via `Base.metadata.create_all` at startup, not migrations |
| Model preprocessing mismatch | **YES** | Synthetic scaler vs real training set (6.3) |
| Unverified core workflow | **YES** | Golden workflow not wired to API/frontend (6.2, 6.5) |
| Corrupted report output | **YES** | Placeholder + fabricated reports (6.4) |
| Missing audit trail for important actions | **YES** | Audit service exists but is not wired to report/resolution/action endpoints; no terminal action audit |

### 8.2 Verdict

# **NO-GO**

The product is not production-ready. At least five independent release-blocking conditions are present.

---

## 9. Production Readiness Scores

Scored 0–10 per the mandate criteria. No invented numbers — each is justified by evidence above.

| Dimension | Score | Justification |
|-----------|:-----:|---------------|
| Correctness | 4 | Tests pass, but core workflow doesn't run end-to-end; build fails |
| Security | 2 | Unauthenticated data exposure, weak secrets, no tenant/RBAC enforcement |
| Reliability | 3 | No failure-injection tests; silent mock fallback hides failures; no recovery verification |
| Data integrity | 3 | Duplicates preserved (good), but no persistence of processed results; committed DB |
| ML integrity | 3 | Good adaptive_intelligence module, but production predict path is synthetic |
| Observability | 3 | Structured logging in places, but no metrics/tracing/audit wiring |
| Performance | 2 | No benchmarks taken (correctly not invented); no load/concurrency tests; unbounded uploads |
| Maintainability | 4 | Duplicate DB modules (`core/database` vs `db/session`), unpinned deps, dead code |
| Deployment | 2 | `npm run dev` in prod Dockerfile, port mismatch, build fails, migrations missing |

**Weighted overall: ~2.9 / 10 — NOT production-ready.**

---

## 10. Will It Meet Release Requirements? (Direct answers)

> **Can a new user upload manufacturing_defect_dataset.csv and complete the full workflow without manually editing code?**
> **NO.** The live upload+predict+report path is synthetic/hardcoded and does not train/register/explain/report against the real upload. The frontend 10-step "golden" workflow is simulated with `setTimeout` and fabricated metrics.

> **Can the system handle a different but semantically similar dataset?**
> **PARTIALLY / NO (live).** `adaptive_intelligence.py` handles this correctly in isolation but it is not exposed via API. The live ingestion does not do semantic column mapping and the frontend just shows hardcoded column profiles.

> **Can the system explain what it predicted?**
> **NO (live).** The live `/predict/machine` returns no SHAP/attribution. SHAP exists only internal to the (unreachable) adaptive module. The frontend SHAP chart is hardcoded.

> **Can the system prove which model and dataset generated a result?**
> **NO (live).** Results carry no dataset/model lineage; report/metrics are fabricated.

> **Can another tenant access this tenant's data?**
> **YES.** No tenant enforcement; unauthenticated endpoints expose all data; only one hardcoded org exists.

> **Can the system recover from service failure?**
> **NOT VERIFIED.** No failure-injection tests; mock fallback silently masks backend failure instead of failing visibly.

> **Can the reports be downloaded and verified?**
> **NO.** Download endpoint is a placeholder; frontend download is a fabricated local text blob with no verifiable source.

---

## 11. Priority Rectification Roadmap (suggested, for the owning agents)

| # | Fix | Owner | Severity |
|---|-----|-------|----------|
| 1 | Add auth + tenant isolation + RBAC to every route; remove hardcoded org id | Cursor | Critical |
| 2 | Remove silent mock fallback; fail visibly on backend failure; enforce 401 | Antigravity | Critical |
| 3 | Fix frontend TS build error (`refetch`) in `overview/page.tsx` | Antigravity | Critical |
| 4 | Wire the adaptive_intelligence golden pipeline to real API endpoints | Codex + Cursor | Critical |
| 5 | Real report generation with lineage; remove placeholder/fabricated output | Cursor + Antigravity | Critical |
| 6 | Replace synthetic ML/scaler with real trained preprocessor; lock versions | Codex | High |
| 7 | Restore Alembic migration source; replace `create_all` | Cursor | High |
| 8 | Enforce upload size/type limits; tenant-scoped storage | Cursor | High |
| 9 | Remove committed `factoryos.db`; rotate any leaked creds | Cursor | High |
| 10 | Sanitize exception responses (stop leaking `str(exc)`) | Cursor | High |
| 11 | Add full test matrix (contracts, security, data-quality, schema-adaptation, failure-injection, E2E) | OpenCode | High |

---

## 12. Verification Evidence Index

- Backend tests: `python -m pytest backend/tests/ -v` → 40 passed
- AI tests: `python -m pytest ai_service/tests/ -v` → 5 passed
- Unauthenticated access: `GET /api/v1/factories/`, `/reports/`, `/upload/history`, `/machines/` → all `200`
- Manual bootstrap login with fresh-DB precondition → not currently reachable (DB seeded), but code path present at `auth.py:56-72`
- Frontend build: `npx next build` → TypeScript failure on `overview/page.tsx:58`
- Report placeholder: `reports.py:67`; fabricated frontend report: `upload/page.tsx:135`
