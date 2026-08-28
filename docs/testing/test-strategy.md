# Factory OS — Test Strategy & Coverage Assessment

**Owner:** OpenCode (QA)

## Current State

- Backend: 40 tests, all passing (smoke-level).
- ai_service: 5 tests, all passing.
- Frontend: **zero tests, no test framework configured.**
- No E2E, no API-contract suite, no failure-injection suite, no data-quality-attack suite.

## Required Test Matrix (Definition-of-Done has not been met)

### Unit
- [ ] Backend services, schemas, validators
- [ ] Frontend components/store/hooks (add vitest + @testing-library/react)

### Integration / API contract
- [ ] Status codes for all endpoints
- [ ] Validation errors, malformed JSON/query
- [ ] Auth required on every protected route (currently FAILING — see security report)
- [ ] Timeout / retry / idempotency / concurrency

### Security (see docs/security/)
- [ ] Unauthorized access on every endpoint (currently FAILING)
- [ ] Cross-tenant isolation (currently FAILING)
- [ ] IDOR, privilege escalation, invalid/expired JWT
- [ ] Malicious upload, path traversal, oversized payloads

### Data-quality attacks
- [ ] empty / malformed CSV
- [ ] missing / extra / renamed columns
- [ ] wrong datatypes, duplicates, missing values, extreme/invalid values
- [ ] class imbalance, corrupted timestamps, encoding problems

### Schema adaptation (golden-dataset variants)
- [ ] `Temp_C`, `temperature`, `temp`, `MachineTemp`, `bearing_temperature`
- [ ] low-confidence mapping → human review (verify at API layer)

### ML / MLflow
- [ ] train/inference preprocessing consistency
- [ ] reproducibility, leakage, class imbalance
- [ ] artifact load, feature mismatch, missing/unexpected features, invalid values
- [ ] model version correctness

### Reliability / failure injection
- [ ] DB down, Redis down, ML service down, worker crash, API dependency down
- [ ] recover safely + fail visibly (currently masked by mock fallback)

### E2E (golden workflow)
- [ ] upload → profile → mapping → validation → processing → experiment → model registration → prediction → explanation → recommendation → report → audit

## Priority
1. Contract + security tests on every route (high).
2. Fix build, then add frontend tests (high).
3. Wire real golden pipeline, then E2E (high).
