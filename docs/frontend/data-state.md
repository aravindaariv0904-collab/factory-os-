# Factory OS — Frontend Data State & Lifecycle Management

## 1. State Management with Zustand
The frontend application state is maintained via `useAppStore.ts` with explicit separation between UI preferences and production context:

- **UI State**: Theme (`dark`/`light`), sidebar collapse, modals open/close, command menu.
- **Production Context**: `activeFactory`, `factories`, `currentUser`.
- **Data Context**: `activeDataContext` (`dataset_id`, `dataset_version`, `filename`, `capabilities`, `unavailable_reasons`).
- **Telemetry & Alerts**: Active alarm array with real-time `acknowledge` and `resolve` transitions.

## 2. API Data Fetching Strategy
- **Scoped Queries**: All network requests pass context headers or query parameters to guarantee tenant and site isolation.
- **Fail Explicitly**: In production mode, API errors render informative banner cards without silently substituting fake mock data.
