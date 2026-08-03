# Factory OS API Specification (v1)

## Base URL
`http://localhost:8000/api/v1`

## Authentication
All endpoints except `/auth` require a Bearer JWT Token.

---

### 1. Authentication
#### POST `/auth/register`
- **Request:** `{ email, password, full_name, role, factory_id }`
- **Response:** `{ id, email, full_name, role }`

#### POST `/auth/login`
- **Request:** `{ email, password }`
- **Response:** `{ access_token, token_type: "bearer" }`

---

### 2. Data Ingestion
#### POST `/data/upload`
- **Request:** Multipart Form (File: CSV/Excel, Type: "production", "maintenance", etc.)
- **Response:** `{ job_id, status: "processing", rows_imported: 0 }`

#### GET `/data/jobs/{job_id}`
- **Response:** `{ job_id, status: "completed", metadata: { ... } }`

---

### 3. Analytics (OEE & Metrics)
#### GET `/analytics/kpis`
- **Params:** `factory_id, start_date, end_date`
- **Response:** OEE, Availability, Performance, Quality, Downtime stats.

#### GET `/analytics/machine/{machine_id}`
- **Response:** Historical performance, downtime analysis, cycle time distribution.

---

### 4. AI Copilot (LangGraph)
#### POST `/copilot/chat`
- **Request:** `{ session_id, message }`
- **Response:**
  ```json
  {
    "response": "Machine 4 is at high risk of failure...",
    "evidence": ["Vibration exceeded 4.5mm/s", "Temperature rising"],
    "charts": [{ "type": "line", "data": [...] }],
    "confidence": 0.91,
    "recommendations": ["Schedule maintenance", "Reduce load"],
    "agents_involved": ["maintenance_agent", "analytics_agent"]
  }
  ```

---

### 5. Maintenance & Predictions
#### GET `/maintenance/predictions`
- **Response:** List of machines with failure probabilities and RUL (Remaining Useful Life).

#### GET `/maintenance/rca/{machine_id}`
- **Response:** Root Cause Analysis for recent failures using SHAP/AI Reasoning.

---

### 6. Inventory & Quality
#### GET `/inventory/status`
- **Response:** Current stock levels vs thresholds, AI-predicted reorder dates.

#### GET `/quality/report`
- **Response:** Defect rates, Pareto analysis of defect types, batch quality trends.
