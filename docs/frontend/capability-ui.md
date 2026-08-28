# Factory OS — Capability UI & Truthful Missing Data UX

## 1. Capability States
Every operational module and analytics card renders a truthful readiness indicator:

| Capability Status | Visual Indicator | Meaning & UX Action |
| :--- | :--- | :--- |
| `AVAILABLE` | 🟢 Emerald Badge | Fully supported by active dataset and live edge telemetry. |
| `PARTIAL` | 🟡 Amber Badge | Core metrics rendered; secondary sensor features unavailable. |
| `INSUFFICIENT_DATA` | 🔴 Rose Badge | Critical fields absent; displays required vs. missing field card. |
| `SIMULATION_MODE` | 🔵 Cyan / Amber | Fallback or synthetic stream active; clearly labeled in UI. |
| `BACKEND_UNAVAILABLE` | ⚪ Slate / Rose | Backend unreachable; prompts operator to inspect network connection. |

## 2. Insufficient Data UX Template
When an essential metric cannot be calculated due to missing schema fields:
```text
┌────────────────────────────────────────────────────────┐
│  OEE CALCULATION — INSUFFICIENT DATA                  │
│                                                        │
│  Missing Fields:                                       │
│  • cycle_time (Required for Performance efficiency)    │
│  • planned_operating_time (Required for Availability)  │
│  • good_count (Required for Quality pass rate)         │
│                                                        │
│  [ Connect SCADA Pipeline ]   [ Upload New Dataset ]   │
└────────────────────────────────────────────────────────┘
```
