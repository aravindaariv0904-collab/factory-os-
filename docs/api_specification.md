# Factory OS API Specification (v1)

## Base URLs

| Service      | Base URL                                |
| ------------ | --------------------------------------- |
| Backend API  | `http://localhost:8000/api/v1`          |
| AI Service   | `http://localhost:8001`                 |
| Frontend     | `http://localhost:3000`                 |
| OpenAPI Docs | `http://localhost:8000/docs`            |

## Authentication

All endpoints except `/auth/*`, `/factories/`, and `/health` require a Bearer JWT:

```
Authorization: Bearer <access_token>
```

Obtain a token via `POST /auth/login`. Tokens are returned as `{ access_token, refresh_token, token_type }`.

### `POST /auth/login`
- **Request:** `{ "email": "alexander.vance@factoryos.ai", "password": "password123" }`
- **Response:** `{ "access_token": "...", "refresh_token": "...", "token_type": "bearer" }`

### `POST /auth/refresh`
- **Request:** `{ "refresh_token": "..." }`
- **Response:** `{ "access_token": "...", "refresh_token": "...", "token_type": "bearer" }`

### `GET /auth/me`
- **Response:** `{ "email": "...", "role": "Plant Manager", "factory_id": "..." }`

---

## Factories & Machines

### `GET /factories/`
- **Response:** `[{ "id", "name", "location", "type", "organization_id", "created_at", "updated_at" }]`

### `POST /factories/`
- **Request:** `{ "name", "location", "type", "organization_id"? }`
- **Response:** Created `Factory` (201)

### `GET /factories/{factory_id}` / `PATCH /factories/{factory_id}`
- PATCH accepts partial `{ "name"?, "location"?, "type"? }`.

### `GET /machines/?status={status}`
- Optional `status` filter (`Running`, `Idle`, `Down`, `Maintenance`).
- **Response:** `[{ "id", "name", "code", "plant_id", "line", "type", "status", "oee", "availability", "performance", "quality", "temperature", "vibration", "rul_hours", "health_score", "last_maintenance" }]`

### `POST /machines/`
- **Request:** `{ "name", "plant_id", "line", "type", "manufacturer"? }`
- **Response:** Created `Machine` (201)

### `GET /machines/{machine_id}` / `PATCH /machines/{machine_id}`
- PATCH accepts partial telemetry/status updates.

---

## Production

### `GET /production/orders`
- **Response:** `[{ "id", "order_number", "product_name", "sku", "target_quantity", "produced_quantity", "defective_quantity", "line", "status", "oee" }]`

### `POST /production/orders`
- **Request:** `{ "factory_id", "product_name", "sku", "target_quantity", "line" }`
- **Response:** Created `ProductionOrder` (201)

### `GET /production/downtime`
- **Response:** `[{ "id", "machine_id", "machine_name", "reason", "category", "duration_minutes", "impact_cost", "status", "created_at" }]`

### `POST /production/downtime`
- **Request:** `{ "machine_id", "reason", "category", "duration_minutes", "impact_cost"? }`
- **Response:** Created `DowntimeEvent` (201)

---

## Maintenance

### `POST /maintenance/work-orders`
- **Request:** `{ "machine_id", "priority", "description" }`
- **Response:** `{ "work_order_id", "status", "assigned_crew" }` (201)

### `GET /maintenance/logs`
- **Response:** `[{ "id", "machine_id", "priority", "description", "status", "created_at" }]`

---

## Quality

### `GET /quality/reports`
- **Response:** `[{ "id", "machine_id", "batch_id", "defect_type", "severity", "inspection_type", "status", "created_at" }]`

### `POST /quality/reports`
- **Request:** `{ "machine_id", "batch_id", "defect_type", "severity", "inspection_type", "status"? }`
- **Response:** Created `QualityReport` (201)

---

## Inventory

### `GET /inventory/`
- **Response:** `[{ "id", "sku", "item_name", "category", "quantity", "min_threshold", "max_capacity", "unit_cost", "location", "supplier", "status", "lead_time_days" }]`

### `POST /inventory/`
- **Request:** `{ "factory_id", "sku", "item_name", "category", "quantity", "min_threshold", "max_capacity", "unit_cost", "supplier"? }`
- **Response:** Created `InventoryItem` (201)

### `POST /inventory/{sku}/reorder?quantity={n}`
- Triggers a reorder for the SKU; **Response:** `{ "status": "reorder_placed", "sku", "quantity" }`

### `PATCH /inventory/{sku}`
- **Request:** `{ "quantity"?, "min_threshold"?, "max_capacity"?, "status"? }`

---

## Alerts & Recommendations

### `GET /alerts/`
- **Response:** `[{ "id", "title", "message", "severity", "machine_id", "is_read", "is_resolved", "created_at" }]`

### `POST /alerts/{alert_id}/read`
- Marks alert as read. **Response:** `{ "status": "ok" }`

### `POST /alerts/{alert_id}/resolve`
- Resolves alert. **Response:** `{ "status": "ok" }`

### `GET /recommendations/`
- **Response:** `[{ "id", "title", "description", "target_entity", "category", "impact_score", "estimated_savings", "confidence_score", "status", "actions", "created_at" }]`

---

## Reports & Data Upload

### `GET /reports/`
- **Response:** `[{ "id", "title", "category", "format", "status", "created_at", "download_url" }]`

### `POST /reports/generate?category={category}&format={format}`
- `category`: `Shift Daily Operations Digest` | `Weekly OEE & Asset Reliability Brief` | `Unplanned Downtime Pareto Audit` | `Quality Control & Defect Analysis`
- `format`: `PDF` | `XLSX` | `JSON`
- **Response:** `{ "report_id", "status": "queued" }` (201)

### `GET /reports/download/{report_id}`
- Downloads the compiled report (placeholder stream).

### `POST /upload/file`
- **Request:** Multipart `file` (CSV/XLSX/JSON).
- **Response:** `{ "upload_id", "filename", "status", "record_count", "columns", "sample_records" }`

### `GET /upload/history`
- **Response:** List of prior uploads.

---

## Analytics, Copilot & AI Predictions

### `GET /analytics/oee`
- **Response:**
  ```json
  {
    "overall_oee": 87.4, "availability": 94.5, "performance": 96.1,
    "quality": 98.4, "timeframe": "Last 7 Days",
    "shift_breakdown": [{ "shift": "Shift A", "oee": 89.4, "yield": 98.8 }]
  }
  ```

### `POST /copilot/query`
- **Request:** `{ "prompt": "Why did Line 4 OEE drop?" }`
- **Response:** `{ "id", "sender", "content", "timestamp", "evidence": { "confidence", "sources", "metrics", "recommendations" } }`

### `POST /predict/machine`
- **Request:** `{ "machine_id"? }` (telemetry-based heuristics fallback)
- **Response:** `{ "predicted_health_score", "predicted_rul", "failure_probability" }`

### `POST /knowledge/search`
- **Request:** `{ "query", "top_k"?: 3 }`
- **Response:** `{ "results_count", "documents": [{ "title", "filename", "size", "author", "updated_at", "tags" }] }`

---

## Digital Twin & Real-Time Streaming

### `GET /digital-twin/topology`
- **Response:** Plant topology graph of factories, lines, and machines.

### `GET /digital-twin/simulate-failure/{machine_id}`
- Simulates a failure event for a machine.

### `WS /stream/telemetry/{machine_id}`
- WebSocket streaming live machine telemetry at 100 Hz.

### `GET /stream/alerts`
- Server-Sent Events (SSE) stream of real-time alerts.

---

## AI Service (port 8001)

| Endpoint             | Description                                        |
| -------------------- | -------------------------------------------------- |
| `GET /health`        | Service health + loaded model registry status      |
| `GET /models`        | List of registered ML models                       |
| `POST /models/reload`| Hot-reload model registry from disk                |
| `POST /predict/machine` | Machine failure classification + RUL prediction |
| `POST /predict/health`  | Fleet health scoring                              |

---

## Health

### `GET /health` (root, port 8000)
- **Response:** `{ "status": "healthy", "version": "6.0.0", "service": "Factory OS" }`
