# Factory OS — Versioned Canonical Manufacturing Data Model

**Version:** 1.0.0  
**Specification:** Manufacturing Domain Concepts & Mapping Dictionary

---

## 1. Domain Entities & Canonical Concept Hierarchy

The adaptive data pipeline maps arbitrary incoming source column names (e.g. `Temp_C`, `Maint_Hrs`, `Defect_Flag`) to standardized canonical concepts across 10 manufacturing sub-domains.

| Domain Concept | Canonical Field | Data Type | Units / Range | Description |
|---|---|---|---|---|
| **Asset Identifier** | `asset.identifier` | Categorical / String | Unique ID | Machine, line, or equipment identifier |
| **Time Semantics** | `operations.timestamp` | Datetime / ISO-8601 | UTC timestamp | Sensor event or record timestamp |
| **Process Temperature** | `process.temperature` | Numeric / Float | `celsius` | Machine operating temperature |
| **Process Vibration** | `process.vibration` | Numeric / Float | `mm_s` | Harmonic vibration amplitude |
| **Rotational Speed** | `process.rotational_speed` | Numeric / Float | `rpm` | Spindle/bearing rotational speed |
| **Torque** | `process.torque` | Numeric / Float | `newton_metre` | Shaft or motor torque |
| **Maintenance Hours** | `maintenance.hours` | Numeric / Float | `hours` | Cumulative operating hours |
| **Tool Wear** | `maintenance.tool_wear` | Numeric / Float | `minutes` | Tool usage time since last service |
| **Quality Defect** | `quality.defect` | Binary Target (0/1) | `[0, 1]` | Defect indicator or failure flag |
| **Quality Score** | `quality.score` | Numeric / Float | `0.0 - 1.0` | Measured quality index |
| **Production Volume** | `production.count` | Numeric / Integer | Units | Units produced per batch/shift |
| **Inventory Quantity** | `inventory.quantity` | Numeric / Integer | Units | Raw material or stock quantity |
| **Workforce ID** | `workforce.identifier` | Categorical / String | String | Operator ID or shift code |
| **Safety Incident** | `safety.incident` | Binary / Categorical | `[0, 1]` | Safety flag or incident event |
| **Energy Consumption**| `energy.consumption` | Numeric / Float | `kwh` | Power consumption rate |

---

## 2. Mapping Dictionary & Semantic Matching Rules

Matching proceeds through 4 sequential layers:

1. **Exact Match**: Direct equality with canonical field or explicit alias.
2. **Alias Dictionary**: Lookup against normalized aliases (e.g., `temp` → `process.temperature`).
3. **Fuzzy String Matching**: Token ratio similarity score (`confidence ≥ 0.70`).
4. **Data Type Compatibility**: Ensures numerical features map to numerical canonical slots.

---

## 3. Data Layers (Bronze, Silver, Gold)

- **BRONZE (Raw)**: Immutable original bytes stored at dataset upload in raw storage (`storage_service`).
- **SILVER (Validated)**: Profiling, semantic mapping, sentinel null resolution, and quality gate assessment completed.
- **GOLD (ML-Ready)**: Feature engineering, leakage removal, scaling, and numeric vectorization completed for training/inference.
