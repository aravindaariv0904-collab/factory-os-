# Factory OS — Global Context Management & Switching

## 1. Dual-Context Hierarchy
Factory OS enforces strict context isolation across two primary dimensions:
1. **Active Production Context** (`factory_id`): Controls machine fleet, inventory warehouses, production lines, shift work orders, and plant-specific audit logs.
2. **Active Data Context** (`dataset_id` / `version`): Controls the schema mapping, feature definitions, trained models, prediction outputs, and capability availability.

## 2. Production Switching Lifecycle
When switching between production facilities (e.g. Plant A → Plant B):
- UI displays a transitional overlay: `SWITCHING PRODUCTION CONTEXT...`.
- Client cache is invalidated using scoped keys: `production/{id}/...` and `context/{id}/...`.
- New factory data (machines, lines, alerts, recommendations) is fetched in parallel.
- No residual data from the previous production context remains rendered.

## 3. Active Data Context Lifecycle
When switching between datasets or versions:
- Evaluates dataset metadata against module requirements.
- Updates module capability statuses (`AVAILABLE`, `PARTIAL`, `INSUFFICIENT_DATA`).
- Injects active dataset metadata into Copilot query payloads to prevent cross-dataset hallucination.
