import random
from datetime import datetime
from typing import List, Dict, Any

class SyntheticIndustrialDataGenerator:
    """Generates production-grade synthetic IIoT telemetry data for testbed simulations."""
    @staticmethod
    def generate_telemetry_batch(machine_count: int = 5) -> List[Dict[str, Any]]:
        batch = []
        for i in range(1, machine_count + 1):
            machine_id = f"mch_10{i}"
            temp = round(random.uniform(42.0, 88.0), 1)
            vib = round(random.uniform(1.0, 7.5), 2)
            press = round(random.uniform(180.0, 220.0), 1)
            health = max(0.0, min(100.0, 100.0 - (vib * 6.0 + max(0.0, temp - 50.0) * 0.8)))
            
            batch.append({
                "machine_id": machine_id,
                "timestamp": datetime.now().isoformat(),
                "temperature_deg_c": temp,
                "vibration_mm_s": vib,
                "hydraulic_pressure_bar": press,
                "computed_health_index": round(health, 1),
                "status": "Running" if health > 60 else "Warning" if health > 30 else "Critical",
            })
        return batch

synthetic_generator = SyntheticIndustrialDataGenerator()
