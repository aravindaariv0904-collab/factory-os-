# Factory OS — Data Contracts & Quality Rules

## 1. Golden Ingestion Standard: `manufacturing_defect_dataset.csv`
The system utilizes `manufacturing_defect_dataset.csv` as the reference benchmark for telemetry profiling, adaptive feature extraction, and ML defect classification.

### Expected Field Types & Validation Rules
| Column Name | Logical Type | Unit | Nullable | Validation Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `Machine_ID` | Categorical / String | — | No | Matches regex `^[A-Z]{2,4}-[0-9]{2,3}$` |
| `Timestamp_UTC` | ISO8601 Timestamp | UTC | No | Valid monotonic sequence |
| `Process_Temperature` | Float | °C | Yes (Imputed) | Range: `[15.0, 150.0]` |
| `Vibration_Harmonic` | Float | mm/s | Yes (Imputed) | Range: `[0.0, 30.0]` |
| `Tool_Wear_Index` | Float | Minutes | Yes | Monotonically increasing per cycle |
| `Rotational_Speed` | Integer | RPM | Yes | Range: `[500, 12000]` |
| `Torque_Nm` | Float | Nm | Yes | Range: `[0.0, 250.0]` |
| `Defect_Flag` | Binary / Integer | 0/1 | No | 0 (Normal Pass), 1 (Defect / Failure) |
| `Defect_Category` | Categorical | — | Yes | `TWF`, `HDF`, `PWF`, `OSF`, `RNF` |

## 2. Data Quality & Warning Triggers
- **Missingness Warning**: Raised if column null rate exceeds 5.0%.
- **Zero Variance Alert**: Raised if standard deviation < 1e-6.
- **Outlier Clamping**: Extreme spikes beyond 3.5x IQR flagged for operator review without modifying raw storage.
- **Data Drift**: Wasserstein distance > 0.15 triggers model re-calibration advisory.
