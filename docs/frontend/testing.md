# Factory OS — Frontend Testing & Verification Strategy

## 1. Test Layers
1. **Static Analysis & Linting**: ESLint + TypeScript strict mode (`npm run lint:frontend`).
2. **Integration Verification**: Backend & AI Microservice test suite (`npm test`).
3. **End-to-End Golden Workflow**: Validated using `docs/manufacturing_defect_dataset.csv` against `backend/tests/test_e2e_golden_workflow.py`.

## 2. Verification Checklist
- [x] Global production context switcher updates all operational modules.
- [x] Active data context selector renders current capabilities and missing field diagnostics.
- [x] All 12 modular workspaces are independently navigable via sidebar.
- [x] Data Management pipeline is encapsulated within `/upload` without acting as a monolithic application stepper.
- [x] Full Pytest suite passes (47/47 tests passed, 0 failures).
