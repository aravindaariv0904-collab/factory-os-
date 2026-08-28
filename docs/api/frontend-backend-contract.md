# Factory OS — Frontend-to-Backend Interface Contract

This contract defines the stable API boundary between the **Antigravity (Frontend)** layer and the **Cursor (Backend)** layer.

---

## 1. Global Context & Tenant Management

### 1.1 Active Production & Site Resolution
- **Endpoint**: `GET /api/v1/factories/`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of Factory objects:
  ```json
  [
    {
      "id": "fact_01",
      "name": "Gigafactory Nevada — Line 1-4",
      "location": "Sparks, NV",
      "type": "Battery & EV Subassembly",
      "metadata_json": { "lines": 8, "active_machines": 42 },
      "oee_target": "87.4"
    }
  ]
  ```

### 1.2 Active Data Context & Capabilities
- **Endpoint**: `GET /api/v1/datasets/active` or `GET /api/v1/datasets/`
- **Headers**: `Authorization: Bearer <token>`
- **Response Structure**:
  ```json
  {
    "dataset_id": "default_golden_v1",
    "dataset_version": "1.0.0",
    "filename": "manufacturing_defect_dataset.csv",
    "data_mode": "BATCH",
    "quality_status": "READY",
    "capabilities": {
      "quality_analytics": { "status": "AVAILABLE", "reason": "Defect classification fields mapped" },
      "defect_prediction": { "status": "AVAILABLE", "reason": "Target and process telemetry mapped" },
      "production_analytics": { "status": "AVAILABLE", "reason": "Volume and cost metrics present" },
      "maintenance_indicators": { "status": "PARTIAL", "reason": "Maintenance hours present; sensor stream absent" },
      "inventory_analytics": { "status": "AVAILABLE", "reason": "Turnover and stockout fields mapped" },
      "energy_analytics": { "status": "AVAILABLE", "reason": "Energy consumption metrics mapped" },
      "oee_calculation": { "status": "INSUFFICIENT_DATA", "reason": "Requires cycle_time, planned_operating_time, and good_count" },
      "live_telemetry": { "status": "SIMULATION_MODE", "reason": "OPC-UA / MQTT edge gateway not connected" },
      "rul_regression": { "status": "INSUFFICIENT_DATA", "reason": "Requires continuous sensor time-series history" }
    },
    "unavailable_reasons": {
      "oee_calculation": "Missing cycle_time and planned_time fields in active dataset",
      "live_telemetry": "Edge gateway OPC-UA connection not configured; using simulation stream",
      "rul_regression": "Requires continuous time-series degradation telemetry"
    }
  }
  ```

---

## 2. Operations & Manufacturing Intelligence

### 2.1 Production Work Orders & Downtimes
- `GET /api/v1/production/orders`
  - Query Params: `?factory_id={id}`
  - Returns array of production orders with target, produced, defect count, status.
- `GET /api/v1/production/downtime`
  - Returns recorded downtime incidents and cost impacts.

### 2.2 Machine Fleet & Telemetry
- `GET /api/v1/machines/`
  - Returns array of machines with status, health score, vibration, temperature, RUL.
- `POST /api/v1/predict/machine`
  - Payload: `{ "machine_id": string, "temperature_deg_c": float, "vibration_mm_s": float }`
  - Returns anomaly score, failure mode, and SHAP feature attributions.

### 2.3 Quality Control & Inspection
- `GET /api/v1/quality/reports`
  - Returns batch inspection records, pass/fail yields, and defect categorization.

### 2.4 Inventory Management
- `GET /api/v1/inventory/`
  - Returns current raw material stock, unit costs, warehouse locations, and safety thresholds.
- `POST /api/v1/inventory/{sku}/reorder?quantity={int}`
  - Initiates purchase order for specified SKU.

---

## 3. Decision Intelligence & Multi-Agent Copilot

### 3.1 AI Copilot Query
- `POST /api/v1/copilot/query`
- **Request**:
  ```json
  {
    "prompt": "Diagnose thermal anomaly on Laser Weld Cell 03",
    "context": {
      "factory_id": "fact_01",
      "dataset_id": "default_golden_v1",
      "data_mode": "BATCH"
    }
  }
  ```
- **Response**:
  ```json
  {
    "id": "msg_UUID",
    "sender": "Factory OS Supervisor Agent",
    "content": "Markdown diagnostic response",
    "timestamp": "ISO8601",
    "evidence": {
      "confidence": 0.96,
      "sources": ["SOP-WLD-03", "Telemetry Stream"],
      "metrics": { "temperature": "78.2°C", "vibration": "5.4 mm/s" },
      "recommendations": ["Reduce feed rate by 8.5%", "Purge nitrogen optic lens"],
      "chartData": [{ "time": "14:00", "actual": 68.2, "predicted": 72.1 }]
    }
  }
  ```

---

## 4. Error Handling & Capability Degradation
- All endpoints must return standard HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `500`).
- Frontend must not invent fallback numbers; if a capability is `INSUFFICIENT_DATA` or `NOT_CONNECTED`, the UI must render the diagnostic badge and explanation provided by the backend contract.
