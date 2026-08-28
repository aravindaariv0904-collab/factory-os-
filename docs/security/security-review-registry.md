# Factory OS — Security Review Registry

**Owner:** OpenCode (Security)
**Status:** OPEN — multiple release-blocking findings

Severity key: CRITICAL / HIGH / MEDIUM / LOW. See docs/release/production-readiness-report.md for full evidence.

## SEC-001 — CRITICAL — Unauthenticated data exposure on most read endpoints
- Reproduction: `GET /api/v1/factories/` with no `Authorization` header → `200` with live data. Same for `machines/`, `reports/`, `upload/history`, `production/`, `quality/`, `inventory/`, `alerts`, `predict/machine`, `knowledge/search`, `copilot/query`.
- Expected: `401 Unauthorized`.
- Actual: `200` with tenant data.
- Component: `backend/app/api/v1/*` (factories, machines, reports, upload, production, quality, inventory, alerts, predict, knowledge, copilot, recommends, analytics, stream, digital_twin).
- Recommended fix: add `Depends(get_current_user)` to every read route; enforce tenant scope.
- Regression test required: auth block test per endpoint.

## SEC-002 — CRITICAL — Dev auth bootstrap grants Plant Manager for any email (fresh DB)
- Reproduction: with `user_count == 0`, `POST /auth/login` `{email: <anything>, password: "password123"}` returns a Plant Manager JWT (fixed org 1111...). `auth.py:56-72`.
- Expected: never grant access without a real user + correct password.
- Actual: fresh-DB path mints privileged token on guessed password.
- Component: `backend/app/api/v1/auth.py`.
- Recommended fix: remove password-based bootstrap; provide a real first-admin setup that requires an operator-provided secret; do not gate on `environment==development`.
- Regression test required: fresh empty DB + `password123` must NOT authenticate.

## SEC-003 — HIGH — Hardcoded tenant ID on all writes
- Component: `upload.py:30`, `inventory.py:32`, `production.py:37,64`, `quality.py:31`, `maintenance.py:29`, `reports.py:51`, `celery_tasks.py:35`, `auth.py:66`.
- Recommended fix: derive `organization_id` from the authenticated `CurrentUser`.

## SEC-004 — HIGH — No IDOR / object authorization
- `factories.update_factory`, `machines.update_machine`, `alerts.read/resolve` mutate by ID without ownership check.

## SEC-005 — HIGH — Unrestricted file upload
- No size limit, no type/content allowlist, no tenant storage scoping; "500 MB" advertised but unenforced.

## SEC-006 — HIGH — Internal exception leakage
- `main.py` returns `str(exc)`; upload returns `str(e)`.

## SEC-007 — MEDIUM — Weakened JWT secret default
- Dev secret resolves to public default; forgeable tokens in dev; config must hard-fail for production.

## SEC-008 — MEDIUM — ai_service unauthenticated
- `/models/reload`, `/models`, `/predict/*` have no auth; joblib unpickle is an RCE risk if artifacts are attacker-writable.

## SEC-009 — MEDIUM — Frontend token storage & mock auth fallback
- Tokens in `localStorage`; `login()` returns `mock_jwt_` on failure; silent mock fallback on backend errors; Sign Out doesn't clear tokens.

## SEC-010 — MEDIUM — Committed database
- `factoryos.db` tracked in git (seeded users with `password123` hashes + demo data). Must remove from history and rotate.

## SEC-011 — LOW — CORS too permissive
- `allow_credentials=True` with multiple localhost origins; tighten per environment.
