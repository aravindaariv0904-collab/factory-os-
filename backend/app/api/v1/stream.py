import asyncio
import random
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from backend.app.core.websocket import ws_manager

router = APIRouter()

@router.websocket("/telemetry/{machine_id}")
async def websocket_telemetry_stream(websocket: WebSocket, machine_id: str):
    """Broadcasts 100 Hz high-frequency IoT telemetry over WebSocket connection."""
    await ws_manager.connect(machine_id, websocket)
    try:
        while True:
            # Simulate 100 Hz sensor telemetry reading
            payload = {
                "machine_id": machine_id,
                "timestamp": datetime.now().isoformat(),
                "vibration_mm_s": round(random.uniform(1.0, 8.5), 2),
                "temperature_deg_c": round(random.uniform(42.0, 88.0), 1),
                "hydraulic_pressure_bar": round(random.uniform(180.0, 220.0), 1),
                "rpm": random.randint(1180, 1220),
                "status": "Running" if random.random() > 0.1 else "Warning",
            }
            await websocket.send_json(payload)
            await asyncio.sleep(0.01)  # 100 Hz -> 10ms interval
    except WebSocketDisconnect:
        ws_manager.disconnect(machine_id, websocket)

async def alert_event_generator():
    """Generates Server-Sent Events (SSE) for critical manufacturing alerts."""
    alerts_sample = [
        {"title": "CNC Mill X5 Vibration Spike (8.9 mm/s)", "severity": "Critical"},
        {"title": "Laser Cell 03 Gas Regulator Pressure Drop", "severity": "Warning"},
        {"title": "Pre-preg Carbon Fiber Low Stock", "severity": "Warning"},
    ]
    for alert in alerts_sample:
        yield f"data: {alert}\n\n"
        await asyncio.sleep(1.0)

@router.get("/alerts")
async def sse_alerts_stream():
    return StreamingResponse(alert_event_generator(), media_type="text/event-stream")
