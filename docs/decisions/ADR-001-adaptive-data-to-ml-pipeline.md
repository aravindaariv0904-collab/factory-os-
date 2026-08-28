# ADR 001: Adaptive Data-to-ML Operator Workflow Pipeline

## Context
Manufacturing operators need full transparency when uploading raw CSV/telemetry data and transitioning it into ML model training, failure predictions, prescriptive recommendations, and certified MES reports.

## Decision
Implement an 11-stage operator journey in the Frontend (`/upload` and dashboard workflows) with explicit validation steps:
`User -> Upload -> Understand data -> Review warnings -> Approve mapping -> Run processing -> View model -> Review prediction -> Understand recommendation -> Approve action -> View report`

## Consequences
- Operator maintains human-in-the-loop oversight before triggering expensive ML compute or MES machine parameter modifications.
- Raw datasets are preserved immutable in raw storage while derived features undergo versioned cleaning.
- Prescriptive recommendations require explicit operator approval before dispatching MES work orders.
