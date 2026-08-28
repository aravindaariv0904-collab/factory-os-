# Factory OS — Frontend Navigation Architecture

## 1. Modular Workspace Navigation Model

Factory OS is organized into distinct, modular functional workspaces rather than a single monolithic wizard:

### Workspace Taxonomy
* **CORE**
  * `/overview`: Executive manufacturing dashboard, live plant status, operational KPIs, and active anomalies.
  * `/copilot`: Decision Intelligence multi-agent copilot grounded in the active production & dataset context.

* **OPERATIONS**
  * `/production`: MES work orders, shift schedules, line utilization, and downtime incident logs.
  * `/maintenance`: Asset health telemetry, RUL prognostics, vibration analysis, and work order dispatch.
  * `/quality`: Quality yield metrics, defect distribution Pareto, inspection logs, and root cause hints.
  * `/inventory`: Raw material stock, safety thresholds, and automated bulk reorder wizard.

* **INTELLIGENCE**
  * `/analytics`: Multi-shift correlation analysis, thermal dynamics, and CSV dataset export.
  * `/ai-ml`: Scoped model registry, hyperparameters, validation curves, and confusion matrix.
  * `/recommendations`: Prioritized prescriptive recommendations with lifecycle approval states.
  * `/alerts`: Real-time threshold alarms and safety breach triage.

* **DATA**
  * `/upload` (Data Management): Dataset ingestion, profiling, quality review, mapping, and pipeline console.
  * `/datasets`: Versioned dataset catalog and source repository.

* **MANAGEMENT**
  * `/reports`: Scheduled daily shift digests, weekly briefs, and direct intelligence exports.
  * `/audit`: Comprehensive compliance audit trail with user identity and timestamp.
  * `/system-health`: Live backend service state (API, Database, Worker, IoT Gateway).
  * `/settings`: Organization profile, multi-site topology, RBAC permissions, and API tokens.
