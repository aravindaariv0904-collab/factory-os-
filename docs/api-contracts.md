# Factory OS — API Contracts & Interface Definitions

## 1. Authentication & Security Endpoints
- `POST /api/v1/auth/login`
  - Request: `{ "email": string, "password": string }`
  - Response: `{ "access_token": string, "token_type": "bearer", "user": { "id": UUID, "email": string, "role": string } }`
- `GET /api/v1/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Response: Current user profile with RBAC scope.

## 2. Ingestion & Dataset Profiling
- `POST /api/v1/upload/file`
  - Request: `multipart/form-data` with `file` payload (.csv, .xlsx, .json).
  - Response:
    ```json
    {
      "upload_id": "UUID",
      "filename": "manufacturing_defect_dataset.csv",
      "status": "Pipeline Ingestion Complete",
      "record_count": 14200,
      "columns": ["Machine_ID", "Timestamp_UTC", "Vibration", "Temperature", "Tool_Wear", "Defect_Code"],
      "sample_records": [{ "Machine_ID": "WLD-03", "Vibration": 1.42, "Temperature": 68.5 }]
    }
    ```

## 3. Production & Machine Telemetry
- `GET /api/v1/machines/`
  - Response: Array of Machine objects with status, health score, vibration, temperature, and RUL.
- `GET /api/v1/production/orders`
  - Response: Array of MES production orders.

## 4. AI Decision Intelligence & RAG
- `POST /api/v1/copilot/query`
  - Request: `{ "prompt": string, "context": object (optional) }`
  - Response:
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
        "recommendations": ["Reduce feed rate", "Purge nitrogen optic lens"],
        "chartData": [{ "time": "14:00", "actual": 68.2, "predicted": 72.1 }]
      }
    }
    ```

## 5. ML Inference & Explainability
- `POST /api/v1/predict/machine`
  - Request: `{ "temperature": float, "vibration": float, "tool_wear": float, "rotational_speed": float }`
  - Response:
    ```json
    {
      "machine_id": "string",
      "anomaly_score": 0.88,
      "is_anomaly": true,
      "failure_probability": 0.84,
      "predicted_failure_mode": "Heat Dissipation Failure (HDF)",
      "predicted_rul_hours": 18.5,
      "feature_attributions": {
        "temperature": 0.45,
        "vibration": 0.35,
        "tool_wear": 0.20
      }
    }
    ```
