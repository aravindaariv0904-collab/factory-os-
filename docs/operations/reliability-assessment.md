# Factory OS — Operations & Reliability Assessment

**Owner:** OpenCode (Reliability)

## Reliability posture
Not verified. No failure-injection tests exist, and the frontend silently falls back to mock data on backend failure, so outages are **masked** rather than surfacing as failures.

## Kill scenarios to cover (all currently UNVERIFIED)
1. Database connection down
2. Redis down (note: "Redis" cache is actually an in-memory dict — `core/cache.py`)
3. ML service (ai_service) down
4. Report/Celery worker crash
5. API dependency down

## Findings
- `cache.py` claims Redis but is an in-memory dict; no real distributed cache/queue behavior.
- Celery worker/beat configured but no queue-related tests.
- Frontend: no loading / empty / stale / offline / API-failure / job-progress / correct-model-version / correct-report-status / approval-workflow tests.
- No observability (metrics/tracing) wiring; only stdout logging.
- No performance benchmarks taken (correctly — we do not invent numbers). No upload/profiling/processing latency, API latency, prediction latency, concurrency, or queue benchmarks exist.

## Recommendation
Introduce contract-test gate + failure-injection harness; require fail-visible behavior before reliance.
