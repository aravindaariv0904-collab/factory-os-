# Factory OS — Integration Notes & Acceptance Criteria

## Integration Notes
- **Frontend-Backend Interface**: Connected via typed client in `frontend/src/services/index.ts` with JWT bearer authentication.
- **Port Strategy**: Web Frontend on `:3214`, Backend API Gateway on `:8000`, ML Microservice on `:8001`.
- **CORS Configuration**: Allowed origins include `http://localhost:3214` and `http://127.0.0.1:3214`.

## Acceptance Criteria (Definition of Done)
1. **Upload & Profiling**: Dataset upload processes cleanly, renders column distributions, data types, and row count.
2. **Review Warnings**: Flags missing values, extreme sensor outliers, and zero-variance columns.
3. **Approve Mapping**: Operator can map raw column names to canonical schema fields and specify target variable.
4. **Run Processing**: Cleaning and feature extraction completes with verifiable execution logs.
5. **View Model & Review Prediction**: Displays model metrics (F1, Accuracy, ROC-AUC) and prediction distributions with SHAP attribution.
6. **Understand Recommendation & Approve Action**: Formulates actionable engineering protocols with 1-click MES dispatch.
7. **Certified Report**: Generates and downloads certified executive intelligence summary.
8. **Automated Tests**: Pytest test suite passes 100%.
