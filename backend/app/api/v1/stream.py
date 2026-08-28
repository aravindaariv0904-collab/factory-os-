"""Real-time data streaming via WebSocket and Server-Sent Events.

IMPORTANT: All data streams in this file are SIMULATION MODE.
They generate synthetic values using random.uniform() for development
and demonstration purposes only. They do NOT represent live factory data.

To connect real telemetry:
  - Implement an OPC-UA or MQTT edge adapter
  - Route data through the Telemetry Gateway layer
  - Replace this file's generator with a real data source consumer

See docs/iot/README.md for the intended edge connectivity architecture.
"""
import asyncio
import json
import random
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from backend.app.core.websocket import ws_manager

router = APIRouter()

# Simulation envelope — added to every payload so clients can distinguish
# simulation from live data without parsing values.
_SIMULATION_ENVELOPE = {
    "mode": "SIMULATION",
    "data_source": "synthetic_random_generator",
    "note": "Connect a real OPC-UA/MQTT edge gateway to replace this stream. See docs/iot/README.md",
}


@router.websocket("/telemetry/{machine_id}")
async def websocket_telemetry_stream(websocket: WebSocket, machine_id: str):
    """Broadcasts simulated IoT telemetry over WebSocket connection.

    DATA MODE: SIMULATION — values are random.uniform(), not live sensor readings.
    Every payload includes 'mode: SIMULATION' to prevent client-side confusion.
    """
    await ws_manager.connect(machine_id, websocket)
    try:
        while True:
            # Simulated sensor telemetry — NOT live factory data
            payload = {
                **_SIMULATION_ENVELOPE,
                "machine_id": machine_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "vibration_mm_s": round(random.uniform(1.0, 8.5), 2),
                "temperature_deg_c": round(random.uniform(42.0, 88.0), 1),
                "hydraulic_pressure_bar": round(random.uniform(180.0, 220.0), 1),
                "rpm": random.randint(1180, 1220),
                "status": "Running" if random.random() > 0.1 else "Warning",
                "quality_flag": "SIMULATED",
            }
            await websocket.send_json(payload)
            await asyncio.sleep(0.1)  # 10 Hz; 100 Hz would be 0.01s
    except WebSocketDisconnect:
        ws_manager.disconnect(machine_id, websocket)


async def alert_event_generator():
    """Generates Server-Sent Events (SSE) for manufacturing alerts.

    DATA MODE: SIMULATION — these are static example alerts for UI development.
    """
    alerts_sample = [
        {
            **_SIMULATION_ENVELOPE,
            "title": "CNC Mill X5 Vibration Spike (8.9 mm/s)",
            "severity": "Critical",
        },
        {
            **_SIMULATION_ENVELOPE,
            "title": "Laser Cell 03 Gas Regulator Pressure Drop",
            "severity": "Warning",
        },
        {
            **_SIMULATION_ENVELOPE,
            "title": "Pre-preg Carbon Fiber Low Stock",
            "severity": "Warning",
        },
    ]
    for alert in alerts_sample:
        yield f"data: {json.dumps(alert)}\n\n"
        await asyncio.sleep(1.0)


@router.get("/alerts")
async def sse_alerts_stream():
    """SSE stream of manufacturing alerts. DATA MODE: SIMULATION."""
    return StreamingResponse(alert_event_generator(), media_type="text/event-stream")
